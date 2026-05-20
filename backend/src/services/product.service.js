const Product = require('../domains/products/product.model');
const Category = require('../domains/products/productCategory.model');
const auditWorkflow = require('./workflows/auditWorkflow.service');

class ProductService {
  async getCategories() {
    const categories = await Category.find({}).sort({ name: 1 });
    console.log(`[ProductService] getCategories called. Found ${categories.length} categories.`);
    return categories;
  }

  async createCategory(data, userId) {
    console.log(`[ProductService] createCategory called with name: ${data.name}`);
    const category = new Category({ ...data, createdBy: userId });
    const saved = await category.save();
    console.log(`[ProductService] category successfully saved to DB with _id: ${saved._id}`);
    return saved;
  }

  async updateCategoryStatus(categoryId, status, userId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }
    
    const previousStatus = category.status;
    category.status = status;
    category.updatedBy = userId;
    await category.save();

    await auditWorkflow.log({
      action: 'UPDATE',
      performedBy: userId,
      targetModel: 'ProductCategory',
      targetId: category._id,
      previousValue: { status: previousStatus },
      newValue: { status },
      notes: `Category status updated to ${status}`
    });

    return category;
  }

  async deleteCategory(categoryId, userId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }

    // Verify if category is used by any products before deleting
    const linkedProducts = await Product.countDocuments({ category: categoryId, isDeleted: { $ne: true } });
    if (linkedProducts > 0) {
      const err = new Error(`Cannot delete category. It is linked to ${linkedProducts} active products.`);
      err.statusCode = 400;
      throw err;
    }

    await category.softDelete(userId);

    await auditWorkflow.log({
      action: 'DELETE',
      performedBy: userId,
      targetModel: 'ProductCategory',
      targetId: category._id,
      notes: 'Category deleted'
    });

    return true;
  }

  async listProducts(filters = {}) {
    const query = {};
    
    if (filters.category && filters.category !== 'All') query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.pricingType) query['pricingRules.type'] = filters.pricingType;
    
    if (filters.search) {
      query.$or = [
        { productName: { $regex: filters.search, $options: 'i' } },
        { productCode: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    return await Product.find(query).populate('category').sort({ createdAt: -1 });
  }

  async getProductDetails(id) {
    const product = await Product.findById(id).populate('category subCategory');
    if (!product) throw new Error('Product not found');
    return product;
  }

  async createProduct(data, userId) {
    if (data.sku === '') {
      data.sku = undefined;
    }

    const product = new Product({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    
    const saved = await product.save();
    await auditWorkflow.log({
      action: 'PRODUCT_CREATED',
      performedBy: userId,
      targetModel: 'Product',
      targetId: saved._id,
      newValue: saved.toObject()
    });
    return saved;
  }

  async updateProduct(id, data, userId) {
    if (data.sku === '') {
      data.sku = undefined;
      // If we need to explicitly unset the field in mongo:
      data.$unset = { sku: 1 };
    }

    const oldProduct = await Product.findById(id).lean();
    if (!oldProduct) throw new Error('Product not found');
    
    // Concurrency check
    if (data.__v !== undefined && data.__v !== oldProduct.__v) {
      const error = new Error('VersionError');
      error.name = 'VersionError';
      throw error;
    }
    
    data.updatedBy = userId;
    const updated = await Product.findByIdAndUpdate(id, data, { new: true });
    
    await auditWorkflow.trackUpdate('Product', id, userId, oldProduct, updated.toObject());
    return updated;
  }

  async deleteProduct(id, userId) {
    const product = await Product.findById(id);
    if (!product) throw new Error('Product not found');
    
    await product.softDelete(userId);

    await auditWorkflow.log({
      action: 'DELETE',
      performedBy: userId,
      targetModel: 'Product',
      targetId: id,
      notes: 'Product deleted'
    });

    return true;
  }

  /**
   * COMMERCIAL PRICING INTELLIGENCE ENGINE
   * Calculates live pricing based on inputs and rules.
   */
  async calculatePrice(productId, parameters = {}) {
    const product = await Product.findById(productId);
    if (!product || !product.pricingRules) throw new Error('Product or pricing rules not found');
    
    const rules = product.pricingRules;
    const baseCost = product.costBreakdown?.totalBaseCost || 0;
    
    let calculatedPrice = 0;
    let calculations = {};
    
    const { width, height, quantity = 1, sizeLabel, rentalDuration } = parameters;

    switch (rules.type) {
      case 'FIXED_PRICE':
        calculatedPrice = rules.sellingPrice * quantity;
        calculations = { unitPrice: rules.sellingPrice, quantity };
        break;

      case 'PER_SFT':
        if (!width || !height) throw new Error('Width and height required for PER_SFT pricing');
        const sft = (width * height);
        const billableSft = rules.minArea ? Math.max(sft, rules.minArea) : sft;
        const unitPrice = billableSft * rules.ratePerSft;
        calculatedPrice = unitPrice * quantity;
        calculations = { sft, billableSft, ratePerSft: rules.ratePerSft, unitPrice, quantity };
        break;

      case 'SIZE_BASED':
        if (!sizeLabel) throw new Error('sizeLabel required for SIZE_BASED pricing');
        const sizeMatch = rules.sizePrices.find(s => s.sizeLabel === sizeLabel);
        if (!sizeMatch) throw new Error(`Pricing not found for size: ${sizeLabel}`);
        calculatedPrice = sizeMatch.price * quantity;
        calculations = { sizeLabel, unitPrice: sizeMatch.price, quantity };
        break;

      case 'QUANTITY_BASED':
        const slabMatch = rules.quantitySlabs.find(s => quantity >= s.minQty && quantity <= s.maxQty);
        if (!slabMatch) throw new Error(`Pricing slab not found for quantity: ${quantity}`);
        calculatedPrice = slabMatch.price * quantity;
        calculations = { unitPrice: slabMatch.price, quantity, slab: `${slabMatch.minQty}-${slabMatch.maxQty}` };
        break;

      case 'RENTAL_BASED':
        if (!rentalDuration || !rules.rentalRates[rentalDuration]) {
          throw new Error('Valid rentalDuration (daily, weekly, monthly) required');
        }
        const rate = rules.rentalRates[rentalDuration];
        calculatedPrice = (rate * quantity) + (rules.rentalRates.securityDeposit || 0);
        calculations = { rate, duration: rentalDuration, quantity, securityDeposit: rules.rentalRates.securityDeposit };
        break;

      default:
        throw new Error('Invalid pricing type');
    }

    // Add global constraints
    if (rules.installationCharge && parameters.includeInstallation) {
      calculatedPrice += rules.installationCharge;
      calculations.installationCharge = rules.installationCharge;
    }

    // Tax calculation
    const taxAmount = calculatedPrice * (rules.taxPercentage / 100);
    const finalPrice = calculatedPrice + taxAmount;
    
    // Profitability analysis
    const totalCost = baseCost * quantity;
    const grossProfit = calculatedPrice - totalCost;
    const marginPercentage = totalCost > 0 ? (grossProfit / totalCost) * 100 : 100;
    
    const isBelowMinimumMargin = rules.minimumMargin && marginPercentage < rules.minimumMargin;
    const isBelowMinimumPrice = rules.minimumSellingPrice && calculatedPrice < (rules.minimumSellingPrice * quantity);

    return {
      success: true,
      data: {
        productId: product._id,
        productName: product.productName,
        pricingType: rules.type,
        calculations,
        financials: {
          totalBaseCost: totalCost,
          calculatedSellingPrice: calculatedPrice,
          taxPercentage: rules.taxPercentage,
          taxAmount,
          finalAmount: finalPrice,
          grossProfit,
          marginPercentage: parseFloat(marginPercentage.toFixed(2))
        },
        constraints: {
          isBelowMinimumMargin,
          isBelowMinimumPrice,
          requiresApproval: isBelowMinimumMargin || isBelowMinimumPrice
        }
      }
    };
  }
}

module.exports = new ProductService();

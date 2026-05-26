const productService = require('../../services/product.service');

exports.getCategories = async (req, res, next) => {
  try {
    const data = await productService.getCategories();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const data = await productService.createCategory(req.body, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.updateCategoryStatus = async (req, res, next) => {
  try {
    const data = await productService.updateCategoryStatus(req.params.id, req.body.status, req.user._id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await productService.deleteCategory(req.params.id, req.user._id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.listProducts = async (req, res, next) => {
  try {
    const data = await productService.listProducts(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getProductDetails = async (req, res, next) => {
  try {
    const data = await productService.getProductDetails(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const data = await productService.createProduct(req.body, req.user._id);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const data = await productService.updateProduct(req.params.id, req.body, req.user._id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id, req.user._id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.calculatePrice = async (req, res, next) => {
  try {
    // Expected in body: { productId, parameters: { width, height, quantity, sizeLabel, rentalDuration, includeInstallation } }
    const { productId, parameters } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, code: 'MISSING_PRODUCT', message: 'productId is required' });
    }
    const result = await productService.calculatePrice(productId, parameters);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Removed deprecated variant routes since we are moving to pricing rules on master product
exports.createVariant = async (req, res, next) => {
  res.status(410).json({ success: false, message: 'Variants are deprecated. Use Pricing Rules on Master Product.' });
};
exports.updatePricing = async (req, res, next) => {
  res.status(410).json({ success: false, message: 'Variants are deprecated. Use Pricing Rules on Master Product.' });
};
exports.getPrice = async (req, res, next) => {
  res.status(410).json({ success: false, message: 'Use POST /api/products/calculate-price instead' });
};

// Stats for dashboard
exports.getStats = async (req, res, next) => {
  try {
    const Product = require('../../domains/products/product.model');
    const Category = require('../../domains/products/productCategory.model');
    
    const totalProducts = await Product.countDocuments({ isDeleted: false });
    const activeCategories = await Category.countDocuments({ isDeleted: false, status: 'Active' });
    const lowStock = await Product.countDocuments({
      isDeleted: false,
      $expr: { $lte: ['$stockQuantity', '$lowStockAlert'] }
    });
    
    res.json({
      success: true,
      data: {
        totalProducts,
        activeCategories,
        lowStock
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getLowMarginProducts = async (req, res, next) => {
  try {
    // This requires aggregation to compare pricing dynamically.
    // For now, return a placeholder or simple query if minimum margin is stored.
    res.json({ success: true, data: [] });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const data = await productService.updateProduct(req.params.id, { status: req.body.status }, req.user._id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.adjustStock = async (req, res, next) => {
  try {
    const { quantity, type, notes } = req.body;
    const Product = require('../../domains/products/product.model');
    const InventoryMovement = require('../../domains/products/inventoryMovement.model');
    
    const product = await Product.findById(req.params.id);
    if (!product) throw new Error('Product not found');
    
    const prev = product.stockQuantity;
    if (type === 'STOCK_IN') product.stockQuantity += quantity;
    if (type === 'STOCK_OUT') product.stockQuantity -= quantity;
    
    await product.save();
    
    await InventoryMovement.create({
      product: product._id,
      type,
      quantity,
      previousStock: prev,
      newStock: product.stockQuantity,
      notes,
      performedBy: req.user._id
    });
    
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

const ClientType = require('../../domains/products/clientType.model');
const Product = require('../../domains/products/product.model');

exports.getClientTypes = async (req, res, next) => {
  try {
    const data = await ClientType.find({ 'softDelete.isDeleted': { $ne: true } }).sort({ createdAt: 1 });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.createClientType = async (req, res, next) => {
  try {
    const { name, multiplier } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    
    // Generate key from name, e.g. "Agent Renewal" -> "agentRenewal"
    const key = name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(' ')
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
      
    const clientType = new ClientType({
      name,
      key,
      multiplier: Number(multiplier) || 1.0,
      createdBy: req.user._id
    });
    
    await clientType.save();
    res.status(201).json({ success: true, data: clientType });
  } catch (err) {
    next(err);
  }
};

exports.deleteClientType = async (req, res, next) => {
  try {
    const clientType = await ClientType.findById(req.params.id);
    if (!clientType) return res.status(404).json({ success: false, message: 'Client type not found' });
    
    await clientType.softDelete(req.user._id);
    res.json({ success: true, message: 'Client type deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.priceEngine = async (req, res, next) => {
  try {
    const { variantId, productId, clientType } = req.query;
    const id = productId || variantId;
    if (!id) return res.status(400).json({ success: false, message: 'productId or variantId is required' });
    
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    const typeKey = (clientType || 'Retail').toLowerCase().replace(/[^a-z]/g, '');
    const clientTypeDoc = await ClientType.findOne({
      $or: [
        { key: clientType },
        { name: new RegExp(`^${clientType}$`, 'i') },
        { key: typeKey }
      ],
      'softDelete.isDeleted': { $ne: true }
    });
    
    const key = clientTypeDoc ? clientTypeDoc.key : typeKey;
    let unitPrice = 0;
    let isCustomCost = false;

    if (product.clientTypePricing && product.clientTypePricing.get(key) !== undefined) {
      unitPrice = product.clientTypePricing.get(key);
      isCustomCost = true;
    } else {
      const multiplier = clientTypeDoc ? clientTypeDoc.multiplier : 1.0;
      const sellingPrice = product.pricingRules?.sellingPrice || 0;
      unitPrice = parseFloat((sellingPrice * multiplier).toFixed(2));
    }
    
    res.json({
      success: true,
      data: {
        unitPrice,
        isCustomCost,
        sellingPrice: product.pricingRules?.sellingPrice || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

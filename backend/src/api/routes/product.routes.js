const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, authorize } = require('../../guards/auth.guard');
const idempotency = require('../middlewares/idempotency');

router.use(protect);

// ── Dashboard / Stats ───────────────────────────────────────────────────────
router.get('/stats', productController.getStats);
router.get('/low-margin', productController.getLowMarginProducts);

// ── Categories ──────────────────────────────────────────────────────────────
router.get('/categories', productController.getCategories);
router.post('/categories', authorize('ADMIN', 'SALES_MANAGER'), productController.createCategory);
router.patch('/categories/:id/status', authorize('ADMIN', 'SALES_MANAGER'), productController.updateCategoryStatus);
router.delete('/categories/:id', authorize('ADMIN', 'SALES_MANAGER'), productController.deleteCategory);

// ── Pricing Engine ──────────────────────────────────────────────────────────
router.post('/calculate-price', productController.calculatePrice);

// ── Products ────────────────────────────────────────────────────────────────
router.get('/', productController.listProducts);
router.get('/:id', productController.getProductDetails);
router.post('/', idempotency, authorize('ADMIN', 'SALES_MANAGER'), productController.createProduct);
router.patch('/:id', authorize('ADMIN', 'SALES_MANAGER'), productController.updateProduct);
router.delete('/:id', authorize('ADMIN', 'SALES_MANAGER'), productController.deleteProduct);

// ── Inventory & Specific Actions ────────────────────────────────────────────
router.patch('/:id/status', authorize('ADMIN', 'SALES_MANAGER'), productController.updateStatus);
router.post('/:id/stock', authorize('ADMIN'), productController.adjustStock);

module.exports = router;

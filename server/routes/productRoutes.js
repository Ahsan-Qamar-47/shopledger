const express = require('express');
const { body, param } = require('express-validator');
const {
  getLowStockProducts,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Apply auth middleware to all product routes
router.use(protect);

// IMPORTANT: /low-stock MUST be defined BEFORE /:id
router.get('/low-stock', getLowStockProducts);

router
  .route('/')
  .get(getProducts)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Product name is required'),
      body('sku').trim().notEmpty().withMessage('Product SKU is required'),
      body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a number greater than or equal to 0'),
      body('stockQuantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock quantity must be an integer greater than or equal to 0'),
      body('lowStockThreshold')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Low stock threshold must be an integer greater than or equal to 0')
    ],
    validate,
    createProduct
  );

router
  .route('/:id')
  .get(
    [param('id').isMongoId().withMessage('Invalid Product ID format')],
    validate,
    getProductById
  )
  .put(
    [
      param('id').isMongoId().withMessage('Invalid Product ID format'),
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
      body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a number greater than or equal to 0'),
      body('stockQuantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock quantity must be an integer greater than or equal to 0'),
      body('lowStockThreshold')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Low stock threshold must be an integer greater than or equal to 0')
    ],
    validate,
    updateProduct
  )
  .delete(
    [param('id').isMongoId().withMessage('Invalid Product ID format')],
    validate,
    deleteProduct
  );

module.exports = router;

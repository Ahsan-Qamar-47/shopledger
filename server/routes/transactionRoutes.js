const express = require('express');
const { body } = require('express-validator');
const { createSale } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Apply auth middleware to all transaction routes
router.use(protect);

router.post(
  '/sale',
  [
    body('customerId').isMongoId().withMessage('Invalid customer ID format'),
    body('items').isArray({ min: 1 }).withMessage('Items array is required and cannot be empty'),
    body('items.*.productId').isMongoId().withMessage('Invalid product ID format in items'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be an integer greater than 0'),
    body('date').optional().isISO8601().toDate().withMessage('Invalid date format'),
    body('notes').optional().trim().isString().withMessage('Notes must be a string')
  ],
  validate,
  createSale
);

module.exports = router;

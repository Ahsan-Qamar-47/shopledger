const express = require('express');
const { body } = require('express-validator');
const { createSale, createPayment, getCustomerStatement } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Apply auth middleware to all transaction routes
router.use(protect);

router.post(
  '/sale',
  [
    body('customerId').isMongoId().withMessage('Invalid customer ID format'),
    body('isInventorySale').optional().isBoolean().withMessage('isInventorySale must be a boolean'),
    body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('items').optional().isArray().withMessage('Items must be an array'),
    body('items.*.productId').optional().isMongoId().withMessage('Invalid product ID format in items'),
    body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be an integer greater than 0'),
    body('date').optional().isISO8601().toDate().withMessage('Invalid date format'),
    body('notes').optional().trim().isString().withMessage('Notes must be a string')
  ],
  validate,
  createSale
);

router.post(
  '/payment',
  [
    body('customerId').isMongoId().withMessage('Invalid customer ID format'),
    body('amount').isFloat({ gt: 0 }).withMessage('Payment amount must be greater than 0'),
    body('date').optional().isISO8601().toDate().withMessage('Invalid date format'),
    body('notes').optional().trim().isString().withMessage('Notes must be a string')
  ],
  validate,
  createPayment
);

router.get(
  '/customer/:customerId',
  getCustomerStatement
);

module.exports = router;

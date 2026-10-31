const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Apply auth protection and Owner RBAC restriction to all expense routes
router.use(protect);
router.use(checkRole('Owner'));

router.post(
  '/',
  [
    body('category')
      .trim()
      .notEmpty()
      .withMessage('Expense category is required')
      .isLength({ max: 100 })
      .withMessage('Category cannot exceed 100 characters'),
    body('amount')
      .notEmpty()
      .withMessage('Expense amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Expense amount must be a positive number greater than 0'),
    body('date')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Invalid date format (ISO 8601 required)'),
    body('notes')
      .optional()
      .trim()
      .isString()
      .withMessage('Notes must be a string')
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  validate,
  createExpense
);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().trim().isString(),
    query('startDate').optional().isISO8601().withMessage('Invalid startDate format'),
    query('endDate').optional().isISO8601().withMessage('Invalid endDate format'),
    query('includeInactive').optional().isIn(['true', 'false', 'only']).withMessage('includeInactive must be true, false, or only')
  ],
  validate,
  getExpenses
);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid expense ID format')],
  validate,
  getExpenseById
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid expense ID format'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('date').optional().isISO8601().toDate().withMessage('Invalid date format'),
    body('notes').optional().trim().isString()
  ],
  validate,
  updateExpense
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid expense ID format')],
  validate,
  deleteExpense
);

module.exports = router;

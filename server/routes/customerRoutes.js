const express = require('express');
const { body, param } = require('express-validator');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Apply auth middleware to all customer routes
router.use(protect);

router
  .route('/')
  .get(getCustomers)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Customer name is required'),
      body('phone')
        .trim()
        .notEmpty()
        .withMessage('Customer phone number is required')
        .matches(/^[0-9+\-\s()]{7,20}$/)
        .withMessage('Please provide a valid phone number')
    ],
    validate,
    createCustomer
  );

router
  .route('/:id')
  .get(
    [param('id').isMongoId().withMessage('Invalid Customer ID format')],
    validate,
    getCustomerById
  )
  .put(
    [
      param('id').isMongoId().withMessage('Invalid Customer ID format'),
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      body('phone')
        .optional()
        .trim()
        .matches(/^[0-9+\-\s()]{7,20}$/)
        .withMessage('Please provide a valid phone number')
    ],
    validate,
    updateCustomer
  )
  .delete(
    [param('id').isMongoId().withMessage('Invalid Customer ID format')],
    validate,
    deleteCustomer
  );

module.exports = router;

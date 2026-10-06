const Customer = require('../models/Customer');

/**
 * Escapes regex special characters to prevent regex injection attacks
 * @param {string} string 
 * @returns {string}
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * @desc    Get all customers for logged in user (with search and pagination)
 * @route   GET /api/customers
 * @access  Private
 */
const getCustomers = async (req, res, next) => {
  try {
    const { search, limit = 50, page = 1 } = req.query;

    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // User-scoped active filter
    const query = {
      userId: req.user._id,
      isActive: true
    };

    // Case-insensitive search on name or phone
    if (search && search.trim() !== '') {
      const escaped = escapeRegex(search.trim());
      const searchRegex = new RegExp(escaped, 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex }
      ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      data: customers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single customer by ID
 * @route   GET /api/customers/:id
 * @access  Private
 */
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: {}
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new customer
 * @route   POST /api/customers
 * @access  Private
 */
const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, totalBalance = 0 } = req.body;

    const customer = await Customer.create({
      userId: req.user._id,
      name,
      phone,
      totalBalance
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update customer
 * @route   PUT /api/customers/:id
 * @access  Private
 */
const updateCustomer = async (req, res, next) => {
  try {
    const { name, phone, totalBalance } = req.body;

    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: {}
      });
    }

    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (totalBalance !== undefined) customer.totalBalance = totalBalance;

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete customer
 * @route   DELETE /api/customers/:id
 * @access  Private
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: {}
      });
    }

    // Block deletion if non-zero balance
    if (customer.totalBalance !== 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer with non-zero balance (${customer.totalBalance > 0 ? '+' : ''}${customer.totalBalance}). Please settle balance first.`,
        error: {}
      });
    }

    // Soft delete
    customer.isActive = false;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};

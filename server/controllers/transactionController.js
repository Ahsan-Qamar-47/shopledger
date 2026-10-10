const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

/**
 * @desc    Create a sale transaction
 * @route   POST /api/transactions/sale
 * @access  Private
 */
const createSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    let transaction;

    await session.withTransaction(async () => {
      const { customerId, items, date, notes } = req.body;
      const userId = req.user._id;

      // 1. Verify customer belongs to user and is active
      const customer = await Customer.findOne({
        _id: customerId,
        userId,
        isActive: true
      }).session(session);

      if (!customer) {
        throw new Error('Customer not found or inactive');
      }

      // 2. Fetch products and calculate total amount
      let totalAmount = 0;
      const transactionItems = [];

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error('Items array cannot be empty');
      }

      for (const item of items) {
        // Fetch product from DB
        const product = await Product.findOne({
          _id: item.productId,
          userId,
          isActive: true
        }).session(session);

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found or inactive`);
        }

        // Check stock and deduct (safe stock deduction)
        // Conditional update so it never goes negative
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: product._id,
            stockQuantity: { $gte: item.quantity }
          },
          {
            $inc: { stockQuantity: -item.quantity }
          },
          { new: true, session }
        );

        if (!updatedProduct) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        // Snapshot price and name
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        transactionItems.push({
          productId: product._id,
          name: product.name,
          quantity: item.quantity,
          price: product.price // snapshot from DB
        });
      }

      // 3. Increment customer totalBalance
      customer.totalBalance += totalAmount;
      await customer.save({ session });

      // 4. Create Transaction record
      transaction = new Transaction({
        userId,
        customerId,
        type: 'SALE',
        amount: totalAmount,
        date: date || Date.now(),
        notes,
        items: transactionItems,
        balanceAfter: customer.totalBalance
      });

      await transaction.save({ session });
    });

    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Sale transaction completed successfully',
      data: transaction
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    // Check if error is thrown manually for bad request
    if (
      error.message === 'Customer not found or inactive' ||
      error.message === 'Items array cannot be empty' ||
      error.message.includes('not found or inactive') ||
      error.message.includes('Insufficient stock for product')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * @desc    Record a payment
 * @route   POST /api/transactions/payment
 * @access  Private
 */
const createPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    let transaction;

    await session.withTransaction(async () => {
      const { customerId, amount, date, notes } = req.body;
      const userId = req.user._id;

      // 1. Validate amount
      if (!amount || amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      // 2. Verify customer belongs to user
      const customer = await Customer.findOne({
        _id: customerId,
        userId,
        isActive: true
      }).session(session);

      if (!customer) {
        throw new Error('Customer not found or inactive');
      }

      // 3. Decrement customer totalBalance
      customer.totalBalance -= amount;
      await customer.save({ session });

      // 4. Create Transaction record
      transaction = new Transaction({
        userId,
        customerId,
        type: 'PAYMENT',
        amount,
        date: date || Date.now(),
        notes,
        balanceAfter: customer.totalBalance
      });

      await transaction.save({ session });
    });

    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: transaction
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    if (
      error.message === 'Payment amount must be greater than 0' ||
      error.message === 'Customer not found or inactive'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * @desc    Get customer statement
 * @route   GET /api/transactions/customer/:customerId
 * @access  Private
 */
const getCustomerStatement = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 1. Verify customer belongs to user
    const customer = await Customer.findOne({
      _id: customerId,
      userId,
      isActive: true
    }).select('name phone totalBalance');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or inactive'
      });
    }

    // 2. Get transactions with pagination
    const transactions = await Transaction.find({
      customerId,
      userId
    })
      .sort({ date: -1 }) // Newest first
      .skip(skip)
      .limit(limit);

    // 3. Get total count for pagination metadata
    const total = await Transaction.countDocuments({
      customerId,
      userId
    });

    res.status(200).json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          totalBalance: customer.totalBalance
        },
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  createPayment,
  getCustomerStatement
};

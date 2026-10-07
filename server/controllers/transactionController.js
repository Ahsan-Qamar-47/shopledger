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
    session.startTransaction();

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
    const transaction = new Transaction({
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

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Sale transaction completed successfully',
      data: transaction
    });

  } catch (error) {
    // Abort transaction on failure
    await session.abortTransaction();
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

module.exports = {
  createSale
};

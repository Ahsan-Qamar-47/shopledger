const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
}, { _id: false });

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    type: {
      type: String,
      enum: ['SALE', 'PAYMENT'],
      default: 'SALE',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now,
      required: true
    },
    notes: {
      type: String,
      trim: true
    },
    items: [transactionItemSchema],
    balanceAfter: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast querying by customer and date
transactionSchema.index({ customerId: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);

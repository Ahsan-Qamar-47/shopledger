const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true
    },
    sku: {
      type: String,
      required: [true, 'Please provide product SKU'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Please provide product price'],
      min: [0, 'Price cannot be negative']
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
      default: 0
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, 'Low stock threshold cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index per user for SKU
productSchema.index({ userId: 1, sku: 1 }, { unique: true });
productSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);

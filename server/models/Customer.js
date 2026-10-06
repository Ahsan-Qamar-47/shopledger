const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Please provide customer name'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please provide customer phone number'],
      trim: true
    },
    totalBalance: {
      type: Number,
      default: 0
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

// Compound indexes for user-scoped queries
customerSchema.index({ userId: 1, phone: 1 });
customerSchema.index({ userId: 1, name: 1 });
customerSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Customer', customerSchema);

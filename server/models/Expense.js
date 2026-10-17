const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID']
    },
    category: {
      type: String,
      required: [true, 'Please provide an expense category'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Please provide expense amount'],
      min: [0, 'Expense amount cannot be negative']
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Please provide expense date']
    },
    notes: {
      type: String,
      trim: true,
      default: ''
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

// Indexes for optimized querying
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Expense', expenseSchema);

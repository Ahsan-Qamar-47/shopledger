const Expense = require('../models/Expense');

/**
 * @desc    Create a new expense
 * @route   POST /api/expenses
 * @access  Private
 */
const createExpense = async (req, res, next) => {
  try {
    const { category, amount, date, notes } = req.body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be a positive number'
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Expense category is required'
      });
    }

    const expense = await Expense.create({
      userId: req.user._id,
      category: category.trim(),
      amount: parsedAmount,
      date: date || Date.now(),
      notes: notes ? notes.trim() : '',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all expenses (with soft-delete filtering & pagination)
 * @route   GET /api/expenses
 * @access  Private
 */
const getExpenses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      startDate,
      endDate,
      includeInactive = 'false'
    } = req.query;

    const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 50, 100));
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {
      userId: req.user._id
    };

    // Soft-delete filtering: default to active expenses only
    if (includeInactive === 'true') {
      // Include all expenses (active and soft-deleted)
    } else if (includeInactive === 'only') {
      // Include only soft-deleted expenses
      query.isActive = false;
    } else {
      // Default: active expenses only
      query.isActive = true;
    }

    // Category filter
    if (category && category.trim() !== '') {
      query.category = category.trim();
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const [total, expenses, aggregateSum] = await Promise.all([
      Expense.countDocuments(query),
      Expense.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Expense.aggregate([
        { $match: query },
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
      ])
    ]);

    const totalAmount = aggregateSum.length > 0 ? aggregateSum[0].totalAmount : 0;

    res.status(200).json({
      success: true,
      count: expenses.length,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      totalAmount,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single expense by ID
 * @route   GET /api/expenses/:id
 * @access  Private
 */
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an expense
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
const updateExpense = async (req, res, next) => {
  try {
    const { category, amount, date, notes } = req.body;

    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or inactive'
      });
    }

    if (category !== undefined) expense.category = category.trim();
    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number'
        });
      }
      expense.amount = parsedAmount;
    }
    if (date !== undefined) expense.date = date;
    if (notes !== undefined) expense.notes = notes.trim();

    await expense.save();

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete an expense
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or already deleted'
      });
    }

    // Soft delete by setting isActive to false
    expense.isActive = false;
    await expense.save();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      data: {
        _id: expense._id,
        isActive: expense.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
};

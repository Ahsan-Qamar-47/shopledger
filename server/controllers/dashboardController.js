const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const moment = require('moment-timezone');

/**
 * Helper to aggregate sales, profit, expenses, and calculate net income for a given date range
 *
 * @param {mongoose.Types.ObjectId} userId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<{totalSales: number, profitAmount: number, grossProfit: number, totalExpenses: number, netIncome: number}>}
 */
const aggregateMetricsForRange = async (userId, startDate, endDate) => {
  const [salesAgg, expenseAgg] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'SALE',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$amount' },
          profitAmount: { $sum: '$profitAmount' }
        }
      }
    ]),
    Expense.aggregate([
      {
        $match: {
          userId: userId,
          isActive: true,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ])
  ]);

  const totalSales = salesAgg.length > 0 ? salesAgg[0].totalSales : 0;
  const grossProfit = salesAgg.length > 0 ? salesAgg[0].profitAmount : 0;
  const profitAmount = grossProfit;
  const totalExpenses = expenseAgg.length > 0 ? expenseAgg[0].totalExpenses : 0;
  const netIncome = grossProfit - totalExpenses;

  return {
    totalSales,
    profitAmount,
    grossProfit,
    totalExpenses,
    netIncome
  };
};

/**
 * @desc    Get dashboard statistics with date-range aggregation pipelines
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const timezone = 'Asia/Karachi';
    const { range = 'today', startDate: customStart, endDate: customEnd } = req.query;

    const now = moment.tz(timezone);
    const endOfDay = now.clone().endOf('day').toDate();

    // Predefined date boundaries
    const todayStart = now.clone().startOf('day').toDate();
    const weekStart = now.clone().startOf('week').toDate();
    const monthStart = now.clone().startOf('month').toDate();

    // Determine target range for selected metrics
    let selectedStart = todayStart;
    let selectedEnd = endOfDay;
    let selectedRangeKey = (range || 'today').toLowerCase();

    if (customStart && customEnd) {
      selectedStart = new Date(customStart);
      selectedEnd = new Date(customEnd);
      selectedRangeKey = 'custom';
    } else if (selectedRangeKey === 'week') {
      selectedStart = weekStart;
    } else if (selectedRangeKey === 'month') {
      selectedStart = monthStart;
    } else {
      selectedRangeKey = 'today';
      selectedStart = todayStart;
    }

    // Run aggregations concurrently
    const [
      selectedMetrics,
      todayMetrics,
      weekMetrics,
      monthMetrics,
      receivablesAgg,
      topDebtors,
      lowStockItems,
      salesLast7DaysAgg
    ] = await Promise.all([
      aggregateMetricsForRange(userId, selectedStart, selectedEnd),
      aggregateMetricsForRange(userId, todayStart, endOfDay),
      aggregateMetricsForRange(userId, weekStart, endOfDay),
      aggregateMetricsForRange(userId, monthStart, endOfDay),
      Customer.aggregate([
        {
          $match: {
            userId: userId,
            totalBalance: { $gt: 0 },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            totalReceivables: { $sum: '$totalBalance' }
          }
        }
      ]),
      Customer.find({
        userId: userId,
        totalBalance: { $gt: 0 },
        isActive: true
      })
        .sort({ totalBalance: -1 })
        .limit(5)
        .select('name phone totalBalance'),
      Product.find({
        userId: userId,
        isActive: true,
        $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] }
      })
        .select('name sku stockQuantity lowStockThreshold')
        .sort({ stockQuantity: 1 }),
      Transaction.aggregate([
        {
          $match: {
            userId: userId,
            type: 'SALE',
            date: {
              $gte: now.clone().subtract(6, 'days').startOf('day').toDate(),
              $lte: endOfDay
            }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: timezone } },
            sales: { $sum: '$amount' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])
    ]);

    const totalReceivables = receivablesAgg.length > 0 ? receivablesAgg[0].totalReceivables : 0;
    const lowStockItemCount = lowStockItems.length;

    // Format salesLast7Days for chart ensuring all 7 consecutive days are represented
    const salesLast7DaysMap = new Map();
    salesLast7DaysAgg.forEach((item) => {
      salesLast7DaysMap.set(item._id, item.sales);
    });

    const salesLast7Days = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = now.clone().subtract(i, 'days').format('YYYY-MM-DD');
      const displayDate = now.clone().subtract(i, 'days').format('MMM DD');
      salesLast7Days.push({
        date: dateStr,
        displayDate: displayDate,
        sales: salesLast7DaysMap.get(dateStr) || 0
      });
    }

    res.status(200).json({
      success: true,
      data: {
        // Selected range metrics (Day 3-4 aggregation pipeline)
        range: selectedRangeKey,
        dateRange: {
          startDate: selectedStart,
          endDate: selectedEnd
        },
        totalSales: selectedMetrics.totalSales,
        profitAmount: selectedMetrics.profitAmount,
        grossProfit: selectedMetrics.grossProfit,
        totalExpenses: selectedMetrics.totalExpenses,
        netIncome: selectedMetrics.netIncome,

        // Range breakdowns (Today, Week, Month)
        breakdown: {
          today: todayMetrics,
          week: weekMetrics,
          month: monthMetrics
        },

        // Legacy & extended UI metrics
        totalSalesToday: todayMetrics.totalSales,
        totalReceivables,
        topDebtors,
        lowStockItems,
        lowStockItemCount,
        salesLast7Days
      }
    });
  } catch (error) {
    next(error);
  }
};

const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const moment = require('moment-timezone');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const timezone = 'Asia/Karachi';

    // 1. Calculate totalReceivables (sum of positive balances)
    const receivablesAggregation = await Customer.aggregate([
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
    ]);
    const totalReceivables = receivablesAggregation.length > 0 ? receivablesAggregation[0].totalReceivables : 0;

    // 2. Calculate totalSalesToday (start of day to end of day in Asia/Karachi)
    const startOfDay = moment.tz(timezone).startOf('day').toDate();
    const endOfDay = moment.tz(timezone).endOf('day').toDate();

    const salesTodayAggregation = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'SALE',
          date: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalSalesToday: { $sum: '$amount' }
        }
      }
    ]);
    const totalSalesToday = salesTodayAggregation.length > 0 ? salesTodayAggregation[0].totalSalesToday : 0;

    // 3. Get topDebtors (top 5 with balance > 0)
    const topDebtors = await Customer.find({
      userId: userId,
      totalBalance: { $gt: 0 },
      isActive: true
    })
      .sort({ totalBalance: -1 })
      .limit(5)
      .select('name phone totalBalance');

    // 4. Get lowStockItems list plus lowStockItemCount
    const lowStockItems = await Product.find({
      userId: userId,
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] }
    })
      .select('name sku stockQuantity lowStockThreshold')
      .sort({ stockQuantity: 1 });
      
    const lowStockItemCount = lowStockItems.length;

    // 5. Optional: return salesLast7Days for the chart
    const sevenDaysAgo = moment.tz(timezone).subtract(6, 'days').startOf('day').toDate();
    
    const salesLast7DaysAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'SALE',
          date: { $gte: sevenDaysAgo, $lte: endOfDay }
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
    ]);

    // Format salesLast7Days for chart to ensure all 7 days are present even if 0
    const salesLast7DaysMap = new Map();
    salesLast7DaysAgg.forEach(item => {
      salesLast7DaysMap.set(item._id, item.sales);
    });

    const salesLast7Days = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = moment.tz(timezone).subtract(i, 'days').format('YYYY-MM-DD');
      const displayDate = moment.tz(timezone).subtract(i, 'days').format('MMM DD');
      salesLast7Days.push({
        date: dateStr,
        displayDate: displayDate,
        sales: salesLast7DaysMap.get(dateStr) || 0
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalReceivables,
        totalSalesToday,
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

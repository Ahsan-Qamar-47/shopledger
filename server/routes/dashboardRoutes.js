const express = require('express');
const router = express.Router();
const { getDashboardStats, getCashierDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/cashier-stats', getCashierDashboardStats);

module.exports = router;

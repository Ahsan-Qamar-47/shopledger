const User = require('../models/User');

/**
 * Helper to resolve target user IDs for a given user.
 * If user is a Cashier, resolves both the Cashier ID and their Shop Owner's ID,
 * allowing cashiers to view shop inventory, manage shop customers, and record sales.
 *
 * @param {Object} user - Authenticated user object from req.user
 * @returns {Promise<Array<mongoose.Types.ObjectId>>}
 */
const getTargetUserIds = async (user) => {
  if (!user) return [];
  const ids = [user._id];

  if (user.role === 'Cashier' && user.shopName) {
    const owner = await User.findOne({
      shopName: user.shopName,
      role: 'Owner'
    });
    if (owner && !ids.some((id) => id.toString() === owner._id.toString())) {
      ids.push(owner._id);
    }
  }

  return ids;
};

module.exports = {
  getTargetUserIds
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Checks if authenticated user has required role(s).
 * Reads req.user.role and returns 403 Forbidden if not an Owner (or matching role).
 *
 * @param {...string} roles - Allowed role(s), e.g. 'Owner' or 'Owner', 'Cashier'
 */
const checkRole = (...roles) => {
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied. User role not identified.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Requires ${allowedRoles.join(' or ')} role.`
      });
    }

    next();
  };
};

module.exports = { checkRole };

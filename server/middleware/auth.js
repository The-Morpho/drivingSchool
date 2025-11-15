// Simple authentication middleware
// In production, use JWT tokens instead of passing user info in headers

export const authenticate = (req, res, next) => {
  // For now, we expect user info in headers
  // This will be replaced with JWT token validation
  const accountId = req.headers['x-account-id'];
  const username = req.headers['x-username'];
  const userRole = req.headers['x-user-role'];
  const userType = req.headers['x-user-type']; // 'Manager', 'Staff', or 'Customer'

  if (!accountId || !username || !userRole || !userType) {
    return res.status(401).json({ error: 'Unauthorized - Missing user information' });
  }

  req.user = {
    accountId: accountId,
    username: username,
    role: userRole,
    userType: userType // Which collection the user belongs to
  };

  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    next();
  };
};

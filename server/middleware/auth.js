// Simple authentication middleware
// In production, use JWT tokens instead of passing user info in headers

export const authenticate = (req, res, next) => {
  // For now, we expect user info in headers
  // This will be replaced with JWT token validation
  // Express lowercases header keys so use lowercase names
  // Debug: print incoming headers for diagnosis (remove or reduce in production)
  try {
    // Print only a few headers to avoid flooding logs
    const incoming = {
      'x-account-id': req.headers['x-account-id'],
      'x-username': req.headers['x-username'] || req.headers['x-user'] || req.headers['username'],
      'x-user-role': req.headers['x-user-role'] || req.headers['x-role'] || req.headers['role'],
      'x-user-type': req.headers['x-user-type'] || req.headers['x-userType'] || req.headers['user-type'],
    };
    console.debug('[auth] incoming headers (partial):', incoming);
  } catch (e) {
    console.debug('[auth] error reading headers for debug log', e);
  }
  const accountIdHeader = req.headers['x-account-id'];
  const usernameHeader = req.headers['x-username'] || req.headers['x-user'] || req.headers['username'];
  const userRoleHeader = req.headers['x-user-role'] || req.headers['x-role'] || req.headers['role'];
  const userTypeHeader = req.headers['x-user-type'] || req.headers['x-userType'] || req.headers['user-type']; // 'Manager', 'Staff', or 'Customer'

  // Basic existence check
  if (!accountIdHeader || !usernameHeader || !userRoleHeader) {
    return res.status(401).json({ error: 'Unauthorized - Missing user information' });
  }

  // Normalize values
  const accountId = typeof accountIdHeader === 'string' && /^[0-9]+$/.test(accountIdHeader)
    ? parseInt(accountIdHeader, 10)
    : accountIdHeader;

  const username = String(usernameHeader);

  const roleRaw = String(userRoleHeader);
  const role = roleRaw ? roleRaw.toLowerCase() : '';

  // Determine a userType (capitalized) for backward compatibility
  let userType = userTypeHeader ? String(userTypeHeader) : '';
  if (!userType) {
    userType = userTypeFromRole(role);
  }
  userType = capitalize(userType);

  req.user = {
    accountId,
    username,
    // role stored in lowercase to make authorization checks simpler
    role,
    // userType kept capitalized for compatibility with older code
    userType,
  };

  // Debug: show the computed user object for diagnosis
  console.debug('[auth] computed req.user:', req.user);

  next();
};

export const authorize = (...roles) => {
  // Make role comparisons case-insensitive by normalizing to lowercase
  const allowed = roles.map(r => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    next();
  };
};

function capitalize(s) {
  if (!s) return s;
  return String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase();
}

function userTypeFromRole(role) {
  if (!role) return '';
  if (role === 'admin' || role === 'administrator') return 'Manager';
  if (role === 'manager') return 'Manager';
  if (role === 'instructor') return 'Staff';
  if (role === 'staff') return 'Staff';
  if (role === 'customer') return 'Customer';
  return '';
}

// Strict user type enforcement middleware
const enforceUserType = (requiredType) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.type !== requiredType) {
      return res.status(403).json({ 
        error: `Access denied: ${requiredType} access required`,
        userType: req.user.type,
        requiredType: requiredType
      });
    }

    next();
  };
};

// Prevent cross-type resource access
const preventCrossAccess = (req, res, next) => {
  const path = req.path;
  const userType = req.user?.type;

  // Block users from accessing lawyer/admin endpoints
  if (userType === 'user') {
    if (path.includes('/lawyer') || path.includes('/admin')) {
      return res.status(403).json({ 
        error: 'Access denied: User cannot access lawyer/admin resources' 
      });
    }
  }

  // Block lawyers from accessing user/admin endpoints  
  if (userType === 'lawyer') {
    if (path.includes('/user/') || path.includes('/admin')) {
      return res.status(403).json({ 
        error: 'Access denied: Lawyer cannot access user/admin resources' 
      });
    }
  }

  // Block non-admins from admin endpoints
  if (userType !== 'admin' && path.includes('/admin')) {
    return res.status(403).json({ 
      error: 'Access denied: Admin access required' 
    });
  }

  next();
};

module.exports = {
  enforceUserType,
  preventCrossAccess
};
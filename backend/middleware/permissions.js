// Permission middleware for role-based access control

/**
 * Check if user has permission to delete questions
 * Admin, superadmin, and manager can delete questions
 */
const canDelete = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Admin, superadmin, and manager can delete questions
  if (!['admin', 'superadmin', 'manager'].includes(user.role)) {
    return res.status(403).json({ 
      message: 'Access denied. Delete permission required.' 
    });
  }

  next();
};

/**
 * Check if user has permission to delete users
 * Only admin and superadmin can delete users (managers cannot)
 */
const canDeleteUser = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Only admin and superadmin can delete users
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return res.status(403).json({ 
      message: 'Access denied. User management is only available for Admin and Super Admin roles.' 
    });
  }

  next();
};

/**
 * Check if user can access user management module
 * Only admin and superadmin can access user management
 */
const canAccessUsers = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Only admin and superadmin can access user management
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return res.status(403).json({ 
      message: 'Access denied. User management is only available for Admin and Super Admin roles.' 
    });
  }

  next();
};

/**
 * Check if user can create (admin, superadmin, manager)
 */
const canCreate = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Admin, superadmin, and manager can create
  if (!['admin', 'superadmin', 'manager'].includes(user.role)) {
    return res.status(403).json({ 
      message: 'Access denied. Create permission required.' 
    });
  }

  next();
};

/**
 * Check if user can edit (admin, superadmin, manager)
 */
const canEdit = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Admin, superadmin, and manager can edit
  if (!['admin', 'superadmin', 'manager'].includes(user.role)) {
    return res.status(403).json({ 
      message: 'Access denied. Edit permission required.' 
    });
  }

  next();
};

module.exports = {
  canDelete,
  canDeleteUser,
  canAccessUsers,
  canCreate,
  canEdit
};



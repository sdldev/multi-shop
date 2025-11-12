import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Define role constants
export const USER_ROLES = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  HEAD_BRANCH_MANAGER: 'Head Branch Manager',
  MANAGEMENT: 'Management',
  WAREHOUSE: 'Warehouse',
  STAFF: 'Staff'
};

export const STAFF_ROLES = {
  HEAD_BRANCH: 'HeadBranch',
  ADMIN: 'Admin',
  CASHIER: 'Cashier',
  HEAD_COUNTER: 'HeadCounter',
  STAFF: 'Staff'
};

// Helper function to check if user is management (from users table)
export function isManagement(user) {
  const managementRoles = [
    USER_ROLES.OWNER,
    USER_ROLES.MANAGER,
    USER_ROLES.HEAD_BRANCH_MANAGER,
    USER_ROLES.MANAGEMENT,
    USER_ROLES.WAREHOUSE
  ];
  return user.type === 'user' && managementRoles.includes(user.role);
}

// Helper function to check if user is staff (from staff table)
export function isStaff(user) {
  return user.type === 'staff';
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
}

export function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this resource' 
      });
    }

    next();
  };
}

export function authorizeBranch(req, res, next) {
  // Management users can access all branches
  if (isManagement(req.user)) {
    return next();
  }

  // Staff roles must be restricted to their branch
  const branchId = req.params.branch_id || req.body.branch_id || req.query.branch_id;
  
  if (isStaff(req.user)) {
    if (!req.user.branch_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Staff account must have a branch assigned' 
      });
    }

    if (branchId && parseInt(branchId) !== parseInt(req.user.branch_id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access data from your assigned branch' 
      });
    }
  }

  next();
}

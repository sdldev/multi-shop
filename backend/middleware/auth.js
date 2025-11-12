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

    console.log(`[authorizeRole] User role: ${req.user.role}, Required roles: ${roles.join(', ')}, User type: ${req.user.type}`);
    
    if (!roles.includes(req.user.role)) {
      console.log(`[authorizeRole] Access DENIED - Role mismatch`);
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this resource' 
      });
    }

    console.log(`[authorizeRole] Access GRANTED`);
    next();
  };
}

export function authorizeBranch(req, res, next) {
  // Admin users can access all branches
  if (req.user.role === 'admin') {
    return next();
  }

  // Staff variants: 'staff', 'HeadBranch', 'Staff'
  // All staff roles must be restricted to their branch
  const staffRoles = ['staff', 'HeadBranch', 'Staff'];
  
  if (staffRoles.includes(req.user.role)) {
    if (!req.user.branch_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Staff account must have a branch assigned' 
      });
    }

    // Get branch_id from params, body, or query
    const branchId = req.params.branch_id || req.body.branch_id || req.query.branch_id;
    
    // If branch_id is provided, verify it matches staff's branch
    if (branchId && parseInt(branchId) !== parseInt(req.user.branch_id)) {
      console.log(`[authorizeBranch] Access denied - Staff branch_id: ${req.user.branch_id}, Requested branch_id: ${branchId}`);
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access data from your assigned branch' 
      });
    }

    // If no branch_id provided in request, it's OK for staff (they'll use their own branch_id)
    return next();
  }

  // If not admin or staff variant, deny access
  return res.status(403).json({ 
    success: false, 
    message: 'You do not have permission to access this resource' 
  });
}

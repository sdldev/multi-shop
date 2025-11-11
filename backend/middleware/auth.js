import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
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
  if (req.user.role === 'admin') {
    return next();
  }

  const branchId = req.params.branch_id || req.body.branch_id || req.query.branch_id;
  
  if (req.user.role === 'staff') {
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

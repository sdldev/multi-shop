import express from 'express';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { query } from '../config/db.js';
import { authenticateToken, authorizeRole, USER_ROLES, isManagement } from '../middleware/auth.js';

const router = express.Router();

function validateUserRole(role) {
  const validRoles = Object.values(USER_ROLES);
  if (!validRoles.includes(role)) {
    return { 
      valid: false, 
      message: `Role must be one of: ${validRoles.join(', ')}` 
    };
  }
  return { valid: true };
}

function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!hasUpperCase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!hasNumber) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!hasSpecialChar) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all admin users (Admin only)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all admin users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/', authenticateToken, authorizeRole(USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.HEAD_BRANCH_MANAGER, USER_ROLES.MANAGEMENT), async (req, res) => {
  try {
    const users = await query('SELECT user_id, username, full_name, role, created_at FROM users ORDER BY user_id DESC');

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get admin user by ID (Admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticateToken, authorizeRole(USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.HEAD_BRANCH_MANAGER, USER_ROLES.MANAGEMENT), async (req, res) => {
  try {
    const { id } = req.params;

    const users = await query('SELECT user_id, username, full_name, role, created_at FROM users WHERE user_id = ?', [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new admin user (Admin only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - full_name
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Must be at least 8 characters with 1 uppercase, 1 number, 1 special character
 *               full_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateToken, authorizeRole(USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.HEAD_BRANCH_MANAGER, USER_ROLES.MANAGEMENT), async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'username, password, and full_name are required'
      });
    }

    // Validate role if provided, default to Staff
    const userRole = role || USER_ROLES.STAFF;
    const roleValidation = validateUserRole(userRole);
    if (!roleValidation.valid) {
      return res.status(400).json({
        success: false,
        message: roleValidation.message
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const cleanUsername = username.trim();
    
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, underscores, and hyphens'
      });
    }

    const usernameInUsers = await query('SELECT user_id FROM users WHERE username = ?', [cleanUsername]);
    const usernameInStaff = await query('SELECT staff_id FROM staff WHERE username = ?', [cleanUsername]);

    if (usernameInUsers.length > 0 || usernameInStaff.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const sanitizedData = {
      username: cleanUsername,
      password_hash: passwordHash,
      full_name: validator.escape(full_name.trim()),
      role: userRole
    };

    const result = await query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [sanitizedData.username, sanitizedData.password_hash, sanitizedData.full_name, sanitizedData.role]
    );

    const newUser = await query('SELECT user_id, username, full_name, role, created_at FROM users WHERE user_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update admin user by ID (Admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               full_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticateToken, authorizeRole(USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.HEAD_BRANCH_MANAGER, USER_ROLES.MANAGEMENT), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, full_name, role } = req.body;

    const existingUser = await query('SELECT * FROM users WHERE user_id = ?', [id]);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate role if provided
    if (role) {
      const roleValidation = validateUserRole(role);
      if (!roleValidation.valid) {
        return res.status(400).json({
          success: false,
          message: roleValidation.message
        });
      }
      
      // Prevent users from modifying their own role (security measure)
      if (parseInt(id) === req.user.id && role !== existingUser[0].role) {
        return res.status(403).json({
          success: false,
          message: 'You cannot modify your own role'
        });
      }
    }

    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message
        });
      }
    }

    let cleanUsername = username ? username.trim() : existingUser[0].username;
    
    if (username && !/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, underscores, and hyphens'
      });
    }

    let sanitizedData = {
      username: cleanUsername,
      full_name: full_name ? validator.escape(full_name.trim()) : existingUser[0].full_name,
      password_hash: existingUser[0].password_hash,
      role: role || existingUser[0].role
    };

    if (username && username !== existingUser[0].username) {
      const usernameInUsers = await query('SELECT user_id FROM users WHERE username = ? AND user_id != ?', [sanitizedData.username, id]);
      const usernameInStaff = await query('SELECT staff_id FROM staff WHERE username = ?', [sanitizedData.username]);

      if (usernameInUsers.length > 0 || usernameInStaff.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    if (password) {
      sanitizedData.password_hash = await bcrypt.hash(password, 10);
    }

    await query(
      'UPDATE users SET username = ?, password_hash = ?, full_name = ?, role = ? WHERE user_id = ?',
      [sanitizedData.username, sanitizedData.password_hash, sanitizedData.full_name, sanitizedData.role, id]
    );

    const updatedUser = await query('SELECT user_id, username, full_name, role, created_at FROM users WHERE user_id = ?', [id]);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete admin user by ID (Admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateToken, authorizeRole(USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.HEAD_BRANCH_MANAGER, USER_ROLES.MANAGEMENT), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent users from deleting themselves (security measure)
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const existingUser = await query('SELECT * FROM users WHERE user_id = ?', [id]);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await query('DELETE FROM users WHERE user_id = ?', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

export default router;

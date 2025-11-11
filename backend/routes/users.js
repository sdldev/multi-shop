import express from 'express';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { query } from '../config/db.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

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
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
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
router.get('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
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
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { username, password, full_name } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'username, password, and full_name are required'
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const sanitizedUsername = validator.escape(username.trim());

    const usernameInUsers = await query('SELECT user_id FROM users WHERE username = ?', [sanitizedUsername]);
    const usernameInStaff = await query('SELECT staff_id FROM staff WHERE username = ?', [sanitizedUsername]);

    if (usernameInUsers.length > 0 || usernameInStaff.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const sanitizedData = {
      username: sanitizedUsername,
      password_hash: passwordHash,
      full_name: validator.escape(full_name.trim())
    };

    const result = await query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [sanitizedData.username, sanitizedData.password_hash, sanitizedData.full_name, 'admin']
    );

    const newUser = await query('SELECT user_id, username, full_name, role, created_at FROM users WHERE user_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
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
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, full_name } = req.body;

    const existingUser = await query('SELECT * FROM users WHERE user_id = ?', [id]);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
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

    let sanitizedData = {
      username: username ? validator.escape(username.trim()) : existingUser[0].username,
      full_name: full_name ? validator.escape(full_name.trim()) : existingUser[0].full_name,
      password_hash: existingUser[0].password_hash
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
      'UPDATE users SET username = ?, password_hash = ?, full_name = ? WHERE user_id = ?',
      [sanitizedData.username, sanitizedData.password_hash, sanitizedData.full_name, id]
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
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

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

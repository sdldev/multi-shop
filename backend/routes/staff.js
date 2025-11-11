import express from 'express';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { query } from '../config/db.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Get all staff (Admin only)
 *     tags: [Staff]
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: integer
 *         description: Filter by branch ID
 *     responses:
 *       200:
 *         description: List of all staff
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
 *                     $ref: '#/components/schemas/Staff'
 */
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { branch_id } = req.query;
    let sql = 'SELECT s.staff_id, s.branch_id, s.username, s.full_name, s.role, s.created_at, b.branch_name FROM staff s LEFT JOIN branches b ON s.branch_id = b.branch_id WHERE 1=1';
    const params = [];

    if (branch_id) {
      sql += ' AND s.branch_id = ?';
      params.push(branch_id);
    }

    sql += ' ORDER BY s.staff_id DESC';

    const staff = await query(sql, params);

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve staff',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/staff/{id}:
 *   get:
 *     summary: Get staff by ID (Admin only)
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Staff details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await query(
      'SELECT s.staff_id, s.branch_id, s.username, s.full_name, s.role, s.created_at, b.branch_name FROM staff s LEFT JOIN branches b ON s.branch_id = b.branch_id WHERE s.staff_id = ?',
      [id]
    );

    if (staff.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.json({
      success: true,
      data: staff[0]
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve staff',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/staff:
 *   post:
 *     summary: Create a new staff member (Admin only)
 *     tags: [Staff]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_id
 *               - username
 *               - password
 *               - full_name
 *             properties:
 *               branch_id:
 *                 type: integer
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               full_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff created successfully
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
 *                   $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { branch_id, username, password, full_name } = req.body;

    if (!branch_id || !username || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'branch_id, username, password, and full_name are required'
      });
    }

    const branchExists = await query('SELECT branch_id FROM branches WHERE branch_id = ?', [branch_id]);
    if (branchExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch_id'
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
      branch_id: parseInt(branch_id),
      username: cleanUsername,
      password_hash: passwordHash,
      full_name: validator.escape(full_name.trim())
    };

    const result = await query(
      'INSERT INTO staff (branch_id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [sanitizedData.branch_id, sanitizedData.username, sanitizedData.password_hash, sanitizedData.full_name, 'staff']
    );

    const newStaff = await query(
      'SELECT s.staff_id, s.branch_id, s.username, s.full_name, s.role, s.created_at, b.branch_name FROM staff s LEFT JOIN branches b ON s.branch_id = b.branch_id WHERE s.staff_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: newStaff[0]
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/staff/{id}:
 *   put:
 *     summary: Update staff by ID (Admin only)
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Staff ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branch_id:
 *                 type: integer
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               full_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff updated successfully
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
 *                   $ref: '#/components/schemas/Staff'
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_id, username, password, full_name } = req.body;

    const existingStaff = await query('SELECT * FROM staff WHERE staff_id = ?', [id]);

    if (existingStaff.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    if (branch_id) {
      const branchExists = await query('SELECT branch_id FROM branches WHERE branch_id = ?', [branch_id]);
      if (branchExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch_id'
        });
      }
    }

    let cleanUsername = username ? username.trim() : existingStaff[0].username;
    
    if (username && !/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, underscores, and hyphens'
      });
    }

    let sanitizedData = {
      branch_id: branch_id ? parseInt(branch_id) : existingStaff[0].branch_id,
      username: cleanUsername,
      full_name: full_name ? validator.escape(full_name.trim()) : existingStaff[0].full_name,
      password_hash: existingStaff[0].password_hash
    };

    if (username && username !== existingStaff[0].username) {
      const usernameInUsers = await query('SELECT user_id FROM users WHERE username = ?', [sanitizedData.username]);
      const usernameInStaff = await query('SELECT staff_id FROM staff WHERE username = ? AND staff_id != ?', [sanitizedData.username, id]);

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
      'UPDATE staff SET branch_id = ?, username = ?, password_hash = ?, full_name = ? WHERE staff_id = ?',
      [sanitizedData.branch_id, sanitizedData.username, sanitizedData.password_hash, sanitizedData.full_name, id]
    );

    const updatedStaff = await query(
      'SELECT s.staff_id, s.branch_id, s.username, s.full_name, s.role, s.created_at, b.branch_name FROM staff s LEFT JOIN branches b ON s.branch_id = b.branch_id WHERE s.staff_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Staff updated successfully',
      data: updatedStaff[0]
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/staff/{id}:
 *   delete:
 *     summary: Delete staff by ID (Admin only)
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Staff deleted successfully
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
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const existingStaff = await query('SELECT * FROM staff WHERE staff_id = ?', [id]);

    if (existingStaff.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    await query('DELETE FROM staff WHERE staff_id = ?', [id]);

    res.json({
      success: true,
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff',
      error: error.message
    });
  }
});

export default router;

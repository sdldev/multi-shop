import express from 'express';
import validator from 'validator';
import { query } from '../config/db.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/branches:
 *   get:
 *     summary: Get all branches
 *     tags: [Branches]
 *     responses:
 *       200:
 *         description: List of all branches
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
 *                     $ref: '#/components/schemas/Branch'
 */
router.get('/', authenticateToken, authorizeRole('admin', 'staff'), async (req, res) => {
  try {
    const branches = await query('SELECT * FROM branches ORDER BY branch_id DESC');

    res.json({
      success: true,
      data: branches
    });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve branches',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/branches/{id}:
 *   get:
 *     summary: Get branch by ID
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *       404:
 *         description: Branch not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticateToken, authorizeRole('admin', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;

    const branches = await query('SELECT * FROM branches WHERE branch_id = ?', [id]);

    if (branches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    res.json({
      success: true,
      data: branches[0]
    });
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve branch',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/branches:
 *   post:
 *     summary: Create a new branch (Admin only)
 *     tags: [Branches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_name
 *             properties:
 *               branch_name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               manager_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Branch created successfully
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
 *                   $ref: '#/components/schemas/Branch'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { branch_name, address, phone_number, manager_name } = req.body;

    if (!branch_name) {
      return res.status(400).json({
        success: false,
        message: 'Branch name is required'
      });
    }

    const sanitizedData = {
      branch_name: validator.escape(branch_name.trim()),
      address: address ? validator.escape(address.trim()) : null,
      phone_number: phone_number ? validator.escape(phone_number.trim()) : null,
      manager_name: manager_name ? validator.escape(manager_name.trim()) : null
    };

    const result = await query(
      'INSERT INTO branches (branch_name, address, phone_number, manager_name) VALUES (?, ?, ?, ?)',
      [sanitizedData.branch_name, sanitizedData.address, sanitizedData.phone_number, sanitizedData.manager_name]
    );

    const newBranch = await query('SELECT * FROM branches WHERE branch_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: newBranch[0]
    });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create branch',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/branches/{id}:
 *   put:
 *     summary: Update branch by ID (Admin only)
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branch_name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               manager_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Branch updated successfully
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
 *                   $ref: '#/components/schemas/Branch'
 *       404:
 *         description: Branch not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_name, address, phone_number, manager_name } = req.body;

    const existingBranch = await query('SELECT * FROM branches WHERE branch_id = ?', [id]);

    if (existingBranch.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const sanitizedData = {
      branch_name: branch_name ? validator.escape(branch_name.trim()) : existingBranch[0].branch_name,
      address: address ? validator.escape(address.trim()) : existingBranch[0].address,
      phone_number: phone_number ? validator.escape(phone_number.trim()) : existingBranch[0].phone_number,
      manager_name: manager_name ? validator.escape(manager_name.trim()) : existingBranch[0].manager_name
    };

    await query(
      'UPDATE branches SET branch_name = ?, address = ?, phone_number = ?, manager_name = ? WHERE branch_id = ?',
      [sanitizedData.branch_name, sanitizedData.address, sanitizedData.phone_number, sanitizedData.manager_name, id]
    );

    const updatedBranch = await query('SELECT * FROM branches WHERE branch_id = ?', [id]);

    res.json({
      success: true,
      message: 'Branch updated successfully',
      data: updatedBranch[0]
    });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update branch',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/branches/{id}:
 *   delete:
 *     summary: Delete branch by ID (Admin only)
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete branch with dependent records
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Branch not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const existingBranch = await query('SELECT * FROM branches WHERE branch_id = ?', [id]);

    if (existingBranch.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const staffCount = await query('SELECT COUNT(*) as count FROM staff WHERE branch_id = ?', [id]);
    const customerCount = await query('SELECT COUNT(*) as count FROM customers WHERE branch_id = ?', [id]);

    if (staffCount[0].count > 0 || customerCount[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete branch with existing staff or customers. Please reassign or delete them first.'
      });
    }

    await query('DELETE FROM branches WHERE branch_id = ?', [id]);

    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete branch',
      error: error.message
    });
  }
});

export default router;

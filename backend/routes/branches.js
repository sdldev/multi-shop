import express from 'express';
import validator from 'validator';
import { query } from '../config/db.js';
import { authenticateToken, authorizeRole, USER_ROLES } from '../middleware/auth.js';

const router = express.Router();

// Helper function to convert BigInt to Number for JSON serialization
const convertBigIntToNumber = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        typeof value === 'bigint' ? Number(value) : convertBigIntToNumber(value)
      ])
    );
  }
  return typeof obj === 'bigint' ? Number(obj) : obj;
};

/**
 * @swagger
 * /api/branches:
 *   get:
 *     summary: Get all branches with statistics
 *     tags: [Branches]
 *     description: Retrieve all branches with staff count and customer statistics (active/inactive counts)
 *     responses:
 *       200:
 *         description: List of all branches with staff and customer counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       branch_id:
 *                         type: integer
 *                         example: 1
 *                       branch_name:
 *                         type: string
 *                         example: Cabang Jakarta Pusat
 *                       address:
 *                         type: string
 *                         example: Jl. Sudirman No. 123
 *                       phone_number:
 *                         type: string
 *                         example: "021-12345678"
 *                       manager_name:
 *                         type: string
 *                         example: John Doe
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       total_staff:
 *                         type: integer
 *                         description: Total number of staff in this branch
 *                         example: 5
 *                       total_customers:
 *                         type: integer
 *                         description: Total number of customers in this branch
 *                         example: 150
 *                       active_customers:
 *                         type: integer
 *                         description: Number of active customers
 *                         example: 120
 *                       inactive_customers:
 *                         type: integer
 *                         description: Number of inactive customers
 *                         example: 30
 */
router.get('/', authenticateToken, authorizeRole('admin', 'staff'), async (req, res) => {
  try {
    // Get branches with statistics using LEFT JOIN
    const branches = await query(`
      SELECT 
        b.branch_id,
        b.branch_name,
        b.address,
        b.phone_number,
        b.manager_name,
        b.created_at,
        COUNT(DISTINCT s.staff_id) as total_staff,
        COUNT(DISTINCT c.customer_id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'Active' THEN c.customer_id END) as active_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'Inactive' THEN c.customer_id END) as inactive_customers
      FROM branches b
      LEFT JOIN staff s ON b.branch_id = s.branch_id
      LEFT JOIN customers c ON b.branch_id = c.branch_id
      GROUP BY b.branch_id
      ORDER BY b.branch_id DESC
    `);

    // Convert BigInt to Number for JSON serialization
    const cleanedBranches = convertBigIntToNumber(branches);

    res.json({
      success: true,
      data: cleanedBranches
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
router.post('/', authenticateToken, authorizeRole(USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.HEAD_BRANCH_MANAGER, USER_ROLES.MANAGEMENT), async (req, res) => {
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
router.put('/:id', authenticateToken, authorizeRole(USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.HEAD_BRANCH_MANAGER, USER_ROLES.MANAGEMENT), async (req, res) => {
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
router.delete('/:id', authenticateToken, authorizeRole(USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.HEAD_BRANCH_MANAGER, USER_ROLES.MANAGEMENT), async (req, res) => {
  try {
    const { id } = req.params;

    const existingBranch = await query('SELECT * FROM branches WHERE branch_id = ?', [id]);

    if (existingBranch.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
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

import express from 'express';
import validator from 'validator';
import { query } from '../config/db.js';
import { authenticateToken, authorizeRole, authorizeBranch } from '../middleware/auth.js';
import { customerRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers with search and pagination (filtered by branch for staff)
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: integer
 *         description: Filter by branch ID (admin only)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *         description: Filter by customer status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by full_name, phone_number, code, or address (min 3 characters)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page (max 100)
 *     responses:
 *       200:
 *         description: List of customers with pagination
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
 *                     $ref: '#/components/schemas/Customer'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', authenticateToken, authorizeRole('admin', 'staff', 'HeadBranch', 'Staff'), async (req, res) => {
  try {
    const { branch_id, status, search } = req.query;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    
    // Limit max items per page to prevent abuse
    if (limit > 100) limit = 100;
    if (page < 1) page = 1;
    
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT c.*, b.branch_name FROM customers c LEFT JOIN branches b ON c.branch_id = b.branch_id WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM customers c WHERE 1=1';
    const params = [];
    const countParams = [];

    // Branch filter (RBAC)
    if (req.user.role === 'staff') {
      sql += ' AND c.branch_id = ?';
      countSql += ' AND c.branch_id = ?';
      params.push(req.user.branch_id);
      countParams.push(req.user.branch_id);
    } else if (branch_id) {
      sql += ' AND c.branch_id = ?';
      countSql += ' AND c.branch_id = ?';
      params.push(branch_id);
      countParams.push(branch_id);
    }

    // Status filter
    if (status) {
      sql += ' AND c.status = ?';
      countSql += ' AND c.status = ?';
      params.push(status);
      countParams.push(status);
    }

    // Search filter (min 3 characters for efficiency)
    if (search && search.trim().length >= 3) {
      const searchTerm = `%${search.trim()}%`;
      sql += ' AND (c.full_name LIKE ? OR c.phone_number LIKE ? OR c.code LIKE ? OR c.address LIKE ? OR c.email LIKE ?)';
      countSql += ' AND (c.full_name LIKE ? OR c.phone_number LIKE ? OR c.code LIKE ? OR c.address LIKE ? OR c.email LIKE ?)';
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get total count for pagination
    const countResult = await query(countSql, countParams);
    const total = Number(countResult[0].total); // Convert BigInt to Number

    // Add sorting and pagination
    sql += ' ORDER BY c.customer_id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const customers = await query(sql, params);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticateToken, authorizeRole('admin', 'staff', 'HeadBranch', 'Staff'), async (req, res) => {
  try {
    const { id } = req.params;
    let sql = 'SELECT c.*, b.branch_name FROM customers c LEFT JOIN branches b ON c.branch_id = b.branch_id WHERE c.customer_id = ?';
    const params = [id];

    if (req.user.role === 'staff') {
      sql += ' AND c.branch_id = ?';
      params.push(req.user.branch_id);
    }

    const customers = await query(sql, params);

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or you do not have access to this customer'
      });
    }

    res.json({
      success: true,
      data: customers[0]
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_id
 *               - full_name
 *               - email
 *               - registration_date
 *             properties:
 *               branch_id:
 *                 type: integer
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone_number:
 *                 type: string
 *               code:
 *                 type: string
 *               address:
 *                 type: string
 *               registration_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       201:
 *         description: Customer created successfully
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
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateToken, authorizeRole('admin', 'staff', 'HeadBranch', 'Staff'), customerRateLimiter, authorizeBranch, async (req, res) => {
  try {
    const { branch_id, full_name, email, phone_number, code, address, registration_date, status } = req.body;

    if (!branch_id || !full_name || !email || !registration_date) {
      return res.status(400).json({
        success: false,
        message: 'branch_id, full_name, email, and registration_date are required'
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (req.user.role === 'staff' && parseInt(branch_id) !== parseInt(req.user.branch_id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only create customers for your assigned branch'
      });
    }

    const branchExists = await query('SELECT branch_id FROM branches WHERE branch_id = ?', [branch_id]);
    if (branchExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch_id'
      });
    }

    const emailExists = await query('SELECT customer_id FROM customers WHERE email = ?', [email]);
    if (emailExists.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const sanitizedData = {
      branch_id: parseInt(branch_id),
      full_name: validator.escape(full_name.trim()),
      email: email.trim().toLowerCase(),
      phone_number: phone_number ? validator.escape(phone_number.trim()) : null,
      code: code ? validator.escape(code.trim()) : null,
      address: address ? validator.escape(address.trim()) : null,
      registration_date: registration_date,
      status: status || 'Active'
    };

    if (!['Active', 'Inactive'].includes(sanitizedData.status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Active or Inactive'
      });
    }

    const result = await query(
      'INSERT INTO customers (branch_id, full_name, email, phone_number, code, address, registration_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [sanitizedData.branch_id, sanitizedData.full_name, sanitizedData.email, sanitizedData.phone_number, sanitizedData.code, sanitizedData.address, sanitizedData.registration_date, sanitizedData.status]
    );

    const newCustomer = await query('SELECT c.*, b.branch_name FROM customers c LEFT JOIN branches b ON c.branch_id = b.branch_id WHERE c.customer_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer[0]
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone_number:
 *                 type: string
 *               code:
 *                 type: string
 *               address:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: Customer updated successfully
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
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticateToken, authorizeRole('admin', 'staff', 'HeadBranch', 'Staff'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone_number, code, address, status } = req.body;

    let sql = 'SELECT * FROM customers WHERE customer_id = ?';
    const params = [id];

    if (req.user.role === 'staff') {
      sql += ' AND branch_id = ?';
      params.push(req.user.branch_id);
    }

    const existingCustomer = await query(sql, params);

    if (existingCustomer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or you do not have access to this customer'
      });
    }

    if (email && !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (email && email !== existingCustomer[0].email) {
      const emailExists = await query('SELECT customer_id FROM customers WHERE email = ? AND customer_id != ?', [email, id]);
      if (emailExists.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const sanitizedData = {
      full_name: full_name ? validator.escape(full_name.trim()) : existingCustomer[0].full_name,
      email: email ? email.trim().toLowerCase() : existingCustomer[0].email,
      phone_number: phone_number !== undefined ? (phone_number ? validator.escape(phone_number.trim()) : null) : existingCustomer[0].phone_number,
      code: code !== undefined ? (code ? validator.escape(code.trim()) : null) : existingCustomer[0].code,
      address: address !== undefined ? (address ? validator.escape(address.trim()) : null) : existingCustomer[0].address,
      status: status || existingCustomer[0].status
    };

    if (!['Active', 'Inactive'].includes(sanitizedData.status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Active or Inactive'
      });
    }

    await query(
      'UPDATE customers SET full_name = ?, email = ?, phone_number = ?, code = ?, address = ?, status = ? WHERE customer_id = ?',
      [sanitizedData.full_name, sanitizedData.email, sanitizedData.phone_number, sanitizedData.code, sanitizedData.address, sanitizedData.status, id]
    );

    const updatedCustomer = await query('SELECT c.*, b.branch_name FROM customers c LEFT JOIN branches b ON c.branch_id = b.branch_id WHERE c.customer_id = ?', [id]);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer[0]
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
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
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateToken, authorizeRole('admin', 'staff', 'HeadBranch', 'Staff'), async (req, res) => {
  try {
    const { id } = req.params;

    let sql = 'SELECT * FROM customers WHERE customer_id = ?';
    const params = [id];

    if (req.user.role === 'staff') {
      sql += ' AND branch_id = ?';
      params.push(req.user.branch_id);
    }

    const existingCustomer = await query(sql, params);

    if (existingCustomer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or you do not have access to this customer'
      });
    }

    await query('DELETE FROM customers WHERE customer_id = ?', [id]);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
});

export default router;

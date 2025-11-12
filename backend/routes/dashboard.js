import express from 'express';
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
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     description: Get overall statistics. Admins see all data, staff see only their branch data.
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBranches:
 *                       type: integer
 *                     totalCustomers:
 *                       type: integer
 *                     activeCustomers:
 *                       type: integer
 *                     inactiveCustomers:
 *                       type: integer
 *                     totalStaff:
 *                       type: integer
 *                     totalAdmins:
 *                       type: integer
 */
router.get('/stats', authenticateToken, authorizeRole('admin', 'staff'), async (req, res) => {
  try {
    const stats = {};

    if (req.user.role === 'admin') {
      const branchCount = await query('SELECT COUNT(*) as count FROM branches');
      stats.totalBranches = Number(branchCount[0].count);

      const customerCount = await query('SELECT COUNT(*) as count FROM customers');
      stats.totalCustomers = Number(customerCount[0].count);

      const activeCustomers = await query("SELECT COUNT(*) as count FROM customers WHERE status = 'Active'");
      stats.activeCustomers = Number(activeCustomers[0].count);

      const inactiveCustomers = await query("SELECT COUNT(*) as count FROM customers WHERE status = 'Inactive'");
      stats.inactiveCustomers = Number(inactiveCustomers[0].count);

      const staffCount = await query('SELECT COUNT(*) as count FROM staff');
      stats.totalStaff = Number(staffCount[0].count);

      const adminCount = await query('SELECT COUNT(*) as count FROM users');
      stats.totalAdmins = Number(adminCount[0].count);
    } else {
      stats.totalBranches = 1;

      const customerCount = await query('SELECT COUNT(*) as count FROM customers WHERE branch_id = ?', [req.user.branch_id]);
      stats.totalCustomers = Number(customerCount[0].count);

      const activeCustomers = await query("SELECT COUNT(*) as count FROM customers WHERE branch_id = ? AND status = 'Active'", [req.user.branch_id]);
      stats.activeCustomers = Number(activeCustomers[0].count);

      const inactiveCustomers = await query("SELECT COUNT(*) as count FROM customers WHERE branch_id = ? AND status = 'Inactive'", [req.user.branch_id]);
      stats.inactiveCustomers = Number(inactiveCustomers[0].count);

      const staffCount = await query('SELECT COUNT(*) as count FROM staff WHERE branch_id = ?', [req.user.branch_id]);
      stats.totalStaff = Number(staffCount[0].count);
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/dashboard/branch-stats:
 *   get:
 *     summary: Get statistics per branch (Admin only)
 *     tags: [Dashboard]
 *     description: Get customer and staff count for each branch
 *     responses:
 *       200:
 *         description: Branch statistics
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
 *                     type: object
 *                     properties:
 *                       branch_id:
 *                         type: integer
 *                       branch_name:
 *                         type: string
 *                       total_customers:
 *                         type: integer
 *                       active_customers:
 *                         type: integer
 *                       inactive_customers:
 *                         type: integer
 *                       total_staff:
 *                         type: integer
 */
router.get('/branch-stats', authenticateToken, authorizeRole(USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.HEAD_BRANCH_MANAGER, USER_ROLES.MANAGEMENT), async (req, res) => {
  try {
    const branchStats = await query(`
      SELECT 
        b.branch_id,
        b.branch_name,
        b.address,
        b.manager_name,
        COUNT(DISTINCT c.customer_id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'Active' THEN c.customer_id END) as active_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'Inactive' THEN c.customer_id END) as inactive_customers,
        COUNT(DISTINCT s.staff_id) as total_staff
      FROM branches b
      LEFT JOIN customers c ON b.branch_id = c.branch_id
      LEFT JOIN staff s ON b.branch_id = s.branch_id
      GROUP BY b.branch_id
      ORDER BY total_customers DESC
    `);

    // Convert BigInt to Number for JSON serialization
    const cleanedStats = convertBigIntToNumber(branchStats);

    res.json({
      success: true,
      data: cleanedStats
    });
  } catch (error) {
    console.error('Get branch stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve branch statistics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/dashboard/recent-customers:
 *   get:
 *     summary: Get recent customer registrations
 *     tags: [Dashboard]
 *     description: Get recently registered customers. Admins see all, staff see only their branch.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent customers to retrieve
 *     responses:
 *       200:
 *         description: Recent customers
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
 */
router.get('/recent-customers', authenticateToken, authorizeRole('admin', 'staff'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    let sql = `
      SELECT c.*, b.branch_name 
      FROM customers c 
      LEFT JOIN branches b ON c.branch_id = b.branch_id 
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'staff') {
      sql += ' AND c.branch_id = ?';
      params.push(req.user.branch_id);
    }

    sql += ' ORDER BY c.created_at DESC LIMIT ?';
    params.push(limit);

    const recentCustomers = await query(sql, params);

    res.json({
      success: true,
      data: recentCustomers
    });
  } catch (error) {
    console.error('Get recent customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent customers',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/dashboard/customer-trends:
 *   get:
 *     summary: Get customer registration trends (Admin only)
 *     tags: [Dashboard]
 *     description: Get customer registration count by month for the last 12 months
 *     responses:
 *       200:
 *         description: Customer registration trends
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
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       count:
 *                         type: integer
 */
router.get('/customer-trends', authenticateToken, authorizeRole(USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.HEAD_BRANCH_MANAGER, USER_ROLES.MANAGEMENT), async (req, res) => {
  try {
    const trends = await query(`
      SELECT 
        DATE_FORMAT(registration_date, '%Y-%m') as month,
        COUNT(*) as count
      FROM customers
      WHERE registration_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(registration_date, '%Y-%m')
      ORDER BY month DESC
    `);

    // Convert BigInt to Number for JSON serialization
    const cleanedTrends = convertBigIntToNumber(trends);

    res.json({
      success: true,
      data: cleanedTrends
    });
  } catch (error) {
    console.error('Get customer trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer trends',
      error: error.message
    });
  }
});

export default router;

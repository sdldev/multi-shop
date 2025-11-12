import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/auth.js';
import branchRoutes from './routes/branches.js';
import customerRoutes from './routes/customers.js';
import staffRoutes from './routes/staff.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import apiKeyRoutes from './routes/apiKeys.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - must be before other middleware
app.use(cors({
  origin: [
    'http://localhost:3000',  // main-frontend
    'http://localhost:3001',  // branch-frontend
    'http://localhost:5173',  // legacy frontend
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(generalRateLimiter);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     tags: [General]
 *     security: []
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Welcome to Multi-Shop Branch Management API
 *                 documentation:
 *                   type: string
 *                   example: /api-docs
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Multi-Shop Branch Management API',
    documentation: '/api-docs',
    version: '1.0.0'
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Multi-Shop API Documentation',
  customFavIcon: '/favicon.ico'
}));

app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/api-keys', apiKeyRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}`);
});

export default app;

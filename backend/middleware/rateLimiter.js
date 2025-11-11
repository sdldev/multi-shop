import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

export const loginRateLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 30 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 30 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const customerRateLimiter = rateLimit({
  windowMs: parseInt(process.env.CUSTOMER_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
  max: parseInt(process.env.CUSTOMER_RATE_LIMIT_MAX_ATTEMPTS) || 20,
  message: {
    success: false,
    message: 'Too many customer creation requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

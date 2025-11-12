import crypto from 'crypto';
import { query } from '../config/db.js';

/**
 * Middleware to authenticate API Key
 * Supports both JWT (for users) and API Key (for services)
 */
export async function authenticateApiKey(req, res, next) {
  try {
    // Check for API Key in header
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    // Check if it's an API key (starts with sk_)
    if (!apiKey.startsWith('sk_')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key format'
      });
    }

    // Hash the provided key
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Look up in database
    const result = await query(
      `SELECT 
        ak.api_key_id,
        ak.user_id,
        ak.name,
        ak.scopes,
        ak.expires_at,
        ak.is_active,
        u.username,
        u.full_name,
        u.role
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.user_id
      WHERE ak.key_hash = ? AND ak.is_active = 1`,
      [hashedKey]
    );

    if (result.length === 0) {
      console.warn('[SECURITY] Invalid API key attempt');
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked API key'
      });
    }

    const keyData = result[0];

    // Check expiration
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'API key has expired'
      });
    }

    // Update last used timestamp (async, don't wait)
    query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE api_key_id = ?',
      [keyData.api_key_id]
    ).catch(err => console.error('Failed to update last_used_at:', err));

    // Attach user data to request (similar to JWT)
    req.user = {
      id: keyData.user_id,
      username: keyData.username,
      full_name: keyData.full_name,
      role: keyData.role,
      type: 'user', // API keys are user-scoped
      scopes: JSON.parse(keyData.scopes || '[]'),
      auth_method: 'api_key',
      api_key_id: keyData.api_key_id,
      api_key_name: keyData.name
    };

    // Log API key usage
    console.log(`[API_KEY] ${keyData.name} used by ${keyData.username} (${keyData.role})`);

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

/**
 * Middleware to check if user has required scope
 */
export function requireScope(...requiredScopes) {
  return (req, res, next) => {
    // If authenticated via JWT, skip scope check (JWT has full access)
    if (req.user?.auth_method !== 'api_key') {
      return next();
    }

    // Check if API key has required scopes
    const userScopes = req.user.scopes || [];
    const hasScope = requiredScopes.some(scope => userScopes.includes(scope));

    if (!hasScope) {
      return res.status(403).json({
        success: false,
        message: `Missing required scope. Required: ${requiredScopes.join(' or ')}`,
        user_scopes: userScopes
      });
    }

    next();
  };
}

/**
 * Flexible authentication: JWT OR API Key
 * Use this for endpoints that support both authentication methods
 */
export async function authenticateFlexible(req, res, next) {
  const authHeader = req.headers['authorization'];
  const apiKeyHeader = req.headers['x-api-key'];

  // Try API Key first
  if (apiKeyHeader || (authHeader && authHeader.startsWith('sk_'))) {
    return authenticateApiKey(req, res, next);
  }

  // Fall back to JWT
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Import JWT middleware dynamically to avoid circular dependency
    const { authenticateToken } = await import('./auth.js');
    return authenticateToken(req, res, next);
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required. Provide either JWT token or API key.'
  });
}

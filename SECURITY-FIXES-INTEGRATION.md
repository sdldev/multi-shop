# Security Fixes Integration Guide

## Critical Fixes Applied

### 1. Environment Variables
✅ Created `.env` file with secure JWT secrets
⚠️  **ACTION REQUIRED:** Update `DB_PASSWORD` in `backend/.env`

### 2. Security Dependencies
✅ Installed Helmet for security headers
✅ Created security configuration files

### 3. New Files Created
- `backend/config/security.js` - Helmet & HTTPS redirect
- `backend/utils/passwordValidator.js` - Password validation & search sanitization
- `backend/middleware/additionalRateLimiters.js` - Additional rate limiters

## Manual Integration Required

### Step 1: Update server.js

Add to imports:
```javascript
import { helmetConfig, httpsRedirect } from './config/security.js';
```

Add before CORS:
```javascript
app.use(helmetConfig);
app.use(httpsRedirect);
```

### Step 2: Update auth.js

Add to imports:
```javascript
import { validatePassword } from '../utils/passwordValidator.js';
import { refreshTokenRateLimiter } from '../middleware/additionalRateLimiters.js';
```

Add to /refresh route:
```javascript
router.post('/refresh', refreshTokenRateLimiter, async (req, res) => {
```

### Step 3: Update customers.js

Add to imports:
```javascript
import { sanitizeSearchTerm } from '../utils/passwordValidator.js';
import { searchRateLimiter } from '../middleware/additionalRateLimiters.js';
```

Add to GET / route:
```javascript
router.get('/', authenticateToken, searchRateLimiter, authorizeRole(...), async (req, res) => {
```

Update search sanitization (around line 110):
```javascript
if (search && search.trim().length >= 3) {
  const sanitized = sanitizeSearchTerm(search, 50);
  const searchTerm = `%${sanitized}%`;
  sql += ' AND (c.full_name LIKE ? ESCAPE \'\\\' OR c.phone_number LIKE ? ESCAPE \'\\\' ...)';
  // ...
}
```

### Step 4: Update staff.js and users.js

Add password validation before creating/updating users:
```javascript
const passwordCheck = validatePassword(password);
if (!passwordCheck.isValid) {
  return res.status(400).json({
    success: false,
    message: 'Invalid password',
    errors: passwordCheck.errors
  });
}
```

### Step 5: Update db.js

Change connection pool limit:
```javascript
connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 50,
```

### Step 6: Update error handler in server.js

```javascript
app.use((err, req, res, next) => {
  console.error('Error:', err); // Log server-side only
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : err.message,
    // Never send stack traces
  });
});
```

## Testing Checklist

After integration:
- [ ] Test login with weak password (should fail)
- [ ] Test search with special characters
- [ ] Test rate limiting on refresh endpoint
- [ ] Test security headers (use https://securityheaders.com)
- [ ] Test HTTPS redirect (in production)
- [ ] Verify .env is not committed to git

## Production Deployment

1. Set environment variables on server
2. Ensure SSL certificate is valid
3. Configure nginx for HTTPS
4. Set NODE_ENV=production
5. Update CORS origins to production URLs
6. Monitor logs for security events

## Next Steps

See SECURITY-AUDIT.md for remaining HIGH and MEDIUM priority issues.

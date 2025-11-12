#!/bin/bash

# Multi-Shop Security Quick Fix Script
# This script applies critical security fixes for production deployment

set -e

echo "🔒 Multi-Shop Security Quick Fix"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Generate secure secrets
echo -e "${YELLOW}Step 1: Generating secure environment variables...${NC}"
cd backend

if [ -f .env ]; then
    echo -e "${RED}Warning: .env file already exists!${NC}"
    read -p "Do you want to backup and recreate it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo -e "${GREEN}Backed up existing .env${NC}"
    else
        echo "Skipping .env creation"
        cd ..
        exit 0
    fi
fi

# Generate strong secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Create .env file
cat > .env << EOF
# Backend Environment Variables - GENERATED $(date)
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=CHANGE_THIS_PASSWORD_NOW
DB_NAME=multi_shop_db

# JWT Configuration (Auto-generated secure secrets)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
LOGIN_RATE_LIMIT_WINDOW_MS=1800000
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
CUSTOMER_RATE_LIMIT_WINDOW_MS=3600000
CUSTOMER_RATE_LIMIT_MAX_ATTEMPTS=20

# Database Connection Pool
DB_CONNECTION_LIMIT=50
EOF

echo -e "${GREEN}✓ Created .env file with secure JWT secrets${NC}"
echo -e "${RED}⚠️  IMPORTANT: Update DB_PASSWORD in .env file!${NC}"
echo ""

# Step 2: Install security dependencies
echo -e "${YELLOW}Step 2: Installing security dependencies...${NC}"
npm install helmet --save

echo -e "${GREEN}✓ Installed Helmet for security headers${NC}"
echo ""

# Step 3: Check if .env is in .gitignore
echo -e "${YELLOW}Step 3: Verifying .gitignore...${NC}"
cd ..
if ! grep -q "backend/.env" .gitignore; then
    echo "backend/.env" >> .gitignore
    echo -e "${GREEN}✓ Added backend/.env to .gitignore${NC}"
else
    echo -e "${GREEN}✓ .env already in .gitignore${NC}"
fi
echo ""

# Step 4: Create security patches
echo -e "${YELLOW}Step 4: Creating security patch files...${NC}"

# Create helmet configuration
cat > backend/config/security.js << 'EOF'
import helmet from 'helmet';

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true
});

export const httpsRedirect = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(\`https://\${req.header('host')}\${req.url}\`);
  }
  next();
};
EOF

echo -e "${GREEN}✓ Created backend/config/security.js${NC}"

# Create password validation utility
cat > backend/utils/passwordValidator.js << 'EOF'
import validator from 'validator';

export function validatePassword(password) {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })) {
    errors.push('Password must contain uppercase, lowercase, number, and special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeSearchTerm(search, maxLength = 50) {
  if (!search) return '';
  
  // Trim and limit length
  let sanitized = search.trim().substring(0, maxLength);
  
  // Escape special LIKE characters
  sanitized = sanitized
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
  
  return sanitized;
}
EOF

echo -e "${GREEN}✓ Created backend/utils/passwordValidator.js${NC}"

# Create additional rate limiters
cat > backend/middleware/additionalRateLimiters.js << 'EOF'
import rateLimit from 'express-rate-limit';

export const refreshTokenRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many token refresh attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'Too many search requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
EOF

echo -e "${GREEN}✓ Created backend/middleware/additionalRateLimiters.js${NC}"
echo ""

# Step 5: Create integration guide
cat > SECURITY-FIXES-INTEGRATION.md << 'EOF'
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
EOF

echo -e "${GREEN}✓ Created SECURITY-FIXES-INTEGRATION.md${NC}"
echo ""

echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}✓ Security quick fix completed!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "1. Edit backend/.env and update DB_PASSWORD"
echo "2. Follow SECURITY-FIXES-INTEGRATION.md to integrate patches"
echo "3. Read SECURITY-AUDIT.md for complete security review"
echo "4. Test all functionality after integration"
echo ""
echo -e "${RED}⚠️  DO NOT deploy to production until all CRITICAL issues are fixed!${NC}"

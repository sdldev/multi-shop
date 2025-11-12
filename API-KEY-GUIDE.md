# API Key Authentication Guide

## 🔑 Hybrid Authentication System

Aplikasi ini mendukung **2 metode autentikasi**:

### 1. JWT (untuk User Login)
- ✅ Staff dan Admin login via browser/mobile app
- ✅ Short-lived access token (15 menit)
- ✅ Refresh token (7 hari)
- ✅ Stateless, tidak perlu DB lookup

### 2. API Key (untuk Service/Integration)
- ✅ Frontend configuration (branch-frontend .env)
- ✅ Server-to-server communication
- ✅ External integrations
- ✅ Automated scripts
- ✅ Long-lived, dapat di-revoke kapan saja

---

## 📋 Setup API Keys

### Step 1: Run Migration

```bash
cd backend
mysql -u root -p multi_shop_db < migrations/add_api_keys_table.sql
```

### Step 2: Update server.js

```javascript
// Add to imports
import apiKeyRoutes from './routes/apiKeys.js';

// Add route
app.use('/api/api-keys', apiKeyRoutes);
```

### Step 3: Generate API Key (via API atau manual)

**Option A: Via API (Recommended)**
```bash
# Login dulu untuk dapat JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'

# Generate API key (gunakan JWT token dari login)
curl -X POST http://localhost:5000/api/api-keys/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Branch Frontend Production",
    "description": "API key for branch-frontend application",
    "scopes": ["read:customers", "write:customers"],
    "expires_at": "2026-12-31 23:59:59"
  }'

# Response:
{
  "success": true,
  "data": {
    "api_key": "sk_live_abc123...",
    "warning": "Save this key securely. It will not be shown again."
  }
}
```

**Option B: Via Database (Development only)**
```sql
-- Generate hash dari key "sk_test_mykey123"
SELECT SHA2('sk_test_mykey123', 256);
-- Output: hash_value

-- Insert ke database
INSERT INTO api_keys (user_id, name, key_hash, scopes, created_by) 
VALUES (1, 'My Test Key', 'hash_value', '["read:customers"]', 'admin');
```

---

## 🚀 Penggunaan

### Frontend (.env)

```bash
# branch-frontend/.env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_KEY=sk_live_abc123...
```

```javascript
// branch-frontend/src/utils/api.js
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_API_KEY // Add API key header
  },
});
```

### Backend Routes

**Option 1: API Key Only**
```javascript
import { authenticateApiKey, requireScope } from '../middleware/apiKeyAuth.js';

// Hanya terima API key (reject JWT)
router.get('/customers', 
  authenticateApiKey, 
  requireScope('read:customers'),
  async (req, res) => {
    // req.user berisi user info dari API key owner
    console.log(req.user.api_key_name); // "Branch Frontend Production"
  }
);
```

**Option 2: JWT OR API Key (Flexible)**
```javascript
import { authenticateFlexible, requireScope } from '../middleware/apiKeyAuth.js';

// Terima JWT atau API key
router.get('/customers', 
  authenticateFlexible, 
  requireScope('read:customers'), // Only checked for API keys
  async (req, res) => {
    // Works with both JWT and API key
  }
);
```

**Option 3: Existing Routes (No Change)**
```javascript
import { authenticateToken } from '../middleware/auth.js';

// Existing routes tetap menggunakan JWT (no change needed)
router.post('/login', async (req, res) => {
  // JWT-based auth (keep as-is)
});
```

---

## 🔒 Security Best Practices

### 1. Key Format
```
sk_test_abc123...  → Development/Testing
sk_live_abc123...  → Production
```

### 2. Storage
- ✅ **DO:** Store in environment variables
- ✅ **DO:** Use secrets management (Vault, AWS Secrets Manager)
- ❌ **DON'T:** Commit to git
- ❌ **DON'T:** Hardcode in source code
- ❌ **DON'T:** Store in database plaintext

### 3. Scopes (Principle of Least Privilege)
```javascript
// ❌ BAD: Too broad
{ scopes: ["admin:*"] }

// ✅ GOOD: Specific permissions
{ scopes: ["read:customers", "write:customers"] }
```

### 4. Expiration
```javascript
// ✅ Set expiration for production keys
{
  expires_at: "2026-12-31 23:59:59" // 1 year
}

// ⚠️ null = never expires (use with caution)
{
  expires_at: null
}
```

### 5. Rotation Policy
- 🔄 Rotate keys every 6-12 months
- 🔄 Rotate immediately if compromised
- 🔄 Keep old key active 24-48 hours during rotation

---

## 📊 Available Scopes

| Scope | Permission | Example Use |
|-------|------------|-------------|
| `read:customers` | View customer data | Dashboard stats |
| `write:customers` | Create/update customers | Customer registration |
| `read:branches` | View branch info | Branch selector |
| `write:branches` | Manage branches | Admin panel |
| `read:staff` | View staff list | Staff directory |
| `write:staff` | Manage staff | Staff management |
| `read:dashboard` | View analytics | Dashboard widgets |
| `admin:*` | Full access | Internal tools only |

---

## 🛠️ API Endpoints

### Generate API Key
```http
POST /api/api-keys/generate
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Branch Frontend",
  "description": "For branch-frontend app",
  "scopes": ["read:customers", "write:customers"],
  "expires_at": "2026-12-31 23:59:59"
}
```

### List API Keys
```http
GET /api/api-keys
Authorization: Bearer <JWT_TOKEN>
```

### Revoke API Key
```http
DELETE /api/api-keys/:api_key_id
Authorization: Bearer <JWT_TOKEN>
```

### Update API Key
```http
PUT /api/api-keys/:api_key_id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Updated Name",
  "scopes": ["read:customers"]
}
```

---

## 🧪 Testing

### Test with cURL
```bash
# Test API key authentication
curl http://localhost:5000/api/customers \
  -H "X-API-Key: sk_test_example123"

# Alternative: Bearer format
curl http://localhost:5000/api/customers \
  -H "Authorization: Bearer sk_test_example123"
```

### Test with Postman
1. Create new request
2. Add header: `X-API-Key: sk_test_example123`
3. Send request
4. Verify response includes user context

---

## 📈 Monitoring & Audit

### Check API Key Usage
```sql
SELECT 
  ak.name,
  ak.last_used_at,
  COUNT(akl.log_id) as total_requests,
  AVG(akl.response_time_ms) as avg_response_time
FROM api_keys ak
LEFT JOIN api_key_logs akl ON ak.api_key_id = akl.api_key_id
WHERE ak.is_active = 1
GROUP BY ak.api_key_id;
```

### Find Inactive Keys
```sql
SELECT name, last_used_at, created_at
FROM api_keys
WHERE is_active = 1 
  AND (last_used_at IS NULL OR last_used_at < DATE_SUB(NOW(), INTERVAL 30 DAY))
ORDER BY created_at DESC;
```

### Revoke Expired Keys
```sql
UPDATE api_keys 
SET is_active = 0, revoked_at = NOW(), revoked_by = 'system'
WHERE expires_at < NOW() AND is_active = 1;
```

---

## 🆚 JWT vs API Key: Kapan Pakai Apa?

### Gunakan JWT untuk:
- ✅ User login (staff, admin)
- ✅ Mobile app authentication
- ✅ Browser-based sessions
- ✅ Short-lived access (minutes to hours)
- ✅ User context (role, permissions, branch_id)

### Gunakan API Key untuk:
- ✅ Frontend app configuration (.env)
- ✅ Server-to-server communication
- ✅ Webhook callbacks
- ✅ Automated scripts/cron jobs
- ✅ Third-party integrations
- ✅ Long-lived access (months to years)

---

## ⚠️ Migration Plan

### Phase 1: Add API Key Support (No Breaking Changes)
1. ✅ Run migration SQL
2. ✅ Add API key routes
3. ✅ Keep existing JWT auth unchanged
4. ✅ Test both authentication methods work

### Phase 2: Generate Production Keys
1. Login as Owner/Manager
2. Generate API key for branch-frontend
3. Save key to branch-frontend/.env
4. Test frontend still works

### Phase 3: Optional - Restrict Certain Endpoints
```javascript
// Example: Public stats endpoint (API key only)
router.get('/public/stats', 
  authenticateApiKey, // Force API key
  requireScope('read:dashboard'),
  async (req, res) => {
    // Only accessible via API key
  }
);
```

---

## 🔐 Security Comparison

| Attack Vector | JWT (localStorage) | API Key (.env) | Mitigation |
|---------------|-------------------|----------------|------------|
| XSS | 🔴 Vulnerable | 🟢 Safe (server-side) | Use httpOnly cookies for JWT |
| Leaked in git | 🟢 N/A | 🔴 Critical | Add to .gitignore |
| Token replay | 🟡 15min window | 🔴 Until revoked | Short expiry + rotation |
| Revocation | 🔴 Difficult | 🟢 Instant | Use API keys for critical services |
| Audit trail | 🟡 Limited | 🟢 Full logging | Log all API key usage |

---

## 📞 FAQ

**Q: Apakah harus migrasi semua JWT ke API key?**  
A: **TIDAK!** Keep JWT untuk user login. API key hanya untuk service-to-service.

**Q: Bagaimana jika API key leaked?**  
A: Revoke immediately via `/api/api-keys/:id` DELETE endpoint. Generate new key.

**Q: Apakah bisa pakai keduanya?**  
A: **YA!** Gunakan `authenticateFlexible` middleware untuk support both.

**Q: Performance impact?**  
A: API key lebih lambat (DB lookup) vs JWT (decode only). Difference ~5-10ms.

**Q: Apakah perlu HTTPS?**  
A: **YA!** API keys harus transmitted over HTTPS only. Same as JWT.

---

**Status:** ✅ Ready to integrate  
**Tested:** Backend routes created, middleware ready  
**Next:** Run migration + update server.js

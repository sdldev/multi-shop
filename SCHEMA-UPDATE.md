# Schema Update - API Keys Integration

## Changes Made

### ✅ schema.sql
Added two new tables to support API key authentication:

1. **api_keys** - Stores API key credentials and metadata
   - `key_hash`: SHA-256 hash of the API key (never stores plaintext)
   - `scopes`: JSON array of permissions (read:customers, write:branches, etc.)
   - `expires_at`: Optional expiration timestamp
   - `last_used_at`: Tracks last usage for monitoring
   - Foreign key to `users` table

2. **api_key_logs** - Audit trail for API key usage
   - Tracks endpoint, method, IP, status code, response time
   - Foreign key to `api_keys` table
   - Indexed by `created_at` for efficient queries

### ✅ seed.js
Enhanced seeding process to generate initial API key for Owner:

1. **Import crypto module** - For API key generation and hashing
2. **Generate API key** - Creates `sk_{env}_{64-char-hex}` format key
3. **Hash and store** - SHA-256 hash stored in database
4. **Display plaintext** - Shows key ONCE during seeding (save it!)
5. **Security reminder** - Warns about production key rotation

## Database Setup (Fresh Install)

```bash
# 1. Start MariaDB service
sudo systemctl start mariadb

# 2. Create database
mariadb -u root -p
CREATE DATABASE IF NOT EXISTS multi_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 3. Run schema (creates all tables including api_keys)
mariadb -u root -p multi_shop < backend/schema.sql

# 4. Run seed (creates users, branches, staff, and API key)
cd backend
npm run seed
```

**IMPORTANT**: The seed script will output an API key like:
```
⚠️  IMPORTANT: Save this API key securely! It will NOT be shown again:
   sk_test_a1b2c3d4e5f6...

   Add this to your .env file:
   API_KEY=sk_test_a1b2c3d4e5f6...
```

**Save this key immediately!** It cannot be retrieved later (only the hash is stored).

## API Key Scopes

The Owner API key is seeded with full permissions:

| Scope | Description |
|-------|-------------|
| `read:customers` | View customer data |
| `write:customers` | Create/update/delete customers |
| `read:branches` | View branch data |
| `write:branches` | Create/update/delete branches |
| `read:staff` | View staff data |
| `write:staff` | Create/update/delete staff |
| `read:dashboard` | View analytics and reports |
| `admin:*` | Full administrative access |

## Using API Keys

### In API Requests

```bash
# Using X-API-Key header
curl -H "X-API-Key: sk_test_abc123..." http://localhost:5000/api/customers

# Using Authorization header
curl -H "Authorization: Bearer sk_test_abc123..." http://localhost:5000/api/customers
```

### In .env (Frontend)

```env
# For development
VITE_API_KEY=sk_test_abc123...

# For production
VITE_API_KEY=sk_live_xyz789...
```

## Available API Endpoints

All endpoints in `/api/api-keys` route:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/api-keys/generate` | Generate new API key | Owner/Manager/HBM |
| GET | `/api/api-keys` | List user's API keys | Any authenticated user |
| PUT | `/api/api-keys/:id` | Update API key metadata | Key owner |
| DELETE | `/api/api-keys/:id` | Revoke API key | Key owner |

## Migration from Old Schema

If you have existing data and need to migrate:

```bash
# 1. Backup existing database
mariadb-dump -u root -p multi_shop > backup_$(date +%F).sql

# 2. Run API keys migration only
mariadb -u root -p multi_shop < backend/migrations/add_api_keys_table.sql

# Or use the Node.js migration script
node backend/run-api-keys-migration.js
```

## Security Best Practices

1. **Never commit API keys to Git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for template

2. **Rotate keys regularly**
   - Generate new production keys monthly
   - Revoke old keys after rotation

3. **Use environment-specific keys**
   - `sk_test_*` for development/testing
   - `sk_live_*` for production only

4. **Monitor API key usage**
   - Check `api_key_logs` table regularly
   - Set up alerts for unusual activity

5. **Set expiration dates**
   - Use `expires_at` for temporary keys
   - Service keys can be long-lived with monitoring

## Testing the Integration

```bash
# 1. Start the backend server
cd backend
npm run dev

# 2. Generate a new API key (using Owner credentials)
curl -X POST http://localhost:5000/api/api-keys/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Testing Key",
    "scopes": ["read:customers", "write:customers"],
    "expiresInDays": 30
  }'

# 3. Test the API key
curl http://localhost:5000/api/customers \
  -H "X-API-Key: sk_test_..."

# 4. List all API keys
curl http://localhost:5000/api/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. Revoke an API key
curl -X DELETE http://localhost:5000/api/api-keys/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### "API key not found or invalid"
- Check that the key is copied correctly (no spaces)
- Verify the key hasn't been revoked (`is_active = 1`)
- Check if the key has expired (`expires_at > NOW()`)

### "Insufficient permissions"
- Verify the key has required scopes for the endpoint
- Check `api_keys.scopes` JSON in database
- Generate new key with correct scopes

### Database connection failed
- Ensure MariaDB is running: `sudo systemctl status mariadb`
- Check `backend/.env` database credentials
- Test connection: `mariadb -u root -p`

## Next Steps

1. ✅ Schema updated with API key tables
2. ✅ Seed script generates initial API key
3. ⏳ Start database and run seed script
4. ⏳ Save generated API key to `.env`
5. ⏳ Test API key authentication
6. ⏳ Integrate API key in frontend (optional)
7. ⏳ Remove migration files (no longer needed)

## Files Modified

- `/backend/schema.sql` - Added `api_keys` and `api_key_logs` tables
- `/backend/seed.js` - Added API key generation for Owner user

## Files Now Obsolete

These can be deleted after confirming schema works:
- `/backend/migrations/add_api_keys_table.sql` (integrated into schema.sql)
- `/backend/run-api-keys-migration.js` (not needed for fresh install)

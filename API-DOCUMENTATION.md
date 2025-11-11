# Multi-Shop Branch Management API Documentation

## Overview

RESTful API untuk sistem manajemen cabang dengan role-based access control (RBAC).

**Base URL**: `http://localhost:5000/api`

## Authentication

API menggunakan JWT (JSON Web Token) dengan dua token:
- **Access Token**: Berlaku 15 menit
- **Refresh Token**: Berlaku 7 hari

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Interactive Documentation

- **Swagger UI**: http://localhost:5000/api-docs
- **Postman Collection**: Import file `Multi-Shop-API.postman_collection.json`

## Endpoints Summary

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Login user | ❌ |
| POST | `/auth/logout` | Logout user | ✅ |
| GET | `/auth/me` | Get current user | ✅ |
| POST | `/auth/refresh` | Refresh access token | ❌ |

### Branches (with Statistics)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/branches` | **Get all branches with stats** ⭐ | Admin, Staff |
| GET | `/branches/:id` | Get branch by ID | Admin, Staff |
| POST | `/branches` | Create branch | Admin |
| PUT | `/branches/:id` | Update branch | Admin |
| DELETE | `/branches/:id` | Delete branch | Admin |

#### ⭐ GET /branches Response (Updated)
```json
{
  "success": true,
  "data": [
    {
      "branch_id": 1,
      "branch_name": "Cabang Jakarta Pusat",
      "address": "Jl. Sudirman No. 123",
      "phone_number": "021-12345678",
      "manager_name": "John Doe",
      "created_at": "2025-11-01T00:00:00.000Z",
      "total_staff": 5,
      "total_customers": 150,
      "active_customers": 120,
      "inactive_customers": 30
    }
  ]
}
```

**New Fields**:
- `total_staff`: Jumlah staff di cabang ini
- `total_customers`: Total customer di cabang ini
- `active_customers`: Jumlah customer aktif
- `inactive_customers`: Jumlah customer tidak aktif

### Customers
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/customers` | Get all customers | Admin, Staff |
| GET | `/customers/:id` | Get customer by ID | Admin, Staff |
| POST | `/customers` | Create customer (rate limited) | Admin, Staff |
| PUT | `/customers/:id` | Update customer | Admin, Staff |
| DELETE | `/customers/:id` | Delete customer | Admin, Staff |

**Query Parameters** (GET /customers):
- `branch_id` (optional): Filter by branch
- `status` (optional): Filter by status (Active/Inactive)

**Rate Limiting**: 20 requests per hour per staff

### Staff
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/staff` | Get all staff | Admin |
| GET | `/staff/:id` | Get staff by ID | Admin |
| POST | `/staff` | Create staff | Admin |
| PUT | `/staff/:id` | Update staff | Admin |
| DELETE | `/staff/:id` | Delete staff | Admin |

### Users (Admin Management)
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/users` | Get all admins | Admin |
| POST | `/users` | Create admin | Admin |
| DELETE | `/users/:id` | Delete admin | Admin |

**Password Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

### Dashboard
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard/stats` | Get overall statistics | Admin, Staff |
| GET | `/dashboard/branch-stats` | Get per-branch statistics | Admin |
| GET | `/dashboard/recent-customers` | Get recent customers | Admin, Staff |
| GET | `/dashboard/customer-trends` | Get 12-month trends | Admin |

## Role-Based Access

### Admin Global
- ✅ Full CRUD pada semua resources
- ✅ Akses ke semua cabang
- ✅ Dapat membuat staff dan admin baru

### Staff Cabang
- ✅ Hanya akses ke cabang sendiri
- ✅ CRUD customers di cabang sendiri
- ❌ Tidak bisa membuat/edit staff atau admin
- ❌ Tidak bisa mengakses data cabang lain

## Security Features

| Layer | Implementation |
|-------|---------------|
| **Rate Limiting** | Login: 5/30min, Customer: 20/hour |
| **XSS Prevention** | validator.escape() on all inputs |
| **SQL Injection** | Parameterized queries only |
| **Password Storage** | bcrypt with salt rounds ≥10 |
| **CORS** | Configured for frontend origin |

## Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

**HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Quick Start

### 1. Import Postman Collection
```bash
# File: Multi-Shop-API.postman_collection.json
```

### 2. Login
```bash
POST /api/auth/login
{
  "username": "admin",
  "password": "Admin123!"
}
```

### 3. Use Token
Collection automatically saves token to `{{accessToken}}` variable.

### 4. Test Branches Endpoint
```bash
GET /api/branches
Authorization: Bearer {{accessToken}}
```

Response will include statistics:
- Staff count per branch
- Customer counts (total, active, inactive)

## Database Schema

```
branches (branch_id, branch_name, address, phone_number, manager_name)
  ├── staff (staff_id, branch_id, username, password_hash, full_name)
  └── customers (customer_id, branch_id, full_name, email, phone_number, status)
  
users (user_id, username, password_hash, full_name, role='admin')
```

## Testing Accounts

**Default Admin**:
- Username: `admin`
- Password: `Admin123!`

**Sample Staff** (from seed data):
- Username: `staff_jakarta`
- Password: `Staff123!`

## Support

- Swagger Documentation: http://localhost:5000/api-docs
- GitHub Issues: [Your Repository URL]

---

**Last Updated**: November 11, 2025
**API Version**: 1.0.0

# Multi-Role System Documentation

## Overview
This document describes the multi-role system implementation for the Multi-Shop application. The system now supports multiple user roles for management and branch staff operations.

## User Roles (Management)

These roles are stored in the `users` table and represent management-level access:

| Role | Description | Access Level |
|------|-------------|--------------|
| **Owner** | System owner with full access | Full system access |
| **Manager** | General manager | Full operational access |
| **Head Branch Manager** | Oversees all branches | Branch-wide access |
| **Management** | Management staff | Standard management access |
| **Warehouse** | Warehouse manager | Warehouse operations |
| **Staff** | Basic user role | Limited access |

### Management Role Permissions
Management roles (Owner, Manager, Head Branch Manager, Management, Warehouse) have:
- Access to all branches
- Ability to create, read, update, and delete:
  - Users (management accounts)
  - Staff (branch staff)
  - Branches
  - Customers across all branches
- Access to global analytics and reports
- Full dashboard access

## Staff Roles (Branch-Level)

These roles are stored in the `staff` table and are branch-scoped:

| Role | Description | Branch Access |
|------|-------------|---------------|
| **HeadBranch** | Branch head/manager | Full branch access |
| **Admin** | Branch administrator | Administrative tasks |
| **Cashier** | Branch cashier | Transaction handling |
| **HeadCounter** | Head counter staff | Counter operations |
| **Staff** | Basic staff member | Limited branch access |

### Staff Role Permissions
Staff roles are restricted to their assigned branch only:
- Access limited to their own branch data
- Can manage customers in their branch
- Cannot access other branches
- Cannot manage other staff or users
- Access to branch-specific dashboard

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(30) DEFAULT 'Staff' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_role CHECK (role IN ('Owner', 'Manager', 'Head Branch Manager', 'Management', 'Warehouse', 'Staff'))
);
```

### Staff Table
```sql
CREATE TABLE staff (
  staff_id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  code VARCHAR(50),
  address VARCHAR(500),
  role VARCHAR(30) DEFAULT 'Staff' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_staff_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
  CONSTRAINT chk_staff_role CHECK (role IN ('HeadBranch', 'Admin', 'Cashier', 'HeadCounter', 'Staff'))
);
```

## Authentication & Authorization

### JWT Token Structure
When a user logs in, they receive a JWT token with the following payload:

```javascript
// For management users (from users table)
{
  id: user.id,
  username: user.username,
  role: user.role,        // e.g., 'Owner', 'Manager'
  type: 'user'
}

// For staff (from staff table)
{
  id: user.id,
  username: user.username,
  role: user.role,        // e.g., 'HeadBranch', 'Cashier'
  type: 'staff',
  branch_id: user.branch_id
}
```

### Authorization Middleware

#### authenticateToken
Validates JWT token and extracts user information.

#### authorizeRole(...roles)
Checks if the user's role is in the allowed roles list.

Example:
```javascript
router.get('/', 
  authenticateToken, 
  authorizeRole(USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.MANAGEMENT),
  async (req, res) => { ... }
);
```

#### authorizeBranch
Ensures staff can only access their assigned branch:
- Management roles: Full access to all branches
- Staff roles: Restricted to their branch_id

## API Endpoints

### User Management (Management Roles Only)

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (with role selection)
- `PUT /api/users/:id` - Update user (including role)
- `DELETE /api/users/:id` - Delete user

**Required Roles**: Owner, Manager, Head Branch Manager, Management

### Staff Management (Management Roles Only)

- `GET /api/staff` - List all staff
- `GET /api/staff/:id` - Get staff by ID
- `POST /api/staff` - Create new staff (with role selection)
- `PUT /api/staff/:id` - Update staff (including role)
- `DELETE /api/staff/:id` - Delete staff

**Required Roles**: Owner, Manager, Head Branch Manager, Management

### Customer Management (Management & Staff)

- `GET /api/customers` - List customers (filtered by branch for staff)
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

**Required Roles**: All authenticated users (with branch filtering for staff)

## Frontend Implementation

### Role Constants
Located in `/frontend/src/constants/roles.js`:

```javascript
export const USER_ROLES = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  HEAD_BRANCH_MANAGER: 'Head Branch Manager',
  MANAGEMENT: 'Management',
  WAREHOUSE: 'Warehouse',
  STAFF: 'Staff'
};

export const STAFF_ROLES = {
  HEAD_BRANCH: 'HeadBranch',
  ADMIN: 'Admin',
  CASHIER: 'Cashier',
  HEAD_COUNTER: 'HeadCounter',
  STAFF: 'Staff'
};
```

### UI Components

#### User Management (Admins Page)
- Role selection dropdown in create/edit forms
- Role badges displayed in user list table
- Default role: 'Staff'

#### Staff Management (Staff Page)
- Role selection dropdown in create/edit forms
- Role badges displayed in staff list table
- Default role: 'Staff'
- Branch selection required

## Seed Data

Default test accounts created by `npm run seed`:

### Management Users (all password: CustPSW11!!)
- `owner` - Owner role
- `manager` - Manager role
- `headbranch` - Head Branch Manager role
- `management` - Management role
- `warehouse` - Warehouse role

### Staff Accounts (all password: Staff@123)
- `headbranch_bth` - HeadBranch at BTH branch
- `admin_bth` - Admin at BTH branch
- `cashier_bth` - Cashier at BTH branch
- `headbranch_sbr` - HeadBranch at SBR branch
- `headcounter_sbr` - HeadCounter at SBR branch
- `staff_psw` - Staff at PSW branch

## Security Considerations

1. **Role Validation**: All role assignments are validated against CHECK constraints
2. **Branch Isolation**: Staff cannot access other branches' data
3. **Password Requirements**: Strong password policy for all users
4. **Token Verification**: JWT tokens verified on every request
5. **SQL Injection Prevention**: Prepared statements used throughout
6. **XSS Prevention**: Input sanitization with validator.escape()

## Future Enhancements

Potential improvements for the role system:

1. **Fine-grained Permissions**: Role-based permission matrix
2. **Role Hierarchy**: Define inheritance between roles
3. **Custom Roles**: Allow creation of custom roles
4. **Audit Logging**: Track role changes and access patterns
5. **Multi-Branch Staff**: Support staff assigned to multiple branches
6. **Role-based UI**: Different dashboard layouts per role
7. **Permission Caching**: Cache role permissions for performance

## Migration Guide

### From Old System
The old system had only two roles: 'admin' and 'staff'. To migrate:

1. All existing 'admin' users → Default to 'Manager' role
2. All existing 'staff' → Default to 'Staff' role
3. Update manually as needed via UI or API

### Database Migration Script
```sql
-- Update existing users to Manager role
UPDATE users SET role = 'Manager' WHERE role = 'admin';

-- Update existing staff to Staff role (should already be default)
UPDATE staff SET role = 'Staff' WHERE role = 'staff';
```

## Troubleshooting

### Common Issues

1. **"You do not have permission to access this resource"**
   - Check if user role is in the allowed roles for the endpoint
   - Verify JWT token contains correct role information

2. **"Staff account must have a branch assigned"**
   - Ensure staff has valid branch_id in database
   - Check if branch still exists

3. **"Invalid branch_id"**
   - Verify branch exists before creating/updating staff
   - Check foreign key constraints

4. **Role not appearing in dropdown**
   - Check if role is defined in constants/roles.js
   - Verify role matches backend validation

## Testing Checklist

- [ ] Create user with each role type
- [ ] Create staff with each role type
- [ ] Verify management users can access all branches
- [ ] Verify staff can only access their branch
- [ ] Test role updates via API
- [ ] Test role selection in UI
- [ ] Verify role badges display correctly
- [ ] Test authorization for each endpoint
- [ ] Verify CHECK constraints prevent invalid roles
- [ ] Test seed script creates all roles correctly

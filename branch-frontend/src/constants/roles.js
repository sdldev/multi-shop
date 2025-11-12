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

export const USER_ROLE_OPTIONS = [
  { value: USER_ROLES.OWNER, label: 'Owner' },
  { value: USER_ROLES.MANAGER, label: 'Manager' },
  { value: USER_ROLES.HEAD_BRANCH_MANAGER, label: 'Head Branch Manager' },
  { value: USER_ROLES.MANAGEMENT, label: 'Management' },
  { value: USER_ROLES.WAREHOUSE, label: 'Warehouse' },
  { value: USER_ROLES.STAFF, label: 'Staff' }
];

export const STAFF_ROLE_OPTIONS = [
  { value: STAFF_ROLES.HEAD_BRANCH, label: 'Head Branch' },
  { value: STAFF_ROLES.ADMIN, label: 'Admin' },
  { value: STAFF_ROLES.CASHIER, label: 'Cashier' },
  { value: STAFF_ROLES.HEAD_COUNTER, label: 'Head Counter' },
  { value: STAFF_ROLES.STAFF, label: 'Staff' }
];

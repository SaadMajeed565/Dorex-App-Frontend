// Permission categories based on app modules
export const permissionCategories = [
  {
    category: 'Dashboard',
    icon: 'fa-regular fa-home',
    permissions: [
      { key: 'view-dashboard', label: 'View Dashboard' },
      { key: 'stats-dashboard', label: 'View Statistics' },
      { key: 'reports-dashboard', label: 'View Reports' }
    ]
  },
  {
    category: 'Customers',
    icon: 'fa-regular fa-users',
    permissions: [
      { key: 'view-customer', label: 'View Customers' },
      { key: 'create-customer', label: 'Create Customers' },
      { key: 'update-customer', label: 'Edit Customers' },
      { key: 'delete-customer', label: 'Delete Customers' }
    ]
  },
  {
    category: 'Subscriptions',
    icon: 'fa-regular fa-badge-check',
    permissions: [
      { key: 'view-subscription', label: 'View Subscriptions' },
      { key: 'create-subscription', label: 'Create Subscriptions' },
      { key: 'update-subscription', label: 'Edit Subscriptions' },
      { key: 'delete-subscription', label: 'Delete Subscriptions' }
    ]
  },
  {
    category: 'Payments',
    icon: 'fa-regular fa-credit-card',
    permissions: [
      { key: 'view-payment', label: 'View Payments' },
      { key: 'create-payment', label: 'Create Payments' },
      { key: 'update-payment', label: 'Edit Payments' },
      { key: 'delete-payment', label: 'Delete Payments' }
    ]
  },
  {
    category: 'Areas',
    icon: 'fa-regular fa-map-location-dot',
    permissions: [
      { key: 'view-area', label: 'View Areas' },
      { key: 'create-area', label: 'Create Areas' },
      { key: 'update-area', label: 'Edit Areas' },
      { key: 'delete-area', label: 'Delete Areas' }
    ]
  },
  {
    category: 'Packages',
    icon: 'fa-regular fa-boxes-stacked',
    permissions: [
      { key: 'view-package', label: 'View Packages' },
      { key: 'create-package', label: 'Create Packages' },
      { key: 'update-package', label: 'Edit Packages' },
      { key: 'delete-package', label: 'Delete Packages' }
    ]
  },
  {
    category: 'Equipment',
    icon: 'fa-regular fa-router',
    permissions: [
      { key: 'view-equipment', label: 'View Equipment' },
      { key: 'create-equipment', label: 'Create Equipment' },
      { key: 'update-equipment', label: 'Edit Equipment' },
      { key: 'delete-equipment', label: 'Delete Equipment' }
    ]
  },
  {
    category: 'Inventory',
    icon: 'fa-regular fa-warehouse',
    permissions: [
      { key: 'view-inventory', label: 'View Inventory' },
      { key: 'create-inventory', label: 'Create Inventory' },
      { key: 'update-inventory', label: 'Edit Inventory' },
      { key: 'delete-inventory', label: 'Delete Inventory' }
    ]
  },
  {
    category: 'Employees',
    icon: 'fa-regular fa-id-badge',
    permissions: [
      { key: 'view-employee', label: 'View Employees' },
      { key: 'create-employee', label: 'Create Employees' },
      { key: 'update-employee', label: 'Edit Employees' },
      { key: 'delete-employee', label: 'Delete Employees' }
    ]
  },
  {
    category: 'Complaints',
    icon: 'fa-regular fa-message-exclamation',
    permissions: [
      { key: 'view-complaint', label: 'View Complaints' },
      { key: 'create-complaint', label: 'Create Complaints' },
      { key: 'update-complaint', label: 'Edit Complaints' },
      { key: 'delete-complaint', label: 'Delete Complaints' }
    ]
  },
  {
    category: 'Tasks',
    icon: 'fa-regular fa-list-check',
    permissions: [
      { key: 'view-task', label: 'View Tasks' },
      { key: 'create-task', label: 'Create Tasks' },
      { key: 'update-task', label: 'Edit Tasks' },
      { key: 'delete-task', label: 'Delete Tasks' }
    ]
  },
  {
    category: 'Accounts',
    icon: 'fa-regular fa-books',
    permissions: [
      { key: 'view-account', label: 'View Accounts' },
      { key: 'create-account', label: 'Create Accounts' },
      { key: 'update-account', label: 'Edit Accounts' },
      { key: 'delete-account', label: 'Delete Accounts' }
    ]
  },
  {
    category: 'Communications',
    icon: 'fa-regular fa-messages',
    permissions: [
      { key: 'view-communication', label: 'View Communications' },
      { key: 'create-communication', label: 'Create Communications' },
      { key: 'update-communication', label: 'Edit Communications' },
      { key: 'delete-communication', label: 'Delete Communications' }
    ]
  },
  {
    category: 'Users',
    icon: 'fa-regular fa-user',
    permissions: [
      { key: 'view-user', label: 'View Users' },
      { key: 'create-user', label: 'Create Users' },
      { key: 'update-user', label: 'Edit Users' },
      { key: 'delete-user', label: 'Delete Users' }
    ]
  },
  {
    category: 'Settings',
    icon: 'fa-regular fa-gear',
    permissions: [
      { key: 'view-setting', label: 'View Settings' },
      { key: 'update-setting', label: 'Edit Settings' },
      { key: 'roles-settings', label: 'Manage Roles' }
    ]
  }
];

export const totalPermissions = permissionCategories.reduce((sum, cat) => sum + cat.permissions.length, 0);

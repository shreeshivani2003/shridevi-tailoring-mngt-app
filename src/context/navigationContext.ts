// Navigation context for app navigation and test automation
export const navigationItems = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    id: 'nav-dashboard',
  },
  {
    name: 'customers',
    label: 'Customers',
    path: '/customers',
    id: 'nav-customers',
  },
  {
    name: 'orders',
    label: 'Orders',
    path: '/orders',
    id: 'nav-orders',
  },
  {
    name: 'status',
    label: 'Status',
    path: '/status',
    id: 'nav-status',
  },
  {
    name: 'sizeChart',
    label: 'Size Chart',
    path: '/size-chart',
    id: 'nav-size-chart',
  },
  {
    name: 'superAdmin',
    label: 'Super Admin',
    path: '/super-admin',
    id: 'nav-super-admin',
  },
];

// Example alert/confirmation texts for navigation actions (if any)
export const navigationAlerts = {
  logout: 'Are you sure you want to logout?',
  deleteOrder: 'Are you sure you want to delete this order? This action cannot be undone.',
  resetSizeChart: 'Are you sure you want to reset all measurements?',
}; 
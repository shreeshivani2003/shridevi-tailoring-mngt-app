// Feature flags configuration
// Set to false to hide components, true to show them
export const FEATURE_FLAGS = {
  DASHBOARD_ENABLED: false,
  SIZE_CHART_ENABLED: false,
  // Add more feature flags here as needed
  SUPER_ADMIN_ENABLED: true,
  CUSTOMERS_ENABLED: true,
  ORDERS_ENABLED: true,
  STATUS_ENABLED: true,
} as const;

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
}; 
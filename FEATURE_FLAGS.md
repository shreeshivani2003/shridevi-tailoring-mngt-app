# Feature Flags Configuration

This document explains how to use the feature flags system to show/hide components in the Shri Devi Tailoring Management System.

## Overview

The feature flags system allows you to easily enable or disable specific components without modifying the code. This is useful for:
- Hiding features that are not ready for production
- A/B testing features
- Gradually rolling out new features
- Temporarily disabling features for maintenance

## Configuration File

The feature flags are configured in `src/config/features.ts`:

```typescript
export const FEATURE_FLAGS = {
  DASHBOARD_ENABLED: false,      // Hide Dashboard component
  SIZE_CHART_ENABLED: false,     // Hide Size Chart component
  SUPER_ADMIN_ENABLED: true,     // Show Super Admin component
  CUSTOMERS_ENABLED: true,       // Show Customers component
  ORDERS_ENABLED: true,          // Show Orders component
  STATUS_ENABLED: true,          // Show Status component
} as const;
```

## How to Hide/Show Components

### To Hide a Component:
1. Set the corresponding feature flag to `false` in `src/config/features.ts`
2. The component will be automatically hidden from:
   - Navigation menu
   - Routing system
   - Any direct URL access

### To Show a Component:
1. Set the corresponding feature flag to `true` in `src/config/features.ts`
2. The component will be automatically available in:
   - Navigation menu (for users with appropriate roles)
   - Routing system
   - Direct URL access

## Current Hidden Components

As of now, the following components are hidden:

- **Dashboard** (`DASHBOARD_ENABLED: false`)
  - Hidden from admin and super_admin users
  - Default redirect changed from `/dashboard` to `/orders`

- **Size Chart** (`SIZE_CHART_ENABLED: false`)
  - Hidden from admin and super_admin users
  - Not accessible via navigation or direct URL

## How to Re-enable Hidden Components

To re-enable the Dashboard and Size Chart components later:

1. Open `src/config/features.ts`
2. Change the values:
   ```typescript
   export const FEATURE_FLAGS = {
     DASHBOARD_ENABLED: true,     // Show Dashboard
     SIZE_CHART_ENABLED: true,    // Show Size Chart
     // ... other flags
   };
   ```
3. Save the file
4. The components will be immediately available

## Adding New Feature Flags

To add a new feature flag for another component:

1. Add the flag to `src/config/features.ts`:
   ```typescript
   export const FEATURE_FLAGS = {
     // ... existing flags
     NEW_COMPONENT_ENABLED: false,
   } as const;
   ```

2. Update the routing in `src/App.tsx`:
   ```typescript
   {isFeatureEnabled('NEW_COMPONENT_ENABLED') && (
     <Route 
       path="new-component" 
       element={<NewComponent />} 
     />
   )}
   ```

3. Update the navigation in `src/components/Layout.tsx`:
   ```typescript
   const navigationItems = [
     // ... existing items
     ...(isFeatureEnabled('NEW_COMPONENT_ENABLED') ? [
       { path: '/new-component', icon: NewIcon, label: 'New Component', roles: ['admin'] }
     ] : []),
   ];
   ```

## Benefits

- **Easy Management**: No need to modify multiple files to hide/show components
- **Clean Code**: Components remain in the codebase but are conditionally rendered
- **Quick Rollback**: Can quickly disable features if issues arise
- **Gradual Rollout**: Can enable features for specific user groups
- **Maintenance**: Can temporarily disable features during maintenance

## Notes

- Hidden components are still imported and available in the codebase
- The feature flags are checked at runtime, so changes take effect immediately
- Users cannot access hidden components even with direct URLs
- The system gracefully handles missing routes by redirecting to available pages 
// Role-based access control configuration

export type UserRole = 'admin' | 'manager' | 'instructor' | 'customer';

export interface User {
  email: string;
  role: UserRole;
  _id?: string;
}

// Define which pages each role can access
export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    '/dashboard',
    '/customers',
    '/staff',
    '/vehicles',
    '/lessons',
    '/payments',
    '/addresses',
    '/assignments',
    '/chat',
    '/profile'
  ],
  manager: [
    '/dashboard',
    '/customers',
    '/staff',
    '/vehicles',
    '/lessons',
    '/payments',
    '/assignments',
    '/chat',
    '/profile'
  ],
  instructor: [
    '/dashboard',
    '/lessons',
    '/customers',
    '/vehicles',
    '/chat',
    '/profile'
  ],
  customer: [
    '/dashboard',
    '/lessons',
    '/payments',
    '/chat',
    '/profile'
  ]
};

// Check if user has access to a specific route
export const hasAccess = (userRole: UserRole, path: string): boolean => {
  const permissions = rolePermissions[userRole];
  return permissions.some(route => path.startsWith(route));
};

// Get available routes for a user role
export const getAvailableRoutes = (userRole: UserRole) => {
  return rolePermissions[userRole];
};

// Role descriptions
export const roleDescriptions: Record<UserRole, string> = {
  admin: 'Full system access - manage all users, data, and settings',
  manager: 'Manage customers, staff, vehicles, lessons, and payments',
  instructor: 'View and manage lessons, customers, and vehicles',
  customer: 'View your lessons, payments, and personal information'
};

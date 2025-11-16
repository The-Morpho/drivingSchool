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
    '/profile'
  ],
  instructor: [
    '/dashboard',
    '/lessons',
    '/customers',
    '/vehicles',
    '/profile'
  ],
  customer: [
    '/dashboard',
    '/lessons',
    '/payments',
    '/profile'
  ]
};

// Check if user has access to a specific route
/**
 * Normalize raw role strings (possibly coming from headers/localStorage) to the
 * canonical UserRole used across the frontend.
 */
export function normalizeRole(raw?: string | null): UserRole | null {
  if (!raw || typeof raw !== 'string') return null;
  const r = raw.trim().toLowerCase();
  if (r === 'admin' || r === 'administrator') return 'admin';
  if (r === 'manager' || r === 'management') return 'manager';
  if (r === 'staff' || r === 'instructor' || r === 'teacher') return 'instructor';
  if (r === 'customer' || r === 'user') return 'customer';
  return null;
}

// Check if user has access to a specific route. Accepts either a canonical
// UserRole value or a raw string (will be normalized).
export const hasAccess = (userRole: UserRole | string | undefined | null, path: string): boolean => {
  const canonical = typeof userRole === 'string' ? normalizeRole(userRole) : userRole;
  if (!canonical) return false;
  const permissions = rolePermissions[canonical];
  return permissions.some(route => path.startsWith(route));
};

// Get available routes for a user role. Accepts canonical UserRole or raw string.
export const getAvailableRoutes = (userRole: UserRole | string | undefined | null) => {
  const canonical = typeof userRole === 'string' ? normalizeRole(userRole) : userRole;
  if (!canonical) return [] as string[];
  return rolePermissions[canonical];
};

// Role descriptions
export const roleDescriptions: Record<UserRole, string> = {
  admin: 'Full system access - manage all users, data, and settings',
  manager: 'Manage customers, staff, vehicles, lessons, and payments',
  instructor: 'View and manage lessons, customers, and vehicles',
  customer: 'View your lessons, payments, and personal information'
};

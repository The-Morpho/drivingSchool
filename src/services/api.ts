import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Add user info to all requests
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);

      // Accept several possible shapes and normalize
      const accountId = user.account_id || user.accountId || user.account || null;
      const username = user.username || user.email || null;
      const roleRaw = user.role || user.userRole || user.user_type || userTypeFromRole(user.userType) || '';
      const userTypeRaw = user.userType || user.user_type || userTypeFromRole(roleRaw) || '';

      // Normalize role: trim, toLower, and map synonyms to canonical backend/frontend roles
      const role = normalizeRole(roleRaw);

      // Normalize userType to capitalized form expected by some backend fields (Manager/Staff/Customer)
      const userType = typeof userTypeRaw === 'string' && userTypeRaw
        ? capitalize(userTypeRaw)
        : (role ? capitalize(role) : '');

      if (accountId && username && role && userType) {
        config.headers['x-account-id'] = String(accountId);
        config.headers['x-username'] = String(username);
        // send lowercase role so backend permission checks (e.g., 'manager') work
        config.headers['x-user-role'] = role;
        // also include redundant role headers for backward compatibility with
        // different backend checks (some code may look for 'x-role' or 'role')
        config.headers['x-role'] = role;
        config.headers['role'] = role;
        // send capitalized userType for backward compatibility (e.g., 'Manager')
        config.headers['x-user-type'] = userType;
      } else {
        console.error('Incomplete user data in localStorage', { accountId, username, role, userType });
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Invalid user data in localStorage:', err);
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
  return config;
});

// Debug outgoing requests for diagnosis
api.interceptors.request.use((config) => {
  try {
    console.debug('[api] outgoing request', {
      method: config.method,
      url: config.baseURL ? `${config.baseURL}${config.url}` : config.url,
      headers: config.headers,
      // don't print body with password in logs; if present, print keys only
      dataKeys: config.data ? Object.keys(config.data) : undefined,
    });
  } catch (e) {
    // ignore logging errors
  }
  return config;
});

// Map various role strings to canonical frontend/backend roles
function normalizeRole(roleRaw: any): string {
  if (!roleRaw || typeof roleRaw !== 'string') return '';
  const r = roleRaw.trim().toLowerCase();
  if (r === 'admin' || r === 'administrator') return 'admin';
  if (r === 'manager' || r === 'man' || r === 'management') return 'manager';
  if (r === 'staff' || r === 'instructor' || r === 'teacher') return 'instructor';
  if (r === 'customer' || r === 'user') return 'customer';
  // fallback: return raw lowercase value
  return r;
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function userTypeFromRole(roleRaw: any) {
  if (!roleRaw || typeof roleRaw !== 'string') return '';
  const r = roleRaw.toLowerCase();
  if (r === 'manager' || r === 'admin') return 'Manager';
  if (r === 'staff' || r === 'instructor') return 'Staff';
  if (r === 'customer') return 'Customer';
  return '';
}

// Handle 401 errors and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized request, redirecting to login');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  login: (username: string, password: string) => api.post('/login', { username, password }),
  addresses: {
    getAll: () => api.get('/addresses'),
    getById: (id: string) => api.get(`/addresses/${id}`),
    create: (data: any) => api.post('/addresses', data),
    update: (id: string, data: any) => api.put(`/addresses/${id}`, data),
    delete: (id: string) => api.delete(`/addresses/${id}`),
  },
  customers: {
    getAll: () => api.get('/customers'),
    getById: (id: string) => api.get(`/customers/${id}`),
    create: (data: any) => api.post('/customers', data),
    update: (id: string, data: any) => api.put(`/customers/${id}`, data),
    delete: (id: string) => api.delete(`/customers/${id}`),
  },
  payments: {
    getAll: () => api.get('/payments'),
    getById: (id: string) => api.get(`/payments/${id}`),
    create: (data: any) => api.post('/payments', data),
    update: (id: string, data: any) => api.put(`/payments/${id}`, data),
    delete: (id: string) => api.delete(`/payments/${id}`),
  },
  lessons: {
    getAll: () => api.get('/lessons'),
    getById: (id: string) => api.get(`/lessons/${id}`),
    getAvailableInstructors: (customerId: number | string) => api.get(`/lessons/available-instructors/${customerId}`),
    getStaffWithCustomers: () => api.get('/lessons/staff-with-customers'),
    getAssignmentsForCreation: () => api.get('/lessons/assignments/for-creation'),
    create: (data: any) => api.post('/lessons', data),
    update: (id: string, data: any) => api.put(`/lessons/${id}`, data),
    delete: (id: string) => api.delete(`/lessons/${id}`),
  },
  staff: {
    getAll: () => api.get('/staff'),
    getById: (id: string) => api.get(`/staff/${id}`),
    create: (data: any) => api.post('/staff', data),
    update: (id: string, data: any) => api.put(`/staff/${id}`, data),
    delete: (id: string) => api.delete(`/staff/${id}`),
  },
  vehicles: {
    getAll: () => api.get('/vehicles'),
    getById: (id: string) => api.get(`/vehicles/${id}`),
    create: (data: any) => api.post('/vehicles', data),
    update: (id: string, data: any) => api.put(`/vehicles/${id}`, data),
    delete: (id: string) => api.delete(`/vehicles/${id}`),
  },
  managers: {
    getAll: () => api.get('/managers'),
    getById: (id: string) => api.get(`/managers/${id}`),
    create: (data: any) => api.post('/managers', data),
    update: (id: string, data: any) => api.put(`/managers/${id}`, data),
    delete: (id: string) => api.delete(`/managers/${id}`),
  },
  accounts: {
    getAll: () => api.get('/accounts'),
    getById: (id: string) => api.get(`/accounts/${id}`),
    create: (data: any) => api.post('/accounts', data),
    update: (id: string, data: any) => api.put(`/accounts/${id}`, data),
    delete: (id: string) => api.delete(`/accounts/${id}`),
  },
  
};

export default api;

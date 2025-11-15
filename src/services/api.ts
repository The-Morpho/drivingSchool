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
      // Validate that user has all required fields
      if (user.account_id && user.username && user.role && user.userType) {
        config.headers['x-account-id'] = user.account_id;
        config.headers['x-username'] = user.username;
        config.headers['x-user-role'] = user.role;
        config.headers['x-user-type'] = user.userType; // Manager, Staff, or Customer
      } else {
        // User data is incomplete, redirect to login
        console.error('Incomplete user data in localStorage');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (err) {
      // Invalid JSON in localStorage, redirect to login
      console.error('Invalid user data in localStorage:', err);
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
  return config;
});

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
  assignments: {
    getAll: () => api.get('/assignments'),
    getMyCustomers: () => api.get('/assignments/my-customers'),
    getMyStaff: () => api.get('/assignments/my-staff'),
    getAssignedCustomers: (staffId: string) => api.get(`/assignments/staff/${staffId}/customers`),
    getAssignedStaff: (customerId: string) => api.get(`/assignments/customer/${customerId}/staff`),
    getCustomersByStaffAddress: (staffId: string) => api.get(`/assignments/staff/${staffId}/available-customers`),
    create: (data: any) => api.post('/assignments', data),
    bulkCreate: (data: any) => api.post('/assignments/bulk', data),
    delete: (assignmentId: string) => api.delete(`/assignments/${assignmentId}`),
    getStats: () => api.get('/assignments/stats'),
  },
};

export default api;

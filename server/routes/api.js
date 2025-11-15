import express from 'express';
import bcrypt from 'bcrypt';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/auth.js';
import * as customerController from '../controllers/customerController.js';
import * as staffController from '../controllers/staffController.js';
import * as lessonController from '../controllers/lessonController.js';
import * as paymentController from '../controllers/paymentController.js';
import * as vehicleController from '../controllers/vehicleController.js';
import * as addressController from '../controllers/addressController.js';
import Account from '../models/Account.js';
import Staff from '../models/Staff.js';
import Customer from '../models/Customer.js';


const router = express.Router();

// Public route - Login (no auth required)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find account by username
    const account = await Account.findOne({ username, is_active: true });
    
    if (!account) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, account.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Fetch user details based on role and convert to lowercase frontend role
    let userDetails = null;
    let frontendRole = null;

    if (account.role === 'Manager') {
      userDetails = await Staff.findOne({ staff_id: account.manager_id });
      // Determine if manager is admin or manager based on username
      frontendRole = account.username === 'admin' ? 'admin' : 'manager';
    } else if (account.role === 'Staff') {
      userDetails = await Staff.findOne({ staff_id: account.staff_id });
      frontendRole = 'instructor';
    } else if (account.role === 'Customer') {
      userDetails = await Customer.findOne({ customer_id: account.customer_id });
      frontendRole = 'customer';
    }

    if (!userDetails) {
      return res.status(404).json({ error: 'User details not found' });
    }

    // Convert user details to plain object and spread all fields
    const userDetailsObj = userDetails.toObject();

    // Return user info with lowercase role for frontend
    res.json({
      _id: userDetails._id,
      account_id: account.account_id,
      username: account.username,
      email: userDetailsObj.email_address,
      role: frontendRole, // Lowercase role: admin, manager, instructor, customer
      userType: account.role, // Database role: Manager, Staff, Customer
      first_name: userDetailsObj.first_name,
      last_name: userDetailsObj.last_name,
      isActive: account.is_active,
      createdAt: account.createdAt,
      // Include all user-specific fields
      ...userDetailsObj
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply authentication to all routes below
router.use(authenticate);

// Customers routes with role-based filtering
router.get('/customers', customerController.getAll);
router.get('/customers/:id', customerController.getById);
router.post('/customers', authorize('admin', 'manager'), customerController.create);
router.put('/customers/:id', customerController.update);
router.delete('/customers/:id', authorize('admin', 'manager'), customerController.delete_);

// Staff routes with role-based filtering
router.get('/staff', staffController.getAll);
router.get('/staff/:id', staffController.getById);
router.post('/staff', authorize('admin', 'manager'), staffController.create);
router.put('/staff/:id', staffController.update);
router.delete('/staff/:id', authorize('admin', 'manager'), staffController.delete_);

// Lessons routes with role-based filtering
router.get('/lessons', lessonController.getAll);
router.get('/lessons/available-instructors/:customer_id', authorize('admin', 'manager'), lessonController.getAvailableInstructors);
router.get('/lessons/staff-with-customers', authorize('admin', 'manager'), lessonController.getStaffWithAssignedCustomers);
router.get('/lessons/assignments/for-creation', authorize('admin', 'manager'), lessonController.getAssignmentsForLessonCreation);
router.get('/lessons/:id', lessonController.getById);
router.post('/lessons', authorize('admin', 'manager'), lessonController.create);
router.put('/lessons/:id', authorize('admin', 'manager', 'instructor', 'staff'), lessonController.update);
router.delete('/lessons/:id', authorize('admin', 'manager'), lessonController.delete_);

// Payments routes with role-based filtering
router.get('/payments', paymentController.getAll);
router.get('/payments/:id', paymentController.getById);
router.post('/payments', authorize('admin', 'manager'), paymentController.create);
router.put('/payments/:id', authorize('admin', 'manager'), paymentController.update);
router.delete('/payments/:id', authorize('admin', 'manager'), paymentController.delete_);

// Vehicle routes with dedicated controller
router.get('/vehicles', vehicleController.getAll);
router.get('/vehicles/:id', vehicleController.getById);
router.post('/vehicles', authorize('admin', 'manager'), vehicleController.create);
router.put('/vehicles/:id', authorize('admin', 'manager'), vehicleController.update);
router.delete('/vehicles/:id', authorize('admin', 'manager'), vehicleController.delete_);

// Address routes with dedicated controller
router.get('/addresses', addressController.getAll);
router.get('/addresses/:id', addressController.getById);
router.post('/addresses', authorize('admin', 'manager', 'staff'), addressController.create);
router.put('/addresses/:id', authorize('admin', 'manager'), addressController.update);
router.delete('/addresses/:id', authorize('admin', 'manager'), addressController.delete_);

export default router;

import Customer from '../models/Customer.js';
import Staff from '../models/Staff.js';
import Account from '../models/Account.js';
import Address from '../models/Address.js';
import bcrypt from 'bcrypt';

export const getAll = async (req, res) => {
  try {
    const { role, username, userType } = req.user;
    let data;

    if (role === 'admin' || role === 'manager') {
      // Admin and Manager see all customers
      const customers = await Customer.find();
      // Fetch account status for each customer
      const customersWithStatus = await Promise.all(
        customers.map(async (customer) => {
          const account = await Account.findOne({ customer_id: customer.customer_id });
          return {
            ...customer.toObject(),
            isActive: account ? account.is_active : true
          };
        })
      );
      data = customersWithStatus;
    } else if (role === 'instructor' || role === 'staff') {
      // Instructor sees customers they have lessons with OR assignments with
      const Lesson = (await import('../models/Lesson.js')).default;
      const StaffCustomerAssignment = (await import('../models/StaffCustomerAssignment.js')).default;
      const staffRecord = await Staff.findOne({ nickname: username });
      
      if (!staffRecord) {
        return res.json([]);
      }

      // Get customer IDs from lessons
      const lessons = await Lesson.find({ staff_id: staffRecord.staff_id });
      const lessonCustomerIds = lessons.map(l => l.customer_id);
      
      // Get customer IDs from assignments
      const assignments = await StaffCustomerAssignment.find({ 
        staff_id: staffRecord.staff_id, 
        is_active: true 
      });
      const assignmentCustomerIds = assignments.map(a => a.customer_id);
      
      // Combine and get unique customer IDs
      const customerIds = [...new Set([...lessonCustomerIds, ...assignmentCustomerIds])];
      data = await Customer.find({ customer_id: { $in: customerIds } });
    } else if (role === 'customer') {
      // Customer sees only their own record
      // Look up customer by Account username, not email_address
      const account = await Account.findOne({ username, role: 'Customer' });
      if (!account || !account.customer_id) {
        return res.json([]);
      }
      const customerRecord = await Customer.findOne({ customer_id: account.customer_id });
      data = customerRecord ? [customerRecord] : [];
    } else {
      data = [];
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const { role, username } = req.user;
    const data = await Customer.findById(req.params.id);
    
    if (!data) return res.status(404).json({ error: 'Not found' });

    // Check permissions
    if (role === 'customer' && data.email_address !== username) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const { 
      email_address, 
      password,
      username,
      isActive = true,
      customer_address_id,
      ...customerData 
    } = req.body;

    // Validate required fields
    if (!email_address || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Use provided username or fallback to email
    const accountUsername = username || email_address;

    // Check if username already exists
    const existingAccount = await Account.findOne({ username: accountUsername });
    if (existingAccount) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Get the next customer_id
    const lastCustomer = await Customer.findOne().sort({ customer_id: -1 });
    const nextCustomerId = lastCustomer ? lastCustomer.customer_id + 1 : 1;

    // Create Customer record with address reference
    const customer = await Customer.create({
      customer_id: nextCustomerId,
      email_address,
      customer_address_id: customer_address_id || null,
      ...customerData
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the next account_id
    const lastAccount = await Account.findOne().sort({ account_id: -1 });
    const nextAccountId = lastAccount ? lastAccount.account_id + 1 : 1;

    // Create Account record
    const account = await Account.create({
      account_id: nextAccountId,
      username: accountUsername,
      password: hashedPassword,
      role: 'Customer',
      customer_id: customer.customer_id,
      is_active: isActive
    });

    res.status(201).json({
      message: 'Customer created successfully',
      customer: customer,
      account: {
        account_id: account.account_id,
        username: account.username,
        role: account.role,
        is_active: account.is_active
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { role, username } = req.user;
    const existing = await Customer.findById(req.params.id);
    
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // Check permissions
    if (role === 'customer' && existing.email_address !== username) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Extract isActive from request body
    const { isActive, ...customerData } = req.body;
    
    // Update customer data
    const data = await Customer.findByIdAndUpdate(req.params.id, customerData, { new: true });
    
    // Update account status if isActive is provided
    if (isActive !== undefined) {
      await Account.findOneAndUpdate(
        { customer_id: data.customer_id },
        { is_active: isActive }
      );
    }
    
    // Return customer with updated isActive status
    res.json({ ...data.toObject(), isActive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const delete_ = async (req, res) => {
  try {
    const data = await Customer.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    
    // Get customer's account to find username
    const account = await Account.findOne({ customer_id: data.customer_id });
    const customerUsername = account ? account.username : null;
    
    // Also delete all assignments for this customer
    const StaffCustomerAssignment = (await import('../models/StaffCustomerAssignment.js')).default;
    await StaffCustomerAssignment.deleteMany({ customer_id: data.customer_id });
    
    // Delete all chat rooms and messages for this customer
    if (customerUsername) {
      const ChatRoom = (await import('../models/ChatRoom.js')).default;
      const Message = (await import('../models/Message.js')).default;
      
      // Find all chat rooms for this customer
      const chatRooms = await ChatRoom.find({ customer_username: customerUsername });
      const roomIds = chatRooms.map(room => room.room_id);
      
      // Delete all messages in these rooms
      if (roomIds.length > 0) {
        await Message.deleteMany({ room_id: { $in: roomIds } });
      }
      
      // Delete the chat rooms
      await ChatRoom.deleteMany({ customer_username: customerUsername });
    }
    
    // Also delete the account
    await Account.deleteOne({ customer_id: data.customer_id });
    
    // Delete the customer's address if they have one
    if (data.customer_address_id) {
      await Address.deleteOne({ address_id: data.customer_address_id });
    }
    
    // Delete all payments for this customer
    const CustomerPayment = (await import('../models/CustomerPayment.js')).default;
    await CustomerPayment.deleteMany({ customer_id: data.customer_id });
    
    res.json({ message: 'Customer deleted successfully (including assignments, account, address, payments, and chat rooms)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

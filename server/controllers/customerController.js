import { ObjectId } from 'mongodb';
import { getDB } from '../db.js';
import bcrypt from 'bcrypt';

const getCollection = (name) => getDB().collection(name);

export const getAll = async (req, res) => {
  try {
    const { role, username } = req.user;
    let data;

    if (role === 'admin' || role === 'manager') {
      // Admin and Manager see all customers
      const customers = await getCollection('Customers').find().toArray();
      // Fetch account status for each customer
      const customersWithStatus = await Promise.all(
        customers.map(async (customer) => {
          const account = await getCollection('Account').findOne({ customer_id: customer.customer_id });
          return {
            ...customer,
            isActive: account ? account.is_active : true
          };
        })
      );
      data = customersWithStatus;
    } else if (role === 'instructor' || role === 'staff') {
      // Instructor sees customers they have lessons with
      const staffRecord = await getCollection('Staff').findOne({ nickname: username });
      
      if (!staffRecord) {
        return res.json([]);
      }

      // Get customer IDs from lessons
      const lessons = await getCollection('Lessons').find({ staff_id: staffRecord.staff_id }).toArray();
      const customerIds = [...new Set(lessons.map(l => l.customer_id))];
      
      data = await getCollection('Customers').find({ customer_id: { $in: customerIds } }).toArray();
    } else if (role === 'customer') {
      // Customer sees only their own record
      const account = await getCollection('Account').findOne({ username, role: 'Customer' });
      if (!account || !account.customer_id) {
        return res.json([]);
      }
      const customerRecord = await getCollection('Customers').findOne({ customer_id: account.customer_id });
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
    const data = await getCollection('Customers').findOne({ _id: new ObjectId(req.params.id) });
    
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
      inscription_price = 0,
      ...customerData 
    } = req.body;

    // Validate required fields
    if (!email_address || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Use provided username or fallback to email
    const accountUsername = username || email_address;

    // Check if username already exists
    const existingAccount = await getCollection('Account').findOne({ username: accountUsername });
    if (existingAccount) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Get the next customer_id
    const lastCustomer = await getCollection('Customers').findOne({}, { sort: { customer_id: -1 } });
    const nextCustomerId = lastCustomer ? lastCustomer.customer_id + 1 : 1;

    // Create Customer record with address reference and initialize amount_outstanding
    const customerDoc = {
      customer_id: nextCustomerId,
      email_address,
      customer_address_id: customer_address_id || null,
      amount_outstanding: inscription_price, // Initialize with inscription price
      ...customerData
    };

    const customerResult = await getCollection('Customers').insertOne(customerDoc);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the next account_id
    const lastAccount = await getCollection('Account').findOne({}, { sort: { account_id: -1 } });
    const nextAccountId = lastAccount ? lastAccount.account_id + 1 : 1;

    // Create Account record with numeric customer_id
    const accountDoc = {
      account_id: nextAccountId,
      username: accountUsername,
      password: hashedPassword,
      role: 'Customer',
      customer_id: nextCustomerId, // Use numeric ID
      is_active: isActive
    };

    await getCollection('Account').insertOne(accountDoc);

    res.status(201).json({
      message: 'Customer created successfully',
      customer: { _id: customerResult.insertedId, ...customerDoc },
      account: {
        account_id: accountDoc.account_id,
        username: accountDoc.username,
        role: accountDoc.role,
        is_active: accountDoc.is_active
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { role, username } = req.user;
    const existing = await getCollection('Customers').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // Check permissions
    if (role === 'customer' && existing.email_address !== username) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Extract isActive from request body
    const { isActive, _id, ...customerData } = req.body;
    
    // Update customer data
    const data = await getCollection('Customers').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: customerData },
      { returnDocument: 'after' }
    );
    
    // Update account status if isActive is provided
    if (isActive !== undefined) {
      await getCollection('Account').updateOne(
        { customer_id: data.customer_id },
        { $set: { is_active: isActive } }
      );
    }
    
    // Return customer with updated isActive status
    res.json({ ...data, isActive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const delete_ = async (req, res) => {
  try {
    const data = await getCollection('Customers').findOne({ _id: new ObjectId(req.params.id) });
    if (!data) return res.status(404).json({ error: 'Not found' });
    
    // Get customer's account to find username
    const account = await getCollection('Account').findOne({ customer_id: data.customer_id });
    const customerUsername = account ? account.username : null;
    
    // Delete all chat rooms and messages for this customer
    if (customerUsername) {
      // Find all chat rooms for this customer
      const chatRooms = await getCollection('chatrooms').find({ customer_username: customerUsername }).toArray();
      const roomIds = chatRooms.map(room => room.room_id);
      
      // Delete all messages in these rooms
      if (roomIds.length > 0) {
        await getCollection('messages').deleteMany({ room_id: { $in: roomIds } });
      }
      
      // Delete the chat rooms
      await getCollection('chatrooms').deleteMany({ customer_username: customerUsername });
    }
    
    // Delete the account
    await getCollection('Account').deleteOne({ customer_id: data.customer_id });
    
    // Delete the customer's address if they have one
    if (data.customer_address_id) {
      await getCollection('Adresses').deleteOne({ address_id: data.customer_address_id });
    }
    
    // Delete all payments for this customer
    await getCollection('customerpayments').deleteMany({ customer_id: data.customer_id });
    
    // Delete the customer record
    await getCollection('Customers').deleteOne({ _id: new ObjectId(req.params.id) });
    
    res.json({ message: 'Customer deleted successfully (including account, address, payments, and chat rooms)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


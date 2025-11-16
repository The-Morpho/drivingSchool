import { ObjectId } from 'mongodb';
import { getDB } from '../db.js';
import bcrypt from 'bcrypt';

const getCollection = (name) => getDB().collection(name);

export const getAll = async (req, res) => {
  try {
    const { role, username } = req.user;
    let data;

    if (role === 'admin' || role === 'manager') {
      // Admin and Manager see all staff
      data = await getCollection('Staff').find().toArray();
    } else if (role === 'instructor' || role === 'staff') {
      // Instructor sees only their own record
      const staffRecord = await getCollection('Staff').findOne({ nickname: username });
      data = staffRecord ? [staffRecord] : [];
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
    const data = await getCollection('Staff').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!data) return res.status(404).json({ error: 'Not found' });

    // Check permissions
    if ((role === 'instructor' || role === 'staff') && data.nickname !== username) {
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
      isActive = true,
      nickname,
      staff_address_id,
      role = 'Staff', // Can be 'Staff' or 'Manager'
      address, // Address object if provided
      ...staffData 
    } = req.body;

    // Validate required fields
    if (!email_address || !password || !nickname) {
      return res.status(400).json({ error: 'Email, password, and nickname are required' });
    }

    // Validate role
    if (!['Staff', 'Manager'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either Staff or Manager' });
    }

    // Check if nickname already exists
    const existingAccount = await getCollection('Account').findOne({ username: nickname });
    if (existingAccount) {
      return res.status(400).json({ error: 'Nickname already exists' });
    }

    let finalStaffAddressId = staff_address_id;

    // Create address if provided with minimum required fields
    if (address && address.line_1_number_building && address.city && address.zip_postcode) {
      try {
        const lastAddress = await getCollection('Addresses').findOne({}, { sort: { address_id: -1 } });
        const nextAddressId = lastAddress ? lastAddress.address_id + 1 : 1;
        
        const addressDoc = {
          address_id: nextAddressId,
          line_1_number_building: address.line_1_number_building.trim(),
          city: address.city.trim(),
          zip_postcode: address.zip_postcode.trim(),
          state_province_county: address.state_province_county?.trim() || '',
          country: address.country?.trim() || '',
        };
        
        await getCollection('Addresses').insertOne(addressDoc);
        finalStaffAddressId = nextAddressId;
        console.log('Address created with ID:', nextAddressId);
      } catch (addressError) {
        console.error('Error creating address:', addressError);
        // Continue without address if there's an error
      }
    }

    // Get the next staff_id
    const lastStaff = await getCollection('Staff').findOne({}, { sort: { staff_id: -1 } });
    const nextStaffId = lastStaff ? lastStaff.staff_id + 1 : 1;

    // Create Staff record with address reference
    const staffDoc = {
      staff_id: nextStaffId,
      nickname: nickname,
      email_address,
      staff_address_id: finalStaffAddressId,
      ...staffData
    };

    const staffResult = await getCollection('Staff').insertOne(staffDoc);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the next account_id
    const lastAccount = await getCollection('Account').findOne({}, { sort: { account_id: -1 } });
    const nextAccountId = lastAccount ? lastAccount.account_id + 1 : 1;

    // Create Account record using nickname as username with specified role
    const accountDoc = {
      account_id: nextAccountId,
      username: nickname,
      password: hashedPassword,
      role: role, // Use the provided role (Staff or Manager)
      staff_id: nextStaffId,
      is_active: isActive
    };

    await getCollection('Account').insertOne(accountDoc);

    res.status(201).json({
      message: 'Staff created successfully',
      staff: { _id: staffResult.insertedId, ...staffDoc },
      account: {
        account_id: accountDoc.account_id,
        username: accountDoc.username,
        role: accountDoc.role,
        is_active: accountDoc.is_active
      },
      address_created: !!finalStaffAddressId,
      address_id: finalStaffAddressId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { role, username } = req.user;
    const existing = await getCollection('Staff').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // Check permissions
    if ((role === 'instructor' || role === 'staff') && existing.nickname !== username) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { _id, ...updateData } = req.body;
    const result = await getCollection('Staff').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const delete_ = async (req, res) => {
  try {
    const data = await getCollection('Staff').findOne({ _id: new ObjectId(req.params.id) });
    if (!data) return res.status(404).json({ error: 'Not found' });
    
    // Get staff's account to find username
    const account = await getCollection('Account').findOne({ staff_id: data.staff_id });
    const staffUsername = account ? account.username : null;
    
    // Chat feature removed: skip chatroom/messages cleanup
    
    // Delete the account
    await getCollection('Account').deleteOne({ staff_id: data.staff_id });
    
    // Delete the staff's address if they have one
    if (data.staff_address_id) {
      await getCollection('Addresses').deleteOne({ address_id: data.staff_address_id });
    }
    
    // Delete the staff record
    await getCollection('Staff').deleteOne({ _id: new ObjectId(req.params.id) });
    
    res.json({ message: 'Staff deleted successfully (including account and address)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyCustomers = async (req, res) => {
  try {
    const { username } = req.user;
    
    // Find the staff member by username/nickname
    const staffRecord = await getCollection('Staff').findOne({ nickname: username });
    if (!staffRecord) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Get all lessons for this staff member to find their customers
    const lessons = await getCollection('Lessons').find({ 
      staff_id: staffRecord.staff_id 
    }).toArray();

    // Get unique customer IDs
    const customerIds = [...new Set(lessons.map(lesson => lesson.customer_id))];

    // Fetch customer details
    const customers = await getCollection('Customers').find({
      customer_id: { $in: customerIds }
    }).toArray();

    // Fetch customer account details for usernames
    const accounts = await getCollection('Account').find({
      customer_id: { $in: customerIds }
    }).toArray();

    res.json({
      staff_id: staffRecord.staff_id,
      total_customers: customers.length,
      customers: customers.map(customer => {
        // Find the account for this customer to get their username
        const account = accounts.find(acc => acc.customer_id === customer.customer_id);
        return {
          customer_id: customer.customer_id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          username: account ? account.username : customer.email_address,
          email_address: customer.email_address
        };
      })
    });
  } catch (error) {
    console.error('Error in getMyCustomers:', error);
    res.status(500).json({ error: error.message });
  }
};


import Staff from '../models/Staff.js';
import Account from '../models/Account.js';
import Address from '../models/Address.js';
import bcrypt from 'bcrypt';

export const getAll = async (req, res) => {
  try {
    const { role, username } = req.user;
    let data;

    if (role === 'admin' || role === 'manager') {
      // Admin and Manager see all staff
      data = await Staff.find();
    } else if (role === 'instructor' || role === 'staff') {
      // Instructor sees only their own record
      // For staff, username is their nickname
      const staffRecord = await Staff.findOne({ nickname: username });
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
    const data = await Staff.findById(req.params.id);
    
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
      ...staffData 
    } = req.body;

    // Validate required fields
    if (!email_address || !password || !nickname) {
      return res.status(400).json({ error: 'Email, password, and nickname are required' });
    }

    // Check if nickname already exists
    const existingAccount = await Account.findOne({ username: nickname });
    if (existingAccount) {
      return res.status(400).json({ error: 'Nickname already exists' });
    }

    // Get the next staff_id
    const lastStaff = await Staff.findOne().sort({ staff_id: -1 });
    const nextStaffId = lastStaff ? lastStaff.staff_id + 1 : 1;

    // Create Staff record with address reference
    const staff = await Staff.create({
      staff_id: nextStaffId,
      nickname: nickname,
      email_address,
      staff_address_id: staff_address_id || null,
      ...staffData
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the next account_id
    const lastAccount = await Account.findOne().sort({ account_id: -1 });
    const nextAccountId = lastAccount ? lastAccount.account_id + 1 : 1;

    // Create Account record using nickname as username
    const account = await Account.create({
      account_id: nextAccountId,
      username: nickname,
      password: hashedPassword,
      role: 'Staff',
      staff_id: staff.staff_id,
      is_active: isActive
    });

    res.status(201).json({
      message: 'Staff created successfully',
      staff: staff,
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
    const existing = await Staff.findById(req.params.id);
    
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // Check permissions
    if ((role === 'instructor' || role === 'staff') && existing.nickname !== username) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const data = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const delete_ = async (req, res) => {
  try {
    const data = await Staff.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    
    // Get staff's account to find username
    const account = await Account.findOne({ staff_id: data.staff_id });
    const staffUsername = account ? account.username : null;
    
    // Also delete all assignments for this staff member
    const StaffCustomerAssignment = (await import('../models/StaffCustomerAssignment.js')).default;
    await StaffCustomerAssignment.deleteMany({ staff_id: data.staff_id });
    
    // Delete all chat rooms and messages for this staff member
    if (staffUsername) {
      const ChatRoom = (await import('../models/ChatRoom.js')).default;
      const Message = (await import('../models/Message.js')).default;
      
      // Find all chat rooms for this staff member
      const chatRooms = await ChatRoom.find({ staff_username: staffUsername });
      const roomIds = chatRooms.map(room => room.room_id);
      
      // Delete all messages in these rooms
      if (roomIds.length > 0) {
        await Message.deleteMany({ room_id: { $in: roomIds } });
      }
      
      // Delete the chat rooms
      await ChatRoom.deleteMany({ staff_username: staffUsername });
    }
    
    // Also delete the account
    await Account.deleteOne({ staff_id: data.staff_id });
    
    // Delete the staff's address if they have one
    const Address = (await import('../models/Address.js')).default;
    if (data.staff_address_id) {
      await Address.deleteOne({ address_id: data.staff_address_id });
    }
    
    res.json({ message: 'Staff deleted successfully (including assignments, account, address, and chat rooms)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

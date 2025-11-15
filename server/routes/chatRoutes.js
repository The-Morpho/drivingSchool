import express from 'express';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import Account from '../models/Account.js';
import Staff from '../models/Staff.js';
import Customer from '../models/Customer.js';
import StaffCustomerAssignment from '../models/StaffCustomerAssignment.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all chat routes
router.use(authenticate);

/**
 * Chat Routes
 * REST API endpoints for chat functionality
 */

/**
 * GET /api/chat/rooms/all
 * Get all chat rooms (admin/manager only)
 */
router.get('/rooms/all', async (req, res) => {
  try {
    const userRole = req.user?.role || req.headers['x-user-role'];
    
    // Only allow admin/manager
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Access denied. Managers only.' });
    }

    // Get all chat rooms with staff and customer names
    const chatRooms = await ChatRoom.find({})
      .sort({ last_message_at: -1 });

    return res.json({
      rooms: chatRooms.map(r => ({
        room_id: r.room_id,
        staff_name: r.staff_name,
        customer_name: r.customer_name,
        staff_username: r.staff_username,
        customer_username: r.customer_username,
        last_message: r.last_message,
        last_message_at: r.last_message_at,
        created_at: r.created_at
      }))
    });
  } catch (error) {
    console.error('Get all chat rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

/**
 * GET /api/chat/rooms
 * Get all chat rooms for the authenticated user
 */
router.get('/rooms', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    // Find user account to determine role
    const account = await Account.findOne({ username });
    if (!account) {
      return res.status(404).json({ error: 'User not found' });
    }

    let chatRooms;

    if (account.role === 'Staff' || account.role === 'Instructor') {
      // Get all rooms for this staff member
      chatRooms = await ChatRoom.find({ staff_username: username })
        .sort({ last_message_at: -1 });

      return res.json({
        rooms: chatRooms.map(r => ({
          room_id: r.room_id,
          customer_name: r.customer_name,
          customer_username: r.customer_username,
          last_message: r.last_message,
          last_message_at: r.last_message_at,
          unread_count: r.unread_count_staff,
          created_at: r.created_at
        }))
      });
    } else if (account.role === 'Customer') {
      // Get room for this customer
      chatRooms = await ChatRoom.find({ customer_username: username })
        .sort({ last_message_at: -1 });

      return res.json({
        rooms: chatRooms.map(r => ({
          room_id: r.room_id,
          staff_name: r.staff_name,
          staff_username: r.staff_username,
          last_message: r.last_message,
          last_message_at: r.last_message_at,
          unread_count: r.unread_count_customer,
          created_at: r.created_at
        }))
      });
    }

    res.json({ rooms: [] });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

/**
 * GET /api/chat/:room_id/messages
 * Get chat history for a specific room
 */
router.get('/:room_id/messages', async (req, res) => {
  try {
    const { room_id } = req.params;
    const { username, limit = 50, skip = 0 } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    // Verify room exists and user has access
    const chatRoom = await ChatRoom.findOne({ room_id });
    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Get user role
    const userRole = req.user?.role || req.headers['x-user-role'];
    
    // Managers/admins can view any conversation
    const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager';
    
    // Verify user belongs to this room or is a manager
    const hasAccess = 
      isManagerOrAdmin ||
      chatRoom.staff_username === username || 
      chatRoom.customer_username === username;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this chat room' });
    }

    // Fetch messages with pagination
    const messages = await Message.find({ room_id })
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Return messages in chronological order (oldest first)
    res.json({
      room_id,
      messages: messages.reverse(),
      has_more: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/chat/rooms/create-or-get
 * Create a new chat room or get existing one
 * This is called when staff/customer want to start a conversation
 */
router.post('/rooms/create-or-get', async (req, res) => {
  try {
    const { staff_username, customer_username } = req.body;

    if (!staff_username || !customer_username) {
      return res.status(400).json({ error: 'Staff and customer usernames required' });
    }

    // Check if room already exists
    const room_id = `${staff_username}_${customer_username}`;
    let chatRoom = await ChatRoom.findOne({ room_id });

    if (chatRoom) {
      return res.json({ room: chatRoom, created: false });
    }

    // Get staff and customer details
    const staffAccount = await Account.findOne({ username: staff_username });
    const customerAccount = await Account.findOne({ username: customer_username });

    if (!staffAccount || !customerAccount) {
      return res.status(404).json({ error: 'Staff or customer not found' });
    }

    const staff = await Staff.findOne({ staff_id: staffAccount.staff_id });
    const customer = await Customer.findOne({ customer_id: customerAccount.customer_id });

    if (!staff || !customer) {
      return res.status(404).json({ error: 'Staff or customer details not found' });
    }

    // Create new chat room
    chatRoom = new ChatRoom({
      room_id,
      staff_id: staff.staff_id,
      customer_id: customer.customer_id,
      staff_username,
      customer_username,
      staff_name: `${staff.first_name} ${staff.last_name}`,
      customer_name: `${customer.first_name} ${customer.last_name}`
    });

    await chatRoom.save();

    res.json({ room: chatRoom, created: true });
  } catch (error) {
    console.error('Create chat room error:', error);
    res.status(500).json({ error: 'Failed to create chat room' });
  }
});

/**
 * POST /api/chat/rooms/sync-assignments
 * Synchronize chat rooms with staff-customer assignments
 * Creates chat rooms for all existing assignments
 */
router.post('/rooms/sync-assignments', async (req, res) => {
  try {
    // Get all staff-customer assignments
    const assignments = await StaffCustomerAssignment.find({});

    let created = 0;
    let existing = 0;

    for (const assignment of assignments) {
      // Get staff and customer accounts
      const staffAccount = await Account.findOne({ staff_id: assignment.staff_id });
      const customerAccount = await Account.findOne({ customer_id: assignment.customer_id });

      if (!staffAccount || !customerAccount) continue;

      const room_id = `${staffAccount.username}_${customerAccount.username}`;

      // Check if room already exists
      const existingRoom = await ChatRoom.findOne({ room_id });
      if (existingRoom) {
        existing++;
        continue;
      }

      // Get staff and customer details
      const staff = await Staff.findOne({ staff_id: assignment.staff_id });
      const customer = await Customer.findOne({ customer_id: assignment.customer_id });

      if (!staff || !customer) continue;

      // Create chat room
      const chatRoom = new ChatRoom({
        room_id,
        staff_id: staff.staff_id,
        customer_id: customer.customer_id,
        staff_username: staffAccount.username,
        customer_username: customerAccount.username,
        staff_name: `${staff.first_name} ${staff.last_name}`,
        customer_name: `${customer.first_name} ${customer.last_name}`
      });

      await chatRoom.save();
      created++;
    }

    res.json({
      message: 'Chat rooms synchronized with assignments',
      created,
      existing,
      total: assignments.length
    });
  } catch (error) {
    console.error('Sync assignments error:', error);
    res.status(500).json({ error: 'Failed to sync chat rooms' });
  }
});

/**
 * DELETE /api/chat/:room_id
 * Delete a chat room and all its messages
 * (Admin/Manager only)
 */
router.delete('/:room_id', async (req, res) => {
  try {
    const { room_id } = req.params;
    const userRole = req.user?.role || req.headers['x-user-role'];
    
    // Only allow admin/manager to delete chat rooms
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Access denied. Only managers can delete chat rooms.' });
    }

    // Verify room exists
    const chatRoom = await ChatRoom.findOne({ room_id });
    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Delete all messages in the room
    const messagesDeleted = await Message.deleteMany({ room_id });

    // Delete the chat room
    await ChatRoom.deleteOne({ room_id });

    res.json({ 
      message: 'Chat room deleted successfully', 
      room_id,
      messages_deleted: messagesDeleted.deletedCount,
      staff_name: chatRoom.staff_name,
      customer_name: chatRoom.customer_name
    });
  } catch (error) {
    console.error('Delete chat room error:', error);
    res.status(500).json({ error: 'Failed to delete chat room' });
  }
});

export default router;

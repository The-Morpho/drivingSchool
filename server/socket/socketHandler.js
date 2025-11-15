import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import Account from '../models/Account.js';
import Staff from '../models/Staff.js';
import Customer from '../models/Customer.js';

/**
 * Socket.io Handler with Redis Pub/Sub
 * Manages real-time chat connections and message synchronization
 */

let io;
let pubClient;
let subClient;

/**
 * Initialize Socket.io server with Redis adapter
 * @param {Object} httpServer - HTTP server instance
 */
export const initializeSocket = async (httpServer) => {
  // Create Socket.io server with CORS configuration
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server and production
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  try {
    // Create Redis clients for Pub/Sub
    pubClient = createClient({ 
      url: 'redis://localhost:6379',
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: false // Don't keep trying to reconnect
      }
    });
    subClient = pubClient.duplicate();

    // Suppress error logging - we'll handle it in the catch block
    pubClient.on('error', () => {});
    subClient.on('error', () => {});

    // Connect Redis clients with timeout
    await Promise.race([
      Promise.all([pubClient.connect(), subClient.connect()]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 3000)
      )
    ]);

    // Attach Redis adapter to Socket.io for multi-instance scalability
    io.adapter(createAdapter(pubClient, subClient));

    console.log('✅ Socket.io initialized with Redis adapter');
  } catch (error) {
    // Clean up failed connections
    try {
      if (pubClient) await pubClient.quit().catch(() => {});
      if (subClient) await subClient.quit().catch(() => {});
    } catch (e) {}
    
    pubClient = null;
    subClient = null;
    
    console.log('⚠️  Redis not available - running in single-server mode');
    console.log('   Chat will work but won\'t scale across multiple instances');
    console.log('   To enable Redis: Install and run "redis-server"');
  }

  // Socket.io connection handler
  io.on('connection', async (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    /**
     * Authentication and Room Joining
     * Client must send 'authenticate' event with username and role
     */
    socket.on('authenticate', async ({ username, role }) => {
      try {
        socket.username = username;
        socket.role = role;

        console.log(`👤 User authenticated: ${username} (${role})`);

        // Join appropriate chat rooms based on role (case-insensitive)
        const roleLower = role.toLowerCase();
        if (roleLower === 'staff' || roleLower === 'instructor') {
          await joinStaffRooms(socket, username);
        } else if (roleLower === 'customer') {
          await joinCustomerRooms(socket, username);
        }

        // Notify client of successful authentication
        socket.emit('authenticated', { success: true, username, role });
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('authenticated', { success: false, error: error.message });
      }
    });

    /**
     * Send Message Handler
     * Receives message from client, stores in DB, and publishes to Redis
     */
    socket.on('send_message', async (data) => {
      try {
        const { room_id, message } = data;

        console.log(`📨 Received message: room=${room_id}, user=${socket.username}, role=${socket.role}`);

        if (!socket.username || !socket.role) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Verify room exists and user has access
        const chatRoom = await ChatRoom.findOne({ room_id });
        if (!chatRoom) {
          console.error(`❌ Chat room not found: ${room_id}`);
          socket.emit('error', { message: 'Chat room not found' });
          return;
        }

        console.log(`✅ Chat room found: ${room_id}`);

        // Verify user belongs to this room
        const hasAccess = 
          chatRoom.staff_username === socket.username || 
          chatRoom.customer_username === socket.username;

        if (!hasAccess) {
          console.error(`❌ Access denied for ${socket.username} to room ${room_id}`);
          socket.emit('error', { message: 'Access denied to this chat room' });
          return;
        }

        console.log(`✅ Access granted for ${socket.username}`);

        // Get sender name and determine if staff (case-insensitive role check)
        const roleLower = socket.role.toLowerCase();
        const senderName = roleLower === 'customer' 
          ? chatRoom.customer_name 
          : chatRoom.staff_name;
        const isStaffSender = roleLower === 'staff' || roleLower === 'instructor';

        console.log(`📝 Creating message: sender=${senderName}, role=${socket.role}`);

        // Create and save message to MongoDB
        const newMessage = new Message({
          room_id,
          sender_username: socket.username,
          sender_name: senderName,
          sender_role: socket.role,
          message: message.trim(),
          created_at: new Date()
        });

        await newMessage.save();
        console.log(`✅ Message saved to MongoDB: ${newMessage._id}`);

        // Update chat room with last message info
        chatRoom.last_message = message.trim();
        chatRoom.last_message_at = new Date();
        
        // Increment unread count for recipient
        if (isStaffSender) {
          chatRoom.unread_count_customer += 1;
        } else {
          chatRoom.unread_count_staff += 1;
        }
        
        await chatRoom.save();
        console.log(`✅ Chat room updated`);

        // Prepare message object for broadcasting
        const messageData = {
          _id: newMessage._id,
          room_id,
          sender_username: socket.username,
          sender_name: senderName,
          sender_role: socket.role,
          message: message.trim(),
          created_at: newMessage.created_at
        };

        // Publish message to Redis Pub/Sub for multi-instance synchronization
        if (pubClient && pubClient.isOpen) {
          try {
            await pubClient.publish(`chat:${room_id}`, JSON.stringify(messageData));
          } catch (err) {
            // Redis publish failed, but continue - message will still be sent via Socket.io
          }
        }

        // Emit message to all clients in the room (including sender)
        io.to(room_id).emit('new_message', messageData);

        console.log(`💬 Message sent in room ${room_id} by ${socket.username}`);
      } catch (error) {
        console.error('❌ Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Mark Messages as Read
     * Updates unread count when user views a chat room
     */
    socket.on('mark_read', async ({ room_id }) => {
      try {
        if (!socket.username || !socket.role) return;

        const chatRoom = await ChatRoom.findOne({ room_id });
        if (!chatRoom) return;

        // Reset unread count for the current user (case-insensitive role check)
        const roleLower = socket.role.toLowerCase();
        if (roleLower === 'staff' || roleLower === 'instructor') {
          chatRoom.unread_count_staff = 0;
        } else if (roleLower === 'customer') {
          chatRoom.unread_count_customer = 0;
        }

        await chatRoom.save();

        // Mark all messages in this room as read for this user
        await Message.updateMany(
          { 
            room_id, 
            sender_username: { $ne: socket.username },
            is_read: false
          },
          { is_read: true }
        );

        console.log(`✓ Messages marked as read in room ${room_id} by ${socket.username}`);
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    /**
     * Typing Indicator
     * Broadcasts typing status to other users in the room
     */
    socket.on('typing', ({ room_id, isTyping }) => {
      socket.to(room_id).emit('user_typing', {
        username: socket.username,
        isTyping
      });
    });

    /**
     * Disconnect Handler
     */
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id} (${socket.username || 'unknown'})`);
    });
  });

  // Subscribe to Redis Pub/Sub for message synchronization across instances
  if (subClient && subClient.isOpen) {
    try {
      setupRedisSubscriptions();
    } catch (err) {
      console.warn('Redis subscription setup failed, continuing without it');
    }
  }

  return io;
};

/**
 * Join all chat rooms for a staff member
 * @param {Object} socket - Socket instance
 * @param {String} username - Staff username
 */
async function joinStaffRooms(socket, username) {
  try {
    // Find all chat rooms where this staff member is assigned
    const chatRooms = await ChatRoom.find({ staff_username: username });

    // Join each room
    for (const room of chatRooms) {
      socket.join(room.room_id);
      console.log(`  📁 Staff ${username} joined room: ${room.room_id}`);
    }

    // Send list of rooms to client
    socket.emit('rooms_joined', {
      rooms: chatRooms.map(r => ({
        room_id: r.room_id,
        customer_name: r.customer_name,
        customer_username: r.customer_username,
        last_message: r.last_message,
        last_message_at: r.last_message_at,
        unread_count: r.unread_count_staff
      }))
    });
  } catch (error) {
    console.error('Error joining staff rooms:', error);
  }
}

/**
 * Join chat room for a customer
 * @param {Object} socket - Socket instance
 * @param {String} username - Customer username
 */
async function joinCustomerRooms(socket, username) {
  try {
    // Find the chat room for this customer
    const chatRooms = await ChatRoom.find({ customer_username: username });

    // Join each room (typically just one for customers)
    for (const room of chatRooms) {
      socket.join(room.room_id);
      console.log(`  📁 Customer ${username} joined room: ${room.room_id}`);
    }

    // Send list of rooms to client
    socket.emit('rooms_joined', {
      rooms: chatRooms.map(r => ({
        room_id: r.room_id,
        staff_name: r.staff_name,
        staff_username: r.staff_username,
        last_message: r.last_message,
        last_message_at: r.last_message_at,
        unread_count: r.unread_count_customer
      }))
    });
  } catch (error) {
    console.error('Error joining customer rooms:', error);
  }
}

/**
 * Setup Redis Pub/Sub subscriptions for message synchronization
 * This allows multiple server instances to share real-time messages
 */
function setupRedisSubscriptions() {
  // Subscribe to all chat channels
  subClient.pSubscribe('chat:*', (message, channel) => {
    try {
      const messageData = JSON.parse(message);
      const room_id = channel.split(':')[1];

      // Emit message to all clients in the room
      io.to(room_id).emit('new_message', messageData);
    } catch (error) {
      console.error('Redis message processing error:', error);
    }
  });

  console.log('✅ Redis Pub/Sub subscriptions active');
}

/**
 * Get Socket.io instance
 * @returns {Object} Socket.io server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Cleanup function for graceful shutdown
 */
export const closeSocket = async () => {
  try {
    if (pubClient && pubClient.isOpen) await pubClient.quit();
    if (subClient && subClient.isOpen) await subClient.quit();
  } catch (err) {
    // Ignore cleanup errors
  }
  if (io) io.close();
  console.log('Socket.io connections closed');
};

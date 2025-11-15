import mongoose from 'mongoose';

/**
 * Message Schema
 * Stores individual chat messages within a chat room
 */
const messageSchema = new mongoose.Schema({
  room_id: {
    type: String,
    required: true,
    index: true,
    ref: 'ChatRoom'
  },
  sender_username: {
    type: String,
    required: true
  },
  sender_name: {
    type: String,
    required: true
  },
  sender_role: {
    type: String,
    required: true,
    enum: ['Staff', 'Customer', 'Instructor', 'staff', 'customer', 'instructor', 'admin', 'manager']
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  is_read: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient message retrieval
messageSchema.index({ room_id: 1, created_at: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

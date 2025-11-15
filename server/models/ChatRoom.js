import mongoose from 'mongoose';

/**
 * ChatRoom Schema
 * Represents a one-to-one chat room between a staff member and a customer
 */
const chatRoomSchema = new mongoose.Schema({
  room_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  staff_id: {
    type: Number,
    required: true,
    ref: 'Staff'
  },
  customer_id: {
    type: Number,
    required: true,
    ref: 'Customer'
  },
  staff_username: {
    type: String,
    required: true
  },
  customer_username: {
    type: String,
    required: true
  },
  staff_name: {
    type: String,
    required: true
  },
  customer_name: {
    type: String,
    required: true
  },
  last_message: {
    type: String,
    default: ''
  },
  last_message_at: {
    type: Date,
    default: null
  },
  unread_count_staff: {
    type: Number,
    default: 0
  },
  unread_count_customer: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Index for efficient querying
chatRoomSchema.index({ staff_id: 1, customer_id: 1 });
chatRoomSchema.index({ staff_username: 1 });
chatRoomSchema.index({ customer_username: 1 });

// Virtual populate for staff
chatRoomSchema.virtual('staff', {
  ref: 'Staff',
  localField: 'staff_id',
  foreignField: 'staff_id',
  justOne: true
});

// Virtual populate for customer
chatRoomSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customer_id',
  foreignField: 'customer_id',
  justOne: true
});

// Virtual populate for messages
chatRoomSchema.virtual('messages', {
  ref: 'Message',
  localField: 'room_id',
  foreignField: 'room_id'
});

// Update the updated_at timestamp before saving
chatRoomSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

export default ChatRoom;

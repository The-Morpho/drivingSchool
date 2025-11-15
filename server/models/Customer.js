import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  customer_id: { type: Number, unique: true, required: true },
  customer_address_id: Number,
  customer_status_code: String,
  date_became_customer: String,
  date_of_birth: String,
  first_name: String,
  last_name: String,
  amount_outstanding: Number,
  email_address: String,
  phone_number: String,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual populate for address
customerSchema.virtual('address', {
  ref: 'Address',
  localField: 'customer_address_id',
  foreignField: 'address_id',
  justOne: true
});

// Virtual populate for account
customerSchema.virtual('account', {
  ref: 'Account',
  localField: 'customer_id',
  foreignField: 'customer_id',
  justOne: true
});

// Virtual populate for lessons
customerSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: 'customer_id',
  foreignField: 'customer_id'
});

// Virtual populate for payments
customerSchema.virtual('payments', {
  ref: 'CustomerPayment',
  localField: 'customer_id',
  foreignField: 'customer_id'
});

// Virtual populate for chat rooms
customerSchema.virtual('chatRooms', {
  ref: 'ChatRoom',
  localField: 'customer_id',
  foreignField: 'customer_id'
});

export default mongoose.model('Customer', customerSchema, 'Customers');

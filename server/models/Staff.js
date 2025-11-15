import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  staff_id: { type: Number, unique: true, required: true },
  staff_address_id: Number,
  nickname: String,
  first_name: String,
  last_name: String,
  date_of_birth: String,
  date_joined_staff: String,
  date_left_staff: String,
  email_address: String,
  phone_number: String,
  position_title: String,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual populate for address
staffSchema.virtual('address', {
  ref: 'Address',
  localField: 'staff_address_id',
  foreignField: 'address_id',
  justOne: true
});

// Virtual populate for account
staffSchema.virtual('account', {
  ref: 'Account',
  localField: 'staff_id',
  foreignField: 'staff_id',
  justOne: true
});

export default mongoose.model('Staff', staffSchema, 'Staff');

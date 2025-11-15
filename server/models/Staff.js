import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  staff_id: { type: Number, unique: true, required: true },
  staff_address_id: Number,
  nickname: String,
  first_name: String,
  middle_name: String,
  last_name: String,
  date_of_birth: String,
  date_joined_staff: String,
  date_left_staff: String,
  email_address: String,
  phone_number: String,
}, { timestamps: true });

export default mongoose.model('Staff', staffSchema, 'Staff');

import mongoose from 'mongoose';

const managerSchema = new mongoose.Schema({
  manager_id: { type: Number, unique: true, required: true },
  first_name: String,
  last_name: String,
  email_address: String,
  phone_number: String,
  date_hired: String,
  address_id: Number, // Reference to Addresses collection
}, { timestamps: true });

export default mongoose.model('Manager', managerSchema, 'Manager');

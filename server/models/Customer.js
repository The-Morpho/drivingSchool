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
  cell_mobile_phone_number: String,
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema, 'Customers');

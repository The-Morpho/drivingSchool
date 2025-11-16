import mongoose from 'mongoose';

// Align Account with schema: use numeric foreign keys to Staff/Customer
const accountSchema = new mongoose.Schema({
  account_id: { type: Number, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Manager', 'Staff', 'Customer'], required: true },

  // Numeric foreign keys (match Staff.staff_id, Customer.customer_id)
  staff_id: { type: Number, index: true, sparse: true },
  customer_id: { type: Number, index: true, sparse: true },

  is_active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Account', accountSchema, 'Account');

import mongoose from 'mongoose';

// Account can reference Staff/Customer by numeric IDs or by ObjectId
const accountSchema = new mongoose.Schema({
  account_id: { type: Number, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Manager', 'Staff', 'Customer'], required: true },

  // Allow either Number (legacy) or ObjectId (preferred) for references
  staff_id: { type: mongoose.Schema.Types.Mixed, index: true, sparse: true },
  customer_id: { type: mongoose.Schema.Types.Mixed, index: true, sparse: true },

  is_active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Account', accountSchema, 'Account');

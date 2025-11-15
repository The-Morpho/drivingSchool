import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  account_id: { type: Number, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // Hashed with bcrypt
  role: { type: String, enum: ['Manager', 'Staff', 'Customer'], required: true },
  
  // Reference fields - only one should be populated based on role
  manager_id: { type: Number, sparse: true },
  staff_id: { type: Number, sparse: true },
  customer_id: { type: Number, sparse: true },
  
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

// Ensure only one reference field is set based on role
accountSchema.pre('save', function(next) {
  const referenceCount = [this.manager_id, this.staff_id, this.customer_id]
    .filter(id => id !== null && id !== undefined).length;
  
  if (referenceCount !== 1) {
    return next(new Error('Account must have exactly one reference (manager_id, staff_id, or customer_id)'));
  }
  
  // Validate role matches reference
  if (this.role === 'Manager' && !this.manager_id) {
    return next(new Error('Manager role must have manager_id'));
  }
  if (this.role === 'Staff' && !this.staff_id) {
    return next(new Error('Staff role must have staff_id'));
  }
  if (this.role === 'Customer' && !this.customer_id) {
    return next(new Error('Customer role must have customer_id'));
  }
  
  next();
});

export default mongoose.model('Account', accountSchema, 'Account');

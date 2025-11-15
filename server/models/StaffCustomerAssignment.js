import mongoose from 'mongoose';

const staffCustomerAssignmentSchema = new mongoose.Schema({
  assignment_id: { type: Number, unique: true, required: true },
  staff_id: { type: Number, required: true },
  customer_id: { type: Number, required: true },
  assigned_date: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true },
  notes: String
}, { timestamps: true });

export default mongoose.model('StaffCustomerAssignment', staffCustomerAssignmentSchema, 'StaffCustomerAssignments');

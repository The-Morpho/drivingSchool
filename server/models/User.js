import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: String,
  role: { type: String, enum: ['admin', 'manager', 'instructor', 'customer', 'staff', 'student'] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('User', userSchema);

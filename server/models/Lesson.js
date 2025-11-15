import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  lesson_id: { type: Number, unique: true, required: true },
  assignment_id: Number, // Link to StaffCustomerAssignment
  customer_id: Number,
  staff_id: Number,
  vehicle_id: Number,
  lesson_date: String,
  lesson_duration: String,
  lesson_status: String,
  lesson_status_code: String,
  lesson_time: String,
  price: Number,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual populate for customer
lessonSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customer_id',
  foreignField: 'customer_id',
  justOne: true
});

// Virtual populate for staff
lessonSchema.virtual('staff', {
  ref: 'Staff',
  localField: 'staff_id',
  foreignField: 'staff_id',
  justOne: true
});

// Virtual populate for vehicle
lessonSchema.virtual('vehicle', {
  ref: 'Vehicle',
  localField: 'vehicle_id',
  foreignField: 'vehicle_id',
  justOne: true
});

export default mongoose.model('Lesson', lessonSchema, 'Lessons');

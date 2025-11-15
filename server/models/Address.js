import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  address_id: { 
  type: Number, unique: true, required: true },
  line_1_number_building: String,
  city: String,
  zip_postcode: String,
  state_province_county: String,
  country: String,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual populate for customers
addressSchema.virtual('customers', {
  ref: 'Customer',
  localField: 'address_id',
  foreignField: 'customer_address_id'
});

// Virtual populate for staff
addressSchema.virtual('staff', {
  ref: 'Staff',
  localField: 'address_id',
  foreignField: 'staff_address_id'
});

// Use the correctly spelled collection name 'Addresses'
export default mongoose.model('Address', addressSchema, 'Addresses');

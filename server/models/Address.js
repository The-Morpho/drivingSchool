import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  address_id: { type: Number, unique: true, required: true },
  line_1_number_building: String,
  city: String,
  zip_postcode: String,
  state_province_county: String,
  country: String,
}, { timestamps: true });

export default mongoose.model('Address', addressSchema, 'Adresses');

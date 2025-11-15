import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicle_id: { type: Number, unique: true, required: true },
  vehicle_name: { type: String, required: true },
  vehicle_model: { type: String, required: true },
  vehicle_details: String,
  date_added: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Vehicle', vehicleSchema, 'Vehicles');

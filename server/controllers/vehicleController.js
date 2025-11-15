import Vehicle from '../models/Vehicle.js';

export const getAll = async (req, res) => {
  try {
    const data = await Vehicle.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await Vehicle.findById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const { vehicle_name, vehicle_model, vehicle_details } = req.body;

    // Validate required fields
    if (!vehicle_name || !vehicle_model) {
      return res.status(400).json({ error: 'Vehicle name and model are required' });
    }

    // Get the next vehicle_id
    const lastVehicle = await Vehicle.findOne().sort({ vehicle_id: -1 });
    const nextVehicleId = lastVehicle ? lastVehicle.vehicle_id + 1 : 1;

    // Create Vehicle record with auto-generated ID and current date
    const vehicle = await Vehicle.create({
      vehicle_id: nextVehicleId,
      vehicle_name,
      vehicle_model,
      vehicle_details: vehicle_details || '',
      date_added: new Date(),
    });

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle: vehicle,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const delete_ = async (req, res) => {
  try {
    const data = await Vehicle.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

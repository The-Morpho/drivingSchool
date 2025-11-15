import { ObjectId } from 'mongodb';
import { getDB } from '../db.js';

const getCollection = () => getDB().collection('Vehicles');

export const getAll = async (req, res) => {
  try {
    const data = await getCollection().find().toArray();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await getCollection().findOne({ _id: new ObjectId(req.params.id) });
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
    const lastVehicle = await getCollection().findOne({}, { sort: { vehicle_id: -1 } });
    const nextVehicleId = lastVehicle ? lastVehicle.vehicle_id + 1 : 1;

    // Create Vehicle record with auto-generated ID and current date
    const vehicleDoc = {
      vehicle_id: nextVehicleId,
      vehicle_name,
      vehicle_model,
      vehicle_details: vehicle_details || '',
      date_added: new Date(),
    };

    const result = await getCollection().insertOne(vehicleDoc);

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle: { _id: result.insertedId, ...vehicleDoc },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    const result = await getCollection().findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const delete_ = async (req, res) => {
  try {
    const result = await getCollection().deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

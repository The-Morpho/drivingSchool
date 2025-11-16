import { ObjectId } from 'mongodb';

import { getDB } from '../db.js';

const getCollection = () => getDB().collection('Addresses');

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
    const { line_1_number_building, city, zip_postcode, state_province_county, country } = req.body;

    // Validate required fields
    if (!line_1_number_building || !city || !zip_postcode) {
      return res.status(400).json({ error: 'Address line, city, and zip code are required' });
    }

    // Check if exact same address already exists (to prevent duplicates)
    const existingAddress = await getCollection().findOne({
      line_1_number_building,
      city,
      zip_postcode,
      state_province_county: state_province_county || '',
      country: country || '',
    });

    // If address exists, return it instead of creating a duplicate
    if (existingAddress) {
      return res.status(200).json({
        message: 'Address already exists',
        address_id: existingAddress.address_id,
        data: existingAddress,
      });
    }

    // Get the next address_id
    const lastAddress = await getCollection().findOne({}, { sort: { address_id: -1 } });
    const nextAddressId = lastAddress ? lastAddress.address_id + 1 : 1;

    // Create address with auto-generated address_id
    const addressDoc = {
      address_id: nextAddressId,
      line_1_number_building,
      city,
      zip_postcode,
      state_province_county: state_province_county || '',
      country: country || '',
    };

    const result = await getCollection().insertOne(addressDoc);

    res.status(201).json({
      message: 'Address created successfully',
      address_id: nextAddressId,
      data: { _id: result.insertedId, ...addressDoc },
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
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

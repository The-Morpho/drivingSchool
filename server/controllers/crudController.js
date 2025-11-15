import { ObjectId } from 'mongodb';
import { getDB } from '../db.js';

export const getAll = (collectionName) => async (req, res) => {
  try {
    const data = await getDB().collection(collectionName).find().toArray();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getById = (collectionName) => async (req, res) => {
  try {
    const data = await getDB().collection(collectionName).findOne({ _id: new ObjectId(req.params.id) });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = (collectionName) => async (req, res) => {
  try {
    const result = await getDB().collection(collectionName).insertOne(req.body);
    res.status(201).json({ _id: result.insertedId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = (collectionName) => async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;
    
    const result = await getDB().collection(collectionName).findOneAndUpdate(
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

export const delete_ = (collectionName) => async (req, res) => {
  try {
    const result = await getDB().collection(collectionName).deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

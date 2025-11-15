import { ObjectId } from 'mongodb';
import { getDB } from '../db.js';

const getCollection = (name) => getDB().collection(name);

export const getAll = async (req, res) => {
  try {
    const { role, username } = req.user;
    let query = {};

    if (role === 'customer') {
      // Customer sees only their own payments
      const account = await getCollection('Account').findOne({ username, role: 'Customer' });
      if (!account || !account.customer_id) {
        return res.json([]);
      }
      query.customer_id = account.customer_id;
    } else if (role === 'instructor' || role === 'staff') {
      // Instructor sees payments for their students only
      const staffRecord = await getCollection('Staff').findOne({ nickname: username });
      if (!staffRecord) {
        return res.json([]);
      }
      
      // Get customer IDs from lessons taught by this instructor
      const lessons = await getCollection('Lessons').find({ staff_id: staffRecord.staff_id }).toArray();
      const customerIds = [...new Set(lessons.map(l => l.customer_id))];
      query.customer_id = { $in: customerIds };
    }
    // Admin and Manager see all payments (no filter)

    // Use aggregation to populate customer data
    const data = await getCollection('Customer_Payments').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'Customers',
          localField: 'customer_id',
          foreignField: 'customer_id',
          as: 'customer'
        }
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'customer.password': 0,
          'customer.customer_address_id': 0
        }
      }
    ]).toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await getCollection('Customer_Payments').aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: 'Customers',
          localField: 'customer_id',
          foreignField: 'customer_id',
          as: 'customer'
        }
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'customer.password': 0,
          'customer.customer_address_id': 0
        }
      }
    ]).toArray();

    if (!data || data.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const result = await getCollection('Customer_Payments').insertOne(req.body);
    
    // Update customer's amount_outstanding by subtracting the payment amount
    if (req.body.amount_payment && req.body.customer_id) {
      await getCollection('Customers').updateOne(
        { customer_id: req.body.customer_id },
        { $inc: { amount_outstanding: -req.body.amount_payment } }
      );
    }
    
    // Fetch the created document with populated customer data
    const populated = await getCollection('Customer_Payments').aggregate([
      { $match: { _id: result.insertedId } },
      {
        $lookup: {
          from: 'Customers',
          localField: 'customer_id',
          foreignField: 'customer_id',
          as: 'customer'
        }
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } }
    ]).toArray();

    res.status(201).json(populated[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;
    
    const result = await getCollection('Customer_Payments').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ error: 'Not found' });

    // Populate customer data
    const customer = await getCollection('Customers').findOne({ customer_id: result.customer_id });
    res.json({ ...result, customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const delete_ = async (req, res) => {
  try {
    // Get the payment first to retrieve amount and customer_id
    const payment = await getCollection('Customer_Payments').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!payment) return res.status(404).json({ error: 'Not found' });
    
    const result = await getCollection('Customer_Payments').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    
    // Update customer's amount_outstanding by adding back the payment amount
    if (payment.amount_payment && payment.customer_id) {
      await getCollection('Customers').updateOne(
        { customer_id: payment.customer_id },
        { $inc: { amount_outstanding: payment.amount_payment } }
      );
    }
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


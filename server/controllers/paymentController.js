import CustomerPayment from '../models/CustomerPayment.js';
import Customer from '../models/Customer.js';
import Staff from '../models/Staff.js';
import Lesson from '../models/Lesson.js';
import Account from '../models/Account.js';

export const getAll = async (req, res) => {
  try {
    const { role, username } = req.user;
    let query = {};

    if (role === 'customer') {
      // Customer sees only their own payments
      // Look up customer by Account username, not email_address
      const account = await Account.findOne({ username, role: 'Customer' });
      if (!account || !account.customer_id) {
        return res.json([]);
      }
      query.customer_id = account.customer_id;
    } else if (role === 'instructor' || role === 'staff') {
      // Instructor sees payments for their students only
      // For staff, username is their nickname
      const staffRecord = await Staff.findOne({ nickname: username });
      if (!staffRecord) {
        return res.json([]);
      }
      
      // Get customer IDs from lessons taught by this instructor
      const lessons = await Lesson.find({ staff_id: staffRecord.staff_id });
      const customerIds = [...new Set(lessons.map(l => l.customer_id))];
      query.customer_id = { $in: customerIds };
    }
    // Admin and Manager see all payments (no filter)

    const data = await CustomerPayment.find(query)
      .populate('customer', 'first_name last_name email_address phone_number');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const data = await CustomerPayment.findById(req.params.id)
      .populate('customer', 'first_name last_name email_address phone_number');
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = await CustomerPayment.create(req.body);
    // Populate after creation
    const populated = await CustomerPayment.findById(data._id)
      .populate('customer', 'first_name last_name email_address phone_number');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await CustomerPayment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('customer', 'first_name last_name email_address phone_number');
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const delete_ = async (req, res) => {
  try {
    const data = await CustomerPayment.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

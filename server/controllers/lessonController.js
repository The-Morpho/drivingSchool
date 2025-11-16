import { ObjectId } from 'mongodb';
import { getDB } from '../db.js';
import ChatRoom from '../models/ChatRoom.js';
import Account from '../models/Account.js';
import Staff from '../models/Staff.js';
import Customer from '../models/Customer.js';

const getCollection = (name) => getDB().collection(name);

export const getAll = async (req, res) => {
  try {
    const { role, username } = req.user;
    let query = {};

    if (role === 'customer') {
      // Customer sees only their own lessons
      const account = await getCollection('Account').findOne({ username, role: 'Customer' });
      if (!account || !account.customer_id) {
        return res.json([]);
      }
      query.customer_id = account.customer_id;
    } else if (role === 'instructor' || role === 'staff') {
      // Instructor/Staff sees only lessons they teach
      const staffRecord = await getCollection('Staff').findOne({ nickname: username });
      if (!staffRecord) {
        return res.json([]);
      }
      query.staff_id = staffRecord.staff_id;
    }
    // Admin and Manager see all lessons (no filter)

    const data = await getCollection('Lessons').find(query).toArray();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const { role, username } = req.user;
    const data = await getCollection('Lessons').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!data) return res.status(404).json({ error: 'Not found' });

    // Check permissions
    if (role === 'customer') {
      const account = await getCollection('Account').findOne({ username, role: 'Customer' });
      if (!account || data.customer_id !== account.customer_id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (role === 'instructor' || role === 'staff') {
      const staffRecord = await getCollection('Staff').findOne({ nickname: username });
      if (!staffRecord || data.staff_id !== staffRecord.staff_id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    // Ensure a numeric lesson_id is assigned to avoid duplicate null keys
    const lastLesson = await getCollection('Lessons').findOne({}, { sort: { lesson_id: -1 } });
    const nextLessonId = lastLesson && lastLesson.lesson_id ? lastLesson.lesson_id + 1 : 1;
    const lessonDoc = { ...req.body };
    if (!lessonDoc.lesson_id) lessonDoc.lesson_id = nextLessonId;

    const result = await getCollection('Lessons').insertOne(lessonDoc);
    
    // Update customer's amount_outstanding if lesson has a price
    if (lessonDoc.price && lessonDoc.customer_id) {
      await getCollection('Customers').updateOne(
        { customer_id: lessonDoc.customer_id },
        { $inc: { amount_outstanding: lessonDoc.price } }
      );
    }
    
    // Create chat room between staff and customer if it doesn't exist
    if (lessonDoc.staff_id && lessonDoc.customer_id) {
      try {
        // Get staff and customer accounts
        const staffAccount = await Account.findOne({ staff_id: lessonDoc.staff_id });
        const customerAccount = await Account.findOne({ customer_id: lessonDoc.customer_id });
        
        if (staffAccount && customerAccount) {
          const room_id = `${staffAccount.username}_${customerAccount.username}`;
          
          // Check if room already exists
          const existingRoom = await ChatRoom.findOne({ room_id });
          
          if (!existingRoom) {
            // Get staff and customer details
            const staff = await Staff.findOne({ staff_id: lessonDoc.staff_id });
            const customer = await Customer.findOne({ customer_id: lessonDoc.customer_id });
            
            if (staff && customer) {
              // Create chat room
              const chatRoom = new ChatRoom({
                room_id,
                staff_id: staff.staff_id,
                customer_id: customer.customer_id,
                staff_username: staffAccount.username,
                customer_username: customerAccount.username,
                staff_name: `${staff.first_name} ${staff.last_name}`,
                customer_name: `${customer.first_name} ${customer.last_name}`
              });
              
              await chatRoom.save();
              console.log(`Chat room created for staff ${staff.staff_id} and customer ${customer.customer_id}`);
            }
          }
        }
      } catch (chatError) {
        // Log error but don't fail the lesson creation
        console.error('Error creating chat room:', chatError);
      }
    }
    
    res.status(201).json({ _id: result.insertedId, ...lessonDoc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;
    
    const result = await getCollection('Lessons').findOneAndUpdate(
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
    // Get the lesson first to retrieve price and customer_id
    const lesson = await getCollection('Lessons').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!lesson) return res.status(404).json({ error: 'Not found' });
    
    const result = await getCollection('Lessons').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    
    // Update customer's amount_outstanding by subtracting the lesson price
    if (lesson.price && lesson.customer_id) {
      await getCollection('Customers').updateOne(
        { customer_id: lesson.customer_id },
        { $inc: { amount_outstanding: -lesson.price } }
      );
    }
    
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAvailableInstructors = async (req, res) => {
  try {
    const { customer_id } = req.params;
    
    // Get customer's address
    const customer = await getCollection('Customers').findOne({ customer_id: parseInt(customer_id) });
    
    if (!customer || !customer.customer_address_id) {
      return res.json([]);
    }
    
  const customerAddress = await getCollection('Addresses').findOne({ address_id: customer.customer_address_id });
    
    if (!customerAddress || !customerAddress.city) {
      return res.json([]);
    }
    
    // Get all staff in the same city
    const staffInSameCity = await getCollection('Staff').aggregate([
      {
        $lookup: {
          from: 'Addresses',
          localField: 'staff_address_id',
          foreignField: 'address_id',
          as: 'address'
        }
      },
      { $unwind: { path: '$address', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          'address.city': customerAddress.city,
          position_title: { $in: ['Instructor', 'instructor'] } // Filter only instructors
        }
      },
      {
        $project: {
          staff_id: 1,
          nickname: 1,
          first_name: 1,
          last_name: 1,
          email_address: 1,
          phone_number: 1,
          position_title: 1,
          'address.city': 1
        }
      }
    ]).toArray();
    
    res.json(staffInSameCity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStaffWithAssignedCustomers = async (req, res) => {
  try {
    // Get all staff with their lessons and group by staff to find assigned customers
    const staffWithCustomers = await getCollection('Lessons').aggregate([
      {
        $group: {
          _id: '$staff_id',
          customer_ids: { $addToSet: '$customer_id' }
        }
      },
      {
        $lookup: {
          from: 'Staff',
          localField: '_id',
          foreignField: 'staff_id',
          as: 'staff'
        }
      },
      { $unwind: '$staff' },
      {
        $lookup: {
          from: 'Customers',
          localField: 'customer_ids',
          foreignField: 'customer_id',
          as: 'customers'
        }
      },
      {
        $project: {
          _id: '$_id',
          staff: '$staff',
          customers: '$customers'
        }
      }
    ]).toArray();

    res.json(staffWithCustomers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAssignmentsForLessonCreation = async (req, res) => {
  try {
    // Get all staff and customers for lesson creation
    // Since we no longer use assignments, return all possible combinations
    const staff = await getCollection('Staff').find({ 
      position_title: { $in: ['Instructor', 'instructor'] } 
    }).toArray();
    
    const customers = await getCollection('Customers').find({}).toArray();

    // Return staff and customers separately for frontend to handle
    res.json({
      staff: staff.map(s => ({
        staff_id: s.staff_id,
        nickname: s.nickname,
        first_name: s.first_name,
        last_name: s.last_name
      })),
      customers: customers.map(c => ({
        customer_id: c.customer_id,
        first_name: c.first_name,
        last_name: c.last_name,
        email_address: c.email_address
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



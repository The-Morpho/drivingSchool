import StaffCustomerAssignment from '../models/StaffCustomerAssignment.js';
import Staff from '../models/Staff.js';
import Customer from '../models/Customer.js';
import Address from '../models/Address.js';

// Get customers that share the same address as a staff member
export const getCustomersByAddress = async (req, res) => {
  try {
    const { staff_id } = req.params;

    // Get staff member
    const staff = await Staff.findOne({ staff_id });
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // For now, we'll get customers based on a shared address_id field
    // Assuming both Staff and Customer have address_id or similar field
    const customersAtAddress = await Customer.find();
    
    res.json({
      staff_id,
      staff_name: `${staff.first_name} ${staff.last_name}`,
      available_customers: customersAtAddress.map(c => ({
        customer_id: c.customer_id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email_address,
        phone: c.phone_number
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get available customers for a staff member (by staff's city)
export const getAvailableCustomersForStaff = async (req, res) => {
  try {
    const { staff_id } = req.params;

    // Get staff member with their address
    const staff = await Staff.findOne({ staff_id });
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    if (!staff.staff_address_id) {
      return res.status(400).json({ error: 'Staff does not have an assigned address' });
    }

    // Get staff's address to find their city
    const staffAddress = await Address.findOne({ address_id: staff.staff_address_id });
    if (!staffAddress || !staffAddress.city) {
      return res.status(400).json({ error: 'Staff address or city not found' });
    }

    // Get all addresses in the same city
    const addressesInCity = await Address.find({ city: staffAddress.city });
    const addressIdsInCity = addressesInCity.map(addr => addr.address_id);

    // Get all customers in the same city
    const availableCustomers = await Customer.find({ 
      customer_address_id: { $in: addressIdsInCity }
    });

    // Get customers that are ALREADY ASSIGNED TO ANY STAFF (globally occupied)
    const globallyAssignedCustomers = await StaffCustomerAssignment.find({
      is_active: true
    }).select('customer_id');
    
    const globallyAssignedCustomerIds = globallyAssignedCustomers.map(a => a.customer_id);

    // Filter out customers that are assigned to ANY staff member (not just this one)
    const unassignedCustomers = availableCustomers.filter(
      c => !globallyAssignedCustomerIds.includes(c.customer_id)
    );

    res.json({
      staff_id,
      staff_name: `${staff.first_name} ${staff.last_name}`,
      city: staffAddress.city,
      available_customers_count: unassignedCustomers.length,
      available_customers: unassignedCustomers.map(c => ({
        customer_id: c.customer_id,
        first_name: c.first_name,
        last_name: c.last_name,
        email_address: c.email_address,
        phone_number: c.phone_number
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Assign customers to staff
export const assignCustomersToStaff = async (req, res) => {
  try {
    const { staff_id, customer_ids, city, notes } = req.body;

    // Validate
    if (!staff_id || !customer_ids || customer_ids.length === 0) {
      return res.status(400).json({ error: 'staff_id and customer_ids are required' });
    }

    const assignments = [];
    const Account = (await import('../models/Account.js')).default;
    const ChatRoom = (await import('../models/ChatRoom.js')).default;
    
    for (const customer_id of customer_ids) {
      // Check if assignment already exists
      const existing = await StaffCustomerAssignment.findOne({
        staff_id,
        customer_id,
        is_active: true
      });

      if (!existing) {
        const lastAssignment = await StaffCustomerAssignment.findOne().sort({ assignment_id: -1 });
        const nextAssignmentId = lastAssignment ? lastAssignment.assignment_id + 1 : 1;

        const assignment = await StaffCustomerAssignment.create({
          assignment_id: nextAssignmentId,
          staff_id,
          customer_id,
          is_active: true,
          notes: notes || ''
        });

        assignments.push(assignment);
        
        // Automatically create chat room for this staff-customer pair
        try {
          const staffAccount = await Account.findOne({ staff_id });
          const customerAccount = await Account.findOne({ customer_id });
          
          if (staffAccount && customerAccount) {
            const room_id = `${staffAccount.username}_${customerAccount.username}`;
            
            // Check if chat room already exists
            const existingRoom = await ChatRoom.findOne({ room_id });
            
            if (!existingRoom) {
              const staff = await Staff.findOne({ staff_id });
              const customer = await Customer.findOne({ customer_id });
              
              if (staff && customer) {
                await ChatRoom.create({
                  room_id,
                  staff_id,
                  customer_id,
                  staff_username: staffAccount.username,
                  customer_username: customerAccount.username,
                  staff_name: `${staff.first_name} ${staff.last_name}`,
                  customer_name: `${customer.first_name} ${customer.last_name}`
                });
                console.log(`✅ Chat room created: ${room_id}`);
              }
            }
          }
        } catch (chatError) {
          console.error('Error creating chat room:', chatError);
          // Don't fail the assignment if chat creation fails
        }
      }
    }

    // Enrich assignments with staff, customer, and city details before returning
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const staff = await Staff.findOne({ staff_id: assignment.staff_id });
        const customer = await Customer.findOne({ customer_id: assignment.customer_id });
        
        // Get city from staff's address
        let city = 'Unknown';
        if (staff && staff.staff_address_id) {
          const staffAddress = await Address.findOne({ address_id: staff.staff_address_id });
          if (staffAddress) {
            city = staffAddress.city;
          }
        }

        return {
          assignment_id: assignment.assignment_id,
          staff_id: assignment.staff_id,
          staff_name: staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown',
          customer_id: assignment.customer_id,
          customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
          city: city,
          assigned_date: assignment.assigned_date,
          created_at: assignment.createdAt
        };
      })
    );

    res.status(201).json({
      message: `${assignments.length} customer(s) assigned to staff`,
      staff_id,
      assignments_count: assignments.length,
      assignments: enrichedAssignments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all customers assigned to a staff
export const getAssignedCustomers = async (req, res) => {
  try {
    const { staff_id } = req.params;

    const assignments = await StaffCustomerAssignment.find({
      staff_id,
      is_active: true
    });

    // Get customer details
    const customers = await Promise.all(
      assignments.map(async (assignment) => {
        const customer = await Customer.findOne({ customer_id: assignment.customer_id });
        return {
          assignment_id: assignment.assignment_id,
          customer_id: assignment.customer_id,
          first_name: customer?.first_name,
          last_name: customer?.last_name,
          email: customer?.email_address,
          phone: customer?.phone_number,
          address_id: assignment.address_id,
          assigned_date: assignment.assigned_date
        };
      })
    );

    res.json({
      staff_id,
      total_customers: customers.length,
      customers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all staff assigned to a customer
export const getAssignedStaff = async (req, res) => {
  try {
    const { customer_id } = req.params;

    const assignments = await StaffCustomerAssignment.find({
      customer_id,
      is_active: true
    });

    // Get staff details
    const staffMembers = await Promise.all(
      assignments.map(async (assignment) => {
        const staff = await Staff.findOne({ staff_id: assignment.staff_id });
        return {
          assignment_id: assignment.assignment_id,
          staff_id: assignment.staff_id,
          first_name: staff?.first_name,
          last_name: staff?.last_name,
          nickname: staff?.nickname,
          email: staff?.email_address,
          phone: staff?.phone_number,
          address_id: assignment.address_id,
          assigned_date: assignment.assigned_date
        };
      })
    );

    res.json({
      customer_id,
      total_staff: staffMembers.length,
      staff: staffMembers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove customer from staff
export const removeAssignment = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    const assignment = await StaffCustomerAssignment.findOneAndUpdate(
      { assignment_id },
      { is_active: false },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Also delete the chat room and messages for this staff-customer pair
    const ChatRoom = (await import('../models/ChatRoom.js')).default;
    const Message = (await import('../models/Message.js')).default;
    const Lesson = (await import('../models/Lesson.js')).default;
    
    // Find the chat room for this staff-customer pair
    const chatRoom = await ChatRoom.findOne({
      staff_id: assignment.staff_id,
      customer_id: assignment.customer_id
    });
    
    if (chatRoom) {
      // Delete all messages in this chat room
      await Message.deleteMany({ room_id: chatRoom.room_id });
      
      // Delete the chat room itself
      await ChatRoom.deleteOne({ room_id: chatRoom.room_id });
    }

    // Delete all lessons between this staff and customer
    await Lesson.deleteMany({
      staff_id: assignment.staff_id,
      customer_id: assignment.customer_id
    });

    res.json({ 
      message: 'Assignment removed (including chat and lessons)', 
      assignment 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all assignments for a manager (admin) view
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await StaffCustomerAssignment.find({ is_active: true })
      .sort({ staff_id: 1, customer_id: 1 });

    // Enrich with staff and customer details
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const staff = await Staff.findOne({ staff_id: assignment.staff_id });
        const customer = await Customer.findOne({ customer_id: assignment.customer_id });
        
        // Get city from staff's address
        let city = 'Unknown';
        if (staff && staff.staff_address_id) {
          const staffAddress = await Address.findOne({ address_id: staff.staff_address_id });
          if (staffAddress) {
            city = staffAddress.city;
          }
        }

        return {
          assignment_id: assignment.assignment_id,
          staff_id: assignment.staff_id,
          staff_name: staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown',
          customer_id: assignment.customer_id,
          customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
          city: city,
          assigned_date: assignment.assigned_date,
          created_at: assignment.createdAt
        };
      })
    );

    res.json({
      total_assignments: enrichedAssignments.length,
      assignments: enrichedAssignments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bulk assignment: Manager can assign multiple customers to multiple staff at once
export const bulkAssignCustomersToStaff = async (req, res) => {
  try {
    const { assignments } = req.body; // Array of { staff_id, customer_ids, address_id }

    if (!Array.isArray(assignments)) {
      return res.status(400).json({ error: 'assignments must be an array' });
    }

    const results = [];

    for (const assignmentGroup of assignments) {
      const { staff_id, customer_ids, address_id, notes } = assignmentGroup;

      for (const customer_id of customer_ids) {
        const existing = await StaffCustomerAssignment.findOne({
          staff_id,
          customer_id,
          is_active: true
        });

        if (!existing) {
          const lastAssignment = await StaffCustomerAssignment.findOne().sort({ assignment_id: -1 });
          const nextAssignmentId = lastAssignment ? lastAssignment.assignment_id + 1 : 1;

          const assignment = await StaffCustomerAssignment.create({
            assignment_id: nextAssignmentId,
            staff_id,
            customer_id,
            address_id: address_id || 1,
            is_active: true,
            notes: notes || ''
          });

          results.push(assignment);
        }
      }
    }

    res.status(201).json({
      message: `${results.length} assignments created`,
      total: results.length,
      assignments: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get assignment statistics
export const getAssignmentStats = async (req, res) => {
  try {
    const totalAssignments = await StaffCustomerAssignment.countDocuments({ is_active: true });
    const staffCount = await StaffCustomerAssignment.distinct('staff_id', { is_active: true });
    const customerCount = await StaffCustomerAssignment.distinct('customer_id', { is_active: true });

    const staffWithCustomerCount = await StaffCustomerAssignment.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$staff_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      total_assignments: totalAssignments,
      total_staff_assigned: staffCount.length,
      total_customers_assigned: customerCount.length,
      staff_with_customer_counts: staffWithCustomerCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ NEW: Get current staff member's assigned customers
export const getMyAssignedCustomers = async (req, res) => {
  try {
    // Get username from auth middleware
    const username = req.user?.username || req.headers['x-username'];
    
    if (!username) {
      return res.status(401).json({ error: 'Username not found in request' });
    }

    // Import Account model
    const Account = (await import('../models/Account.js')).default;
    
    // Find account first, then get staff details
    const account = await Account.findOne({ username, role: 'Staff' });
    if (!account || !account.staff_id) {
      return res.status(404).json({ error: 'Staff account not found' });
    }

    const staff = await Staff.findOne({ staff_id: account.staff_id });
    if (!staff) {
      return res.status(404).json({ error: 'Staff record not found' });
    }

    // Get all active assignments for this staff member
    const assignments = await StaffCustomerAssignment.find({ 
      staff_id: staff.staff_id, 
      is_active: true 
    });

    // Get customer details for each assignment
    const customers = await Promise.all(
      assignments.map(async (assignment) => {
        const customer = await Customer.findOne({ customer_id: assignment.customer_id });
        if (!customer) return null;

        // Get the Account username for this customer
        const customerAccount = await Account.findOne({ customer_id: customer.customer_id });
        
        return {
          customer_id: customer.customer_id,
          _id: customer._id,
          full_name: `${customer.first_name} ${customer.last_name}`,
          first_name: customer.first_name,
          last_name: customer.last_name,
          username: customerAccount ? customerAccount.username : null, // Add username from Account
          email_address: customer.email_address,
          phone_number: customer.phone_number
        };
      })
    );

    const validCustomers = customers.filter(c => c !== null && c.username !== null);

    res.json({
      staff_id: staff.staff_id,
      total_customers: validCustomers.length,
      customers: validCustomers
    });
  } catch (error) {
    console.error('getMyAssignedCustomers error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ NEW: Get current customer's assigned staff members
export const getMyAssignedStaff = async (req, res) => {
  try {
    // Get username from auth middleware
    const username = req.user?.username || req.headers['x-username'];
    
    if (!username) {
      return res.status(401).json({ error: 'Username not found in request' });
    }

    // Find customer by Account username
    const Account = (await import('../models/Account.js')).default;
    const account = await Account.findOne({ username, role: 'Customer' });
    if (!account || !account.customer_id) {
      return res.status(404).json({ error: 'Customer account not found' });
    }
    
    const customer = await Customer.findOne({ customer_id: account.customer_id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer record not found' });
    }

    // Get all active assignments for this customer
    const assignments = await StaffCustomerAssignment.find({ 
      customer_id: customer.customer_id, 
      is_active: true 
    });

    // Get staff details for each assignment
    const staff = await Promise.all(
      assignments.map(async (assignment) => {
        const staffMember = await Staff.findOne({ staff_id: assignment.staff_id });
        if (!staffMember) return null;

        // Get the Account username for this staff member
        const staffAccount = await Account.findOne({ staff_id: staffMember.staff_id });

        return {
          staff_id: staffMember.staff_id,
          _id: staffMember._id,
          full_name: `${staffMember.first_name} ${staffMember.last_name}`,
          first_name: staffMember.first_name,
          last_name: staffMember.last_name,
          username: staffAccount ? staffAccount.username : staffMember.nickname, // Use Account username
          nickname: staffMember.nickname,
          email_address: staffMember.email_address,
          phone_number: staffMember.phone_number
        };
      })
    );

    const validStaff = staff.filter(s => s !== null && s.username !== null);

    res.json({
      customer_id: customer.customer_id,
      total_staff: validStaff.length,
      staff: validStaff
    });
  } catch (error) {
    console.error('getMyAssignedStaff error:', error);
    res.status(500).json({ error: error.message });
  }
};


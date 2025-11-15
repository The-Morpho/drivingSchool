import Lesson from '../models/Lesson.js';
import Customer from '../models/Customer.js';
import Staff from '../models/Staff.js';
import StaffCustomerAssignment from '../models/StaffCustomerAssignment.js';
import Address from '../models/Address.js';

export const getAll = async (req, res) => {
  try {
    const { role, username } = req.user;
    let query = {};

    if (role === 'customer') {
      // Customer sees only their own lessons
      // Look up customer by Account username, not email_address
      const Account = (await import('../models/Account.js')).default;
      const account = await Account.findOne({ username, role: 'Customer' });
      if (!account || !account.customer_id) {
        return res.json([]);
      }
      query.customer_id = account.customer_id;
    } else if (role === 'instructor' || role === 'staff') {
      // Instructor sees only their own lessons
      // For staff, username is actually their nickname/username from Account table
      const staffRecord = await Staff.findOne({ nickname: username });
      if (!staffRecord) {
        return res.json([]);
      }
      query.staff_id = staffRecord.staff_id;
    }
    // Admin and Manager see all lessons (no filter)

    const data = await Lesson.find(query)
      .populate('customer', 'first_name last_name email_address phone_number')
      .populate('staff', 'first_name last_name nickname')
      .populate('vehicle', 'vehicle_details');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ NEW: Get staff with their assigned customers (group by staff)
export const getStaffWithAssignedCustomers = async (req, res) => {
  try {
    // Get all active assignments
    const assignments = await StaffCustomerAssignment.find({ is_active: true });

    // Group by staff_id
    const staffGroups = {};
    for (const assignment of assignments) {
      if (!staffGroups[assignment.staff_id]) {
        staffGroups[assignment.staff_id] = [];
      }
      staffGroups[assignment.staff_id].push(assignment);
    }

    // Enrich each group with staff and customer details
    const staffWithCustomers = await Promise.all(
      Object.entries(staffGroups).map(async ([staff_id, staffAssignments]) => {
        const staff = await Staff.findOne({ staff_id: parseInt(staff_id) });
        
        const customers = await Promise.all(
          staffAssignments.map(async (assignment) => {
            const customer = await Customer.findOne({ customer_id: assignment.customer_id });
            const address = await Address.findOne({ address_id: assignment.address_id });
            
            return {
              assignment_id: assignment.assignment_id,
              customer_id: assignment.customer_id,
              first_name: customer?.first_name,
              last_name: customer?.last_name,
              email_address: customer?.email_address,
              phone_number: customer?.phone_number,
              address_id: assignment.address_id,
              address: address ? `${address.line_1_number_building}, ${address.city}` : 'Unknown'
            };
          })
        );

        return {
          staff_id: parseInt(staff_id),
          staff_name: `${staff?.first_name} ${staff?.last_name}`,
          email_address: staff?.email_address,
          phone_number: staff?.phone_number,
          total_customers: customers.length,
          customers: customers
        };
      })
    );

    // Sort by staff name
    staffWithCustomers.sort((a, b) => a.staff_name.localeCompare(b.staff_name));

    res.json({
      total_staff: staffWithCustomers.length,
      staff_groups: staffWithCustomers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get assignments for lesson creation (legacy - kept for backwards compatibility)
export const getAssignmentsForLessonCreation = async (req, res) => {
  try {
    // Get all active assignments with enriched data
    const assignments = await StaffCustomerAssignment.find({ is_active: true });

    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const staff = await Staff.findOne({ staff_id: assignment.staff_id });
        const address = await Address.findOne({ address_id: assignment.address_id });
        
        const customers = await Promise.all(
          [assignment.customer_id].map(async (customer_id) => {
            const customer = await Customer.findOne({ customer_id });
            return {
              customer_id,
              first_name: customer?.first_name,
              last_name: customer?.last_name
            };
          })
        );

        return {
          assignment_id: assignment.assignment_id,
          staff_id: assignment.staff_id,
          staff_name: `${staff?.first_name} ${staff?.last_name}`,
          customer_id: assignment.customer_id,
          customer_name: customers[0]?.first_name + ' ' + customers[0]?.last_name,
          address_id: assignment.address_id,
          address: address ? `${address.line_1_number_building}, ${address.city}` : 'Unknown',
          assigned_date: assignment.assigned_date
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

export const getById = async (req, res) => {
  try {
    const data = await Lesson.findById(req.params.id)
      .populate('customer', 'first_name last_name email_address phone_number')
      .populate('staff', 'first_name last_name nickname')
      .populate('vehicle', 'vehicle_details');
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const { assignment_id, vehicle_id, lesson_date, lesson_time, lesson_duration, lesson_status_code, price } = req.body;

    // Validate required fields
    if (!assignment_id) {
      return res.status(400).json({ error: 'assignment_id is required' });
    }

    // Get the assignment to validate it exists and is active
    const assignment = await StaffCustomerAssignment.findOne({
      assignment_id,
      is_active: true
    });

    if (!assignment) {
      return res.status(400).json({ error: 'Assignment not found or is inactive' });
    }

    // ✅ Automatically ensure assignment exists (create if not)
    const existingAssignment = await StaffCustomerAssignment.findOne({
      staff_id: assignment.staff_id,
      customer_id: assignment.customer_id,
      is_active: true
    });

    if (!existingAssignment) {
      // Create assignment automatically
      const lastAssignment = await StaffCustomerAssignment.findOne().sort({ assignment_id: -1 });
      const nextAssignmentId = (lastAssignment?.assignment_id || 0) + 1;
      
      await StaffCustomerAssignment.create({
        assignment_id: nextAssignmentId,
        staff_id: assignment.staff_id,
        customer_id: assignment.customer_id,
        address_id: assignment.address_id || 1,
        is_active: true,
        assigned_date: new Date(),
        notes: 'Auto-created from lesson'
      });
    }

    // Get next lesson_id
    const lastLesson = await Lesson.findOne().sort({ lesson_id: -1 });
    const nextLessonId = (lastLesson?.lesson_id || 0) + 1;

    // Create lesson with assignment details
    const lessonData = {
      lesson_id: nextLessonId,
      assignment_id: assignment.assignment_id,
      staff_id: assignment.staff_id,
      customer_id: assignment.customer_id,
      vehicle_id: vehicle_id || null,
      lesson_date: lesson_date || new Date().toISOString().split('T')[0],
      lesson_time: lesson_time || '',
      lesson_duration: lesson_duration || '',
      lesson_status_code: lesson_status_code || 'Scheduled',
      price: price || 0
    };

    const data = await Lesson.create(lessonData);

    // Populate after creation
    const populated = await Lesson.findById(data._id)
      .populate('customer', 'first_name last_name email_address phone_number')
      .populate('staff', 'first_name last_name nickname')
      .populate('vehicle', 'vehicle_details');

    res.status(201).json({
      message: 'Lesson created successfully from assignment',
      lesson: populated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('customer', 'first_name last_name email_address phone_number')
      .populate('staff', 'first_name last_name nickname')
      .populate('vehicle', 'vehicle_details');
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const delete_ = async (req, res) => {
  try {
    const data = await Lesson.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

import connectDB from '../db.js';
import Address from '../models/Address.js';
import Vehicle from '../models/Vehicle.js';
import Customer from '../models/Customer.js';
import Staff from '../models/Staff.js';
import Account from '../models/Account.js';
import bcrypt from 'bcrypt';

const PASSWORD = 'admin123';

const seed = async () => {
  try {
    await connectDB();

    // Define ids to avoid duplicates when re-running
    const addressIds = [1001, 1002, 1003, 1004, 1005];
    const vehicleIds = [2001, 2002, 2003, 2004, 2005];
    const customerId = 3001;
    const staffManagerId = 4001;
    const staffInstructorId = 4002;
    const accountIds = { customer: 5001, manager: 5002, instructor: 5003 };

    // Cleanup existing sample docs with these ids
    await Address.deleteMany({ address_id: { $in: addressIds } });
    await Vehicle.deleteMany({ vehicle_id: { $in: vehicleIds } });
    await Customer.deleteMany({ customer_id: customerId });
    await Staff.deleteMany({ staff_id: { $in: [staffManagerId, staffInstructorId] } });
    await Account.deleteMany({ account_id: { $in: Object.values(accountIds) } });

    // Create addresses
    const addressesData = [
      { address_id: 1001, line_1_number_building: '12 A Baker St', city: 'London', zip_postcode: 'NW1 6XE', state_province_county: 'Greater London', country: 'UK' },
      { address_id: 1002, line_1_number_building: '34 Elm Ave', city: 'Bristol', zip_postcode: 'BS1 4ST', state_province_county: 'Avon', country: 'UK' },
      { address_id: 1003, line_1_number_building: '7 Oak Road', city: 'Manchester', zip_postcode: 'M1 2AB', state_province_county: 'Greater Manchester', country: 'UK' },
      { address_id: 1004, line_1_number_building: '88 Pine Lane', city: 'Leeds', zip_postcode: 'LS1 3GH', state_province_county: 'West Yorkshire', country: 'UK' },
      { address_id: 1005, line_1_number_building: '5 Willow Way', city: 'Glasgow', zip_postcode: 'G1 1AA', state_province_county: 'Glasgow', country: 'UK' },
    ];

    const addresses = await Address.insertMany(addressesData);
    console.log('Inserted addresses:', addresses.map(a => a.address_id));

    // Create vehicles
    const vehiclesData = [
      { vehicle_id: 2001, vehicle_name: 'Ford', vehicle_model: 'Focus', vehicle_details: 'Manual, Petrol' },
      { vehicle_id: 2002, vehicle_name: 'Toyota', vehicle_model: 'Corolla', vehicle_details: 'Automatic, Hybrid' },
      { vehicle_id: 2003, vehicle_name: 'Volkswagen', vehicle_model: 'Polo', vehicle_details: 'Manual, Diesel' },
      { vehicle_id: 2004, vehicle_name: 'BMW', vehicle_model: '3 Series', vehicle_details: 'Automatic, Petrol' },
      { vehicle_id: 2005, vehicle_name: 'Audi', vehicle_model: 'A1', vehicle_details: 'Automatic, Petrol' },
    ];

    const vehicles = await Vehicle.insertMany(vehiclesData);
    console.log('Inserted vehicles:', vehicles.map(v => v.vehicle_id));

    // Create a customer
    const customer = await Customer.create({
      customer_id: customerId,
      customer_address_id: addressIds[0],
      customer_status_code: 'active',
      date_became_customer: new Date().toISOString(),
      date_of_birth: '1990-01-01',
      first_name: 'Alice',
      last_name: 'Walker',
      amount_outstanding: 0,
      email_address: 'alice@example.com',
      phone_number: '+441234567890',
    });
    console.log('Created customer id:', customer.customer_id);

    // Create staff manager
    const staffManager = await Staff.create({
      staff_id: staffManagerId,
      staff_address_id: addressIds[1],
      nickname: 'Boss',
      first_name: 'Robert',
      last_name: 'Smith',
      date_of_birth: '1980-05-10',
      date_joined_staff: new Date().toISOString(),
      email_address: 'robert.smith@example.com',
      phone_number: '+441112223334',
      position_title: 'manager',
    });
    console.log('Created staff (manager) id:', staffManager.staff_id);

    // Create staff instructor
    const staffInstructor = await Staff.create({
      staff_id: staffInstructorId,
      staff_address_id: addressIds[2],
      nickname: 'Teach',
      first_name: 'Emma',
      last_name: 'Johnson',
      date_of_birth: '1992-09-20',
      date_joined_staff: new Date().toISOString(),
      email_address: 'emma.johnson@example.com',
      phone_number: '+441998887776',
      position_title: 'instructor',
    });
    console.log('Created staff (instructor) id:', staffInstructor.staff_id);

    // Hash password
    const hashed = await bcrypt.hash(PASSWORD, 10);

    // Create customer account
    const customerAccount = await Account.create({
      account_id: accountIds.customer,
      username: 'alice',
      password: hashed,
      role: 'Customer',
      customer_id: customer._id,
      is_active: true,
    });
    console.log('Created customer account id:', customerAccount.account_id);

    // Create manager staff account (role Staff with staff_id reference)
    const managerAccount = await Account.create({
      account_id: accountIds.manager,
      username: 'robert',
      password: hashed,
      role: 'Staff',
      staff_id: staffManager._id,
      is_active: true,
    });
    console.log('Created manager account id:', managerAccount.account_id);

    // Create instructor staff account
    const instructorAccount = await Account.create({
      account_id: accountIds.instructor,
      username: 'emma',
      password: hashed,
      role: 'Staff',
      staff_id: staffInstructor._id,
      is_active: true,
    });
    console.log('Created instructor account id:', instructorAccount.account_id);

    console.log('\nSeeding completed successfully. Password for all accounts is:', PASSWORD);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();

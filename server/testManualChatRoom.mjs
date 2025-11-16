import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/drivingSchool';

async function testLessonCreation() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db();
    
    // Get existing accounts to use for test
    const staffAccount = await db.collection('Account').findOne({ role: 'Staff' });
    const customerAccount = await db.collection('Account').findOne({ role: 'Customer' });
    
    console.log('\n📋 Found Accounts:');
    console.log('Staff Account:', staffAccount ? `${staffAccount.username} (staff_id: ${staffAccount.staff_id})` : 'None');
    console.log('Customer Account:', customerAccount ? `${customerAccount.username} (customer_id: ${customerAccount.customer_id})` : 'None');
    
    if (!staffAccount || !customerAccount) {
      console.log('❌ Cannot test - missing staff or customer accounts');
      return;
    }
    
    // Get actual staff and customer records
    const staff = await db.collection('Staff').findOne({ 
      $or: [
        { staff_id: staffAccount.staff_id },
        { staff_id: parseInt(staffAccount.staff_id) }
      ]
    });
    
    const customer = await db.collection('Customers').findOne({ 
      $or: [
        { customer_id: customerAccount.customer_id },
        { customer_id: parseInt(customerAccount.customer_id) }
      ]
    });
    
    console.log('\n📋 Found Records:');
    console.log('Staff Record:', staff ? `${staff.first_name} ${staff.last_name} (ID: ${staff.staff_id})` : 'None');
    console.log('Customer Record:', customer ? `${customer.first_name} ${customer.last_name} (ID: ${customer.customer_id})` : 'None');
    
    if (!staff || !customer) {
      console.log('❌ Cannot test - missing staff or customer records');
      return;
    }
    
    // Check if chat room already exists
    const existingRoom = await db.collection('chatrooms').findOne({
      $or: [
        { room_id: `${staffAccount.username}_${customerAccount.username}` },
        { staff_username: staffAccount.username, customer_username: customerAccount.username }
      ]
    });
    
    console.log('\n💬 Chat Room Status:');
    if (existingRoom) {
      console.log('✅ Chat room already exists:', existingRoom.room_id);
    } else {
      console.log('❌ No chat room exists between these users');
      
      // Try to create the chat room manually
      console.log('\n🔧 Creating chat room manually...');
      
      const room_id = `${staffAccount.username}_${customerAccount.username}`;
      const chatRoomDoc = {
        room_id,
        staff_id: staff.staff_id,
        customer_id: customer.customer_id,
        staff_username: staffAccount.username,
        customer_username: customerAccount.username,
        staff_name: `${staff.first_name} ${staff.last_name}`,
        customer_name: `${customer.first_name} ${customer.last_name}`,
        last_message: '',
        last_message_at: null,
        unread_count_staff: 0,
        unread_count_customer: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      try {
        await db.collection('chatrooms').insertOne(chatRoomDoc);
        console.log('✅ Chat room created successfully:', room_id);
      } catch (error) {
        console.log('❌ Error creating chat room:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

testLessonCreation();
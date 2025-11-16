import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/drivingSchool';

async function checkDatabaseState() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db();
    
    console.log('\n📊 Database State:');
    
    // Check all collections and their counts
    const collections = ['Account', 'Staff', 'Customers', 'Lessons', 'chatrooms'];
    
    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`${collectionName}: ${count} documents`);
      
      if (count > 0 && count < 5) {
        const docs = await db.collection(collectionName).find({}).toArray();
        console.log(`  Sample ${collectionName}:`, docs.map(doc => ({
          id: doc._id,
          ...Object.fromEntries(Object.entries(doc).filter(([key]) => !key.startsWith('_')))
        })));
      }
    }
    
    // Check specifically for lessons that need chat rooms
    console.log('\n🎯 Lessons without Chat Rooms:');
    const lessons = await db.collection('Lessons').find({}).toArray();
    
    for (const lesson of lessons) {
      console.log(`\nLesson ${lesson.lesson_id}:`);
      console.log(`  Staff ID: ${lesson.staff_id} (type: ${typeof lesson.staff_id})`);
      console.log(`  Customer ID: ${lesson.customer_id} (type: ${typeof lesson.customer_id})`);
      
      // Try to find staff account
      const staffAccount = await db.collection('Account').findOne({ 
        $or: [
          { staff_id: lesson.staff_id },
          { staff_id: lesson.staff_id.toString() }
        ]
      });
      
      // Try to find customer account  
      const customerAccount = await db.collection('Account').findOne({ 
        $or: [
          { customer_id: lesson.customer_id },
          { customer_id: lesson.customer_id.toString() }
        ]
      });
      
      console.log(`  Staff Account: ${staffAccount ? staffAccount.username : 'Not found'}`);
      console.log(`  Customer Account: ${customerAccount ? customerAccount.username : 'Not found'}`);
      
      if (staffAccount && customerAccount) {
        const room_id = `${staffAccount.username}_${customerAccount.username}`;
        const existingRoom = await db.collection('chatrooms').findOne({ room_id });
        console.log(`  Chat Room: ${existingRoom ? 'EXISTS' : 'MISSING'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkDatabaseState();
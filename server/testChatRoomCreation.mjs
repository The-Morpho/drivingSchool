import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/drivingSchool';

async function testChatRoomCreation() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db();
    
    console.log('🔍 Testing Chat Room Creation...\n');
    
    // Check if collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('📁 Available Collections:', collectionNames);
    
    // Check each important collection
    for (const collectionName of ['Account', 'Staff', 'Customers', 'Lessons', 'chatrooms']) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`   ${collectionName}: ${count} documents`);
      } catch (err) {
        console.log(`   ${collectionName}: Error - ${err.message}`);
      }
    }
    
    // Check chat rooms
    const chatRooms = await db.collection('chatrooms').find({}).toArray();
    console.log(`\n💬 Total Chat Rooms: ${chatRooms.length}`);
    
    if (chatRooms.length > 0) {
      console.log('\n📋 Recent Chat Rooms:');
      chatRooms.slice(0, 5).forEach((room, index) => {
        console.log(`${index + 1}. Room ID: ${room.room_id}`);
        console.log(`   Staff: ${room.staff_name} (@${room.staff_username})`);
        console.log(`   Customer: ${room.customer_name} (@${room.customer_username})`);
        console.log(`   Created: ${room.created_at}`);
        console.log('');
      });
    }
    
    // Check recent lessons
    const recentLessons = await db.collection('Lessons').find({}).sort({ _id: -1 }).limit(5).toArray();
    console.log(`\n📚 Recent Lessons: ${recentLessons.length}`);
    
    if (recentLessons.length > 0) {
      recentLessons.forEach((lesson, index) => {
        console.log(`${index + 1}. Lesson ID: ${lesson.lesson_id || 'N/A'}`);
        console.log(`   Customer ID: ${lesson.customer_id}`);
        console.log(`   Staff ID: ${lesson.staff_id}`);
        console.log(`   Date: ${lesson.lesson_date} ${lesson.lesson_time || ''}`);
        console.log('');
      });
    }
    
    // Check accounts
    const accountCount = await db.collection('Account').countDocuments();
    console.log(`\n👥 Total Accounts: ${accountCount}`);
    
    if (accountCount > 0) {
      const staffAccounts = await db.collection('Account').find({ role: 'Staff' }).toArray();
      const customerAccounts = await db.collection('Account').find({ role: 'Customer' }).toArray();
      
      console.log(`   Staff Accounts: ${staffAccounts.length}`);
      console.log(`   Customer Accounts: ${customerAccounts.length}`);
      
      if (staffAccounts.length > 0) {
        console.log('\n👨‍🏫 Staff Accounts:');
        staffAccounts.slice(0, 3).forEach(acc => {
          console.log(`   - ${acc.username} (Staff ID: ${acc.staff_id})`);
        });
      }
      
      if (customerAccounts.length > 0) {
        console.log('\n👥 Customer Accounts:');
        customerAccounts.slice(0, 3).forEach(acc => {
          console.log(`   - ${acc.username} (Customer ID: ${acc.customer_id})`);
        });
      }
    }
    
    // Test database connection and permissions
    console.log('\n🔧 Database Info:');
    const adminDb = client.db().admin();
    try {
      const dbStats = await db.stats();
      console.log(`   Database: ${db.databaseName}`);
      console.log(`   Collections: ${dbStats.collections}`);
      console.log(`   Data Size: ${Math.round(dbStats.dataSize / 1024)} KB`);
    } catch (err) {
      console.log(`   Could not get database stats: ${err.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

testChatRoomCreation();
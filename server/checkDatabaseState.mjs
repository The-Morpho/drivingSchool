import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017/drivingSchool';

async function checkDatabaseState() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db();
    
    console.log('\n📊 Database State:');
    
    // Check all collections and their counts (chat features removed)
    const collections = ['Account', 'Staff', 'Customers', 'Lessons'];
    
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
    
    // Chatroom checks removed; feature deprecated.
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkDatabaseState();
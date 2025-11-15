/**
 * Test Script for Chat System
 * Run this after starting the server to test chat functionality
 */

import { MongoClient } from 'mongodb';

const mongoUrl = 'mongodb://localhost:27017/drivingSchool';

async function testChatSystem() {
  console.log('\n🧪 TESTING CHAT SYSTEM\n');
  console.log('='.repeat(60));

  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    const db = client.db('drivingSchool');

    // 1. Check if ChatRoom collection exists
    const collections = await db.listCollections().toArray();
    const hasChatRoom = collections.some(c => c.name === 'chatrooms');
    const hasMessage = collections.some(c => c.name === 'messages');

    console.log('\n📋 Database Collections:');
    console.log(`   ✓ ChatRoom collection: ${hasChatRoom ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`   ✓ Message collection: ${hasMessage ? 'EXISTS' : 'NOT FOUND'}`);

    // 2. Check for existing chat rooms
    const chatRooms = await db.collection('chatrooms').countDocuments();
    console.log(`\n💬 Chat Rooms: ${chatRooms} room(s)`);

    if (chatRooms > 0) {
      const sampleRooms = await db.collection('chatrooms').find({}).limit(3).toArray();
      console.log('\n   Sample Rooms:');
      sampleRooms.forEach((room, i) => {
        console.log(`   ${i + 1}. ${room.room_id}`);
        console.log(`      Staff: ${room.staff_name} (${room.staff_username})`);
        console.log(`      Customer: ${room.customer_name} (${room.customer_username})`);
      });
    }

    // 3. Check for messages
    const messages = await db.collection('messages').countDocuments();
    console.log(`\n📨 Messages: ${messages} message(s)`);

    // 4. Check staff-customer assignments
    const assignments = await db.collection('StaffCustomerAssignments').countDocuments();
    console.log(`\n👥 Staff-Customer Assignments: ${assignments}`);

    if (chatRooms === 0 && assignments > 0) {
      console.log('\n⚠️  You have assignments but no chat rooms!');
      console.log('   Run this command to sync:');
      console.log('   curl -X POST http://localhost:5000/api/chat/rooms/sync-assignments');
    }

    // 5. Server connection test
    console.log('\n🌐 Server Connection Test:');
    console.log('   1. Make sure server is running: npm run dev');
    console.log('   2. Test REST API:');
    console.log('      curl "http://localhost:5000/api/chat/rooms?username=thompson.constantin"');
    console.log('   3. Test Socket.io (in browser console):');
    console.log('      const socket = io("http://localhost:5000");');
    console.log('      socket.on("connect", () => console.log("Connected!"));');

    // 6. Redis check
    console.log('\n🔴 Redis Setup:');
    console.log('   Make sure Redis is installed and running:');
    console.log('   - Windows: redis-server');
    console.log('   - Mac: brew services start redis');
    console.log('   - Test: redis-cli ping (should return PONG)');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test complete! See CHAT_SYSTEM_SETUP.md for full docs\n');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testChatSystem().catch(console.error);

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import connectDB from './db.js';
import apiRoutes from './routes/api.js';
import chatRoutes from './routes/chatRoutes.js';
import { initializeSocket, closeSocket } from './socket/socketHandler.js';

const app = express();

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Driving School API with Real-time Chat' });
});

const PORT = process.env.PORT || 5000;

// Start server and initialize Socket.io
httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize Socket.io with Redis Pub/Sub
  try {
    await initializeSocket(httpServer);
    console.log('💬 Real-time chat system initialized');
  } catch (error) {
    console.error('Failed to initialize Socket.io:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully...');
  await closeSocket();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server gracefully...');
  await closeSocket();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

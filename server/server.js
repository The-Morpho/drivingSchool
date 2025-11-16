import express from 'express';
import cors from 'cors';
import connectDB from './db.js';
import apiRoutes from './routes/api.js';

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Driving School API' });
});

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server gracefully...');
  process.exit(0);
});

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/drivingSchool');
    console.log('MongoDB connected successfully with Mongoose');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Helper function to get the native MongoDB database object
export const getDB = () => mongoose.connection.db;

export default connectDB;

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log('Connecting to MongoDB...');
    // console.log('URI:', maskedUri); // Uncomment for deep debugging if needed, but be careful with logs

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

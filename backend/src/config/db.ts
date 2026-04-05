import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Bolt: Clean URI from copy-paste artifacts (like trailing '>')
    // This is critical for robust connection setup when special characters are present.
    uri = uri.trim().replace(/[> ]+$/, '');

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log the cleaned URI for debugging (masking password)
    if (uri) {
      const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
      console.log('Attempted URI:', maskedUri);
    }
    process.exit(1);
  }
};

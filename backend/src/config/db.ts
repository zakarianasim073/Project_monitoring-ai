import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up the URI from common copy-paste artifacts and trailing special characters
    // Using a more aggressive regex to strip non-alphanumeric trailing chars except / and ?
    uri = uri.trim().replace(/[^a-zA-Z0-9/?=&]+$/, '');

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log the cleaned URI for debugging (masking password)
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log('Attempted URI:', maskedUri);
    process.exit(1);
  }
};

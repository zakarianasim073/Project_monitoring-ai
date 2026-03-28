import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up the URI from common copy-paste artifacts (trailing whitespace/newlines)
    uri = uri.trim();

    if (uri.includes('<username>') || uri.includes('<password>')) {
      console.warn('⚠️ Warning: Using default MONGO_URI from .env.example. Please update your environment variables.');
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log the URI for debugging (masking password correctly even with multiple @ symbols)
    if (uri) {
      let maskedUri = uri;
      const atIndex = uri.lastIndexOf('@');
      const colonIndex = uri.indexOf(':', uri.indexOf('://') + 3);

      if (colonIndex !== -1 && atIndex !== -1 && colonIndex < atIndex) {
        maskedUri = uri.substring(0, colonIndex + 1) + '****' + uri.substring(atIndex);
      }
      console.log('Attempted URI (masked):', maskedUri);
    }
    process.exit(1);
  }
};

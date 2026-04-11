import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up the URI from common copy-paste artifacts
    uri = uri.trim();

    // Robustly handle special characters in credentials (like '>') for platforms like Render
    if (uri.includes('://') && uri.includes('@')) {
      const parts = uri.split('://');
      const scheme = parts[0];
      const remainder = parts[1];

      const lastAtIdx = remainder.lastIndexOf('@');
      if (lastAtIdx !== -1) {
        const authPart = remainder.substring(0, lastAtIdx);
        const hostPart = remainder.substring(lastAtIdx + 1);

        const authSplit = authPart.split(':');
        if (authSplit.length === 2) {
          const user = encodeURIComponent(authSplit[0]);
          const pass = encodeURIComponent(authSplit[1]);
          uri = `${scheme}://${user}:${pass}@${hostPart}`;
        }
      }
    }

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

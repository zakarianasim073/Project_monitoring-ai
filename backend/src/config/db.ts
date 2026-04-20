import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up URI and handle special characters in password
    uri = uri.trim().replace(/[^a-zA-Z0-9/?=&]+$/, '');

    if (uri.includes('<username>') || uri.includes('<password>')) {
      console.warn('⚠️ Warning: MONGO_URI contains placeholder strings. Update your environment variables.');
    }

    // Identify credentials if they contain special characters like '@'
    const match = uri.match(/^mongodb(?:\+srv)?:\/\/([^:]+):(.+)@(.+)$/);
    if (match) {
      const [full, user, pass, host] = match;
      // Re-encode username/password to handle special characters
      uri = `${uri.split('://')[0]}://${encodeURIComponent(decodeURIComponent(user))}:${encodeURIComponent(decodeURIComponent(pass))}@${host}`;
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

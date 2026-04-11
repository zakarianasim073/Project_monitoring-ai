import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Robustly handle special characters in credentials (e.g. '>') that cause SRV lookup errors
    if (uri.includes('@')) {
      const parts = uri.split('://');
      const protocol = parts[0];
      const rest = parts[1];

      const lastAt = rest.lastIndexOf('@');
      const auth = rest.substring(0, lastAt);
      const hostAndParams = rest.substring(lastAt + 1);

      if (auth.includes(':')) {
        const [user, ...passParts] = auth.split(':');
        const pass = passParts.join(':');
        // Encode password to handle special chars like '>' correctly in the URI
        uri = `${protocol}://${user}:${encodeURIComponent(pass)}@${hostAndParams}`;
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

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const safeEncode = (uri: string): string => {
  if (!uri.includes('@')) return uri;

  try {
    const lastAtIndex = uri.lastIndexOf('@');
    const partBeforeAt = uri.substring(0, lastAtIndex);
    const partAfterAt = uri.substring(lastAtIndex);

    // Split into prefix (e.g., mongodb+srv://user) and password
    const passwordIndex = partBeforeAt.lastIndexOf(':');
    if (passwordIndex === -1 || passwordIndex < partBeforeAt.indexOf('://') + 3) {
      return uri;
    }

    const prefix = partBeforeAt.substring(0, passwordIndex + 1);
    const password = partBeforeAt.substring(passwordIndex + 1);

    return `${prefix}${encodeURIComponent(password)}${partAfterAt}`;
  } catch (e) {
    return uri;
  }
};

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // URL-encode password to handle special characters and prevent EBADNAME errors
    uri = safeEncode(uri.trim());

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

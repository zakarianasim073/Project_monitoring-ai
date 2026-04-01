import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean and URL-encode the password in MONGO_URI to handle special characters (e.g., '>', '@')
    uri = uri.trim();
    if (uri.startsWith('mongodb+srv://') && uri.includes('@')) {
      const parts = uri.split('://')[1].split('@');
      const credentials = parts[0];
      const host = parts.slice(1).join('@'); // Handle hostnames containing '@' if any

      if (credentials.includes(':')) {
        const [username, password] = credentials.split(':');
        const encodedPassword = encodeURIComponent(decodeURIComponent(password));
        uri = `mongodb+srv://${username}:${encodedPassword}@${host}`;
      }
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log the masked URI for debugging
    if (uri) {
      const atIndex = uri.lastIndexOf('@');
      const colonIndex = uri.indexOf(':', uri.indexOf('://') + 3);
      if (atIndex !== -1 && colonIndex !== -1 && colonIndex < atIndex) {
        const maskedUri = uri.substring(0, colonIndex + 1) + '****' + uri.substring(atIndex);
        console.log('Attempted URI:', maskedUri);
      } else {
        console.log('Attempted URI: [INVALID_FORMAT]');
      }
    }
    process.exit(1);
  }
};

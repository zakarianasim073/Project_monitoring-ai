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

    // Remove any trailing special characters that might have been accidentally pasted
    uri = uri.replace(/[>]+$/, '');

    if (uri.startsWith('mongodb+srv://')) {
      const atIndex = uri.lastIndexOf('@');
      if (atIndex !== -1) {
        const protocolPart = 'mongodb+srv://';
        const credentialsPart = uri.substring(protocolPart.length, atIndex);
        const hostPart = uri.substring(atIndex + 1);

        if (credentialsPart.includes(':')) {
          const colonIndex = credentialsPart.indexOf(':');
          const username = credentialsPart.substring(0, colonIndex);
          const password = credentialsPart.substring(colonIndex + 1);

          const encodedPassword = encodeURIComponent(decodeURIComponent(password));
          uri = `${protocolPart}${username}:${encodedPassword}@${hostPart}`;
        }
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

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up the URI from common copy-paste artifacts and trailing special characters
    uri = uri.trim();

    // Fix for EBADNAME SRV errors on platforms like Render:
    // If the password contains special characters (like '>'), they must be encoded.
    if (uri.includes('://') && uri.includes('@')) {
      const prefix = uri.substring(0, uri.indexOf('://') + 3);
      const suffix = uri.substring(uri.indexOf('://') + 3);

      // Split at the last '@' to isolate the user:pass part from the host
      const lastAtIndex = suffix.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const authPart = suffix.substring(0, lastAtIndex);
        const hostPart = suffix.substring(lastAtIndex + 1);

        if (authPart.includes(':')) {
          const [user, pass] = authPart.split(':');
          // Encode only the user and password parts
          const encodedAuth = `${encodeURIComponent(user)}:${encodeURIComponent(pass)}`;
          uri = `${prefix}${encodedAuth}@${hostPart}`;
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

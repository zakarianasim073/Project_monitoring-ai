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
    uri = uri.trim().replace(/[^a-zA-Z0-9/?=&]+$/, '');

    // Properly encode password if it contains special characters (e.g., <, >, @)
    try {
      if (uri.includes('://')) {
        const [protocol, rest] = uri.split('://');
        const lastAtIndex = rest.lastIndexOf('@');
        const firstSlashIndex = rest.indexOf('/');

        // Ensure @ is part of credentials, not the hostname/query
        if (lastAtIndex !== -1 && (firstSlashIndex === -1 || lastAtIndex < firstSlashIndex)) {
          const authPart = rest.substring(0, lastAtIndex);
          const hostPart = rest.substring(lastAtIndex + 1);

          if (authPart.includes(':')) {
            const [username, ...passwordParts] = authPart.split(':');
            const password = passwordParts.join(':');

            // Only encode if not already encoded
            if (!password.includes('%')) {
              const encodedPassword = encodeURIComponent(password);
              uri = `${protocol}://${username}:${encodedPassword}@${hostPart}`;
            }
          }
        }
      }
    } catch (e) {
      console.warn('URI parsing for encoding failed, attempting original URI');
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

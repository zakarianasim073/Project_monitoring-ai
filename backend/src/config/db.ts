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

    // Performance & Resilience: Auto-encode special characters in passwords (e.g. "@", "<", ">")
    // This prevents connection failures like EBADNAME if the user pasted an unencoded password.
    if (uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://')) {
      const parts = uri.split('@');
      if (parts.length > 1) {
        const credsPart = parts[0];
        const lastAtIndex = uri.lastIndexOf('@');
        const protocolAndCreds = uri.substring(0, lastAtIndex);
        const hostAndRest = uri.substring(lastAtIndex);

        const [protocol, creds] = protocolAndCreds.split('://');
        const [username, ...passwordParts] = creds.split(':');
        const password = passwordParts.join(':');

        if (password) {
          // Only encode if not already encoded
          const encodedPassword = password.includes('%') ? password : encodeURIComponent(password);
          uri = `${protocol}://${username}:${encodedPassword}${hostAndRest}`;
        }
      }
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

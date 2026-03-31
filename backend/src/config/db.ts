import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Encodes URI component while ensuring it's not double-encoded.
 * Helpful for handling special characters in passwords.
 */
const safeEncode = (str: string) => {
  try {
    return encodeURIComponent(decodeURIComponent(str));
  } catch {
    return encodeURIComponent(str);
  }
};

export const connectDB = async () => {
  let uri = (process.env.MONGO_URI || '').trim();

  if (!uri) {
    console.error('❌ MONGO_URI is not defined');
    process.exit(1);
  }

  // Warn if placeholder strings are still present
  if (uri.includes('<username>') || uri.includes('<password>')) {
    console.warn('⚠️  Warning: MONGO_URI contains placeholder <username> or <password>');
  }

  try {
    // Standardize URI: Extract and encode the password segment if it contains special characters
    // This resolves SRV lookup errors (EBADNAME) caused by characters like '@', '<', or '>'
    if (uri.includes('://') && uri.includes('@')) {
      const protocolPart = uri.split('://')[0];
      const rest = uri.split('://')[1];

      // Split by LAST '@' to correctly identify the host separator
      const lastAtIndex = rest.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const credentials = rest.substring(0, lastAtIndex);
        const host = rest.substring(lastAtIndex + 1);

        if (credentials.includes(':')) {
          const [user, pass] = credentials.split(':');
          uri = `${protocolPart}://${safeEncode(user)}:${safeEncode(pass)}@${host}`;
        }
      }
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);

    // Log the attempted URI with masked password for debugging
    if (uri) {
      // Find the last '@' to split credentials from host
      const lastAtIndex = uri.lastIndexOf('@');
      const protocolIndex = uri.indexOf('://');

      if (lastAtIndex !== -1 && protocolIndex !== -1) {
        const prefix = uri.substring(0, protocolIndex + 3);
        const credentials = uri.substring(protocolIndex + 3, lastAtIndex);
        const host = uri.substring(lastAtIndex);

        const maskedCreds = credentials.includes(':')
          ? `${credentials.split(':')[0]}:****`
          : '****';

        console.log('Attempted URI:', `${prefix}${maskedCreds}${host}`);
      }
    }
    process.exit(1);
  }
};

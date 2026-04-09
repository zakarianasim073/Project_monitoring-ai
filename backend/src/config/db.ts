import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Encodes URI credentials exactly once, handling special characters like '@', '<', '>'.
 * Uses decodeURIComponent first to avoid double-encoding.
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

  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    if (uri.includes('<username>') || uri.includes('<password>')) {
      console.warn('⚠️ MONGO_URI contains placeholder <username> or <password>. Connection may fail.');
    }

    // Handle credentials with special characters (like '@' in password)
    // We look for the last '@' as the separator between credentials and the host
    const lastAtIndex = uri.lastIndexOf('@');
    const protocolEndIndex = uri.indexOf('://');

    if (lastAtIndex !== -1 && protocolEndIndex !== -1 && protocolEndIndex + 3 < lastAtIndex) {
      const protocol = uri.substring(0, protocolEndIndex + 3);
      const hostSegment = uri.substring(lastAtIndex);
      const credentialsSegment = uri.substring(protocolEndIndex + 3, lastAtIndex);

      const colonIndex = credentialsSegment.indexOf(':');
      if (colonIndex !== -1) {
        const username = credentialsSegment.substring(0, colonIndex);
        const password = credentialsSegment.substring(colonIndex + 1);

        uri = `${protocol}${safeEncode(username)}:${safeEncode(password)}${hostSegment}`;
      }
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);

    // Log masked URI for debugging
    if (uri) {
      const lastAt = uri.lastIndexOf('@');
      const protocolEnd = uri.indexOf('://');
      const firstColon = uri.indexOf(':', protocolEnd + 3);

      if (lastAt !== -1 && firstColon !== -1 && firstColon < lastAt) {
        const masked = uri.substring(0, firstColon + 1) + '****' + uri.substring(lastAt);
        console.log('Attempted URI:', masked);
      }
    }
    process.exit(1);
  }
};

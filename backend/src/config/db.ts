import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Encodes a string for a URI exactly once.
 * Prevents double-encoding by decoding first.
 */
const safeEncode = (str: string): string => {
  try {
    return encodeURIComponent(decodeURIComponent(str));
  } catch {
    return encodeURIComponent(str);
  }
};

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Trim whitespace and remove trailing special characters that common copy-paste artifacts leave behind
    uri = uri.trim().replace(/[^a-zA-Z0-9/?=&]+$/, '');

    // Resolve EBANDNAME/connection issues by URL-encoding credentials if special characters exist
    if (uri.includes('://') && uri.includes('@')) {
      const protocolPart = uri.split('://')[0];
      const afterProtocol = uri.split('://')[1];

      // The last '@' separates credentials from the host
      const lastAtIndex = afterProtocol.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const credentialsPart = afterProtocol.substring(0, lastAtIndex);
        const hostPart = afterProtocol.substring(lastAtIndex + 1);

        // Split credentials into username and password
        const creds = credentialsPart.split(':');
        const username = creds[0];
        const password = creds.slice(1).join(':'); // Join back in case password contains ':'

        const encodedUser = safeEncode(username);
        const encodedPass = password ? safeEncode(password) : '';

        uri = `${protocolPart}://${encodedUser}${encodedPass ? ':' + encodedPass : ''}@${hostPart}`;
      }
    }

    if (uri.includes('<username>') || uri.includes('<password>')) {
      console.warn('⚠️ MONGO_URI contains placeholder <username> or <password>. Please update your environment variables.');
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log the sanitized URI for debugging (masking password)
    if (uri) {
      const lastAtIndex = uri.lastIndexOf('@');
      const firstColonIndex = uri.indexOf(':', uri.indexOf('://') + 3);

      let maskedUri = uri;
      if (lastAtIndex !== -1 && firstColonIndex !== -1 && firstColonIndex < lastAtIndex) {
        maskedUri = uri.substring(0, firstColonIndex + 1) + '****' + uri.substring(lastAtIndex);
      }
      console.log('Attempted URI:', maskedUri);
    }
    process.exit(1);
  }
};

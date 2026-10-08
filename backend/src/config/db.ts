import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const safeEncode = (str: string) => {
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

    // Clean up the URI from common copy-paste artifacts (like > at the end)
    uri = uri.trim().replace(/>+$/, '');

    // Handle credentials with special characters
    if (uri.includes('@')) {
      const parts = uri.split('@');
      const hostPart = parts.pop();
      const credentialsPart = parts.join('@');

      if (credentialsPart.includes('://')) {
        const [protocol, auth] = credentialsPart.split('://');
        if (auth.includes(':')) {
          const [username, password] = auth.split(':');
          uri = `${protocol}://${safeEncode(username)}:${safeEncode(password)}@${hostPart}`;
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
      // Find the last '@' to separate host from credentials
      const lastAtIndex = uri.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const credentials = uri.substring(0, lastAtIndex);
        const host = uri.substring(lastAtIndex);
        const maskedCredentials = credentials.replace(/:([^:]+)$/, ':****');
        console.log('Attempted URI:', maskedCredentials + host);
      } else {
        console.log('Attempted URI: [Malformed URI]');
      }
    }
    process.exit(1);
  }
};

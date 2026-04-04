import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Safely encodes the password part of a MongoDB connection string
 * to prevent misparsing due to special characters.
 */
const safeEncode = (uri: string) => {
  if (!uri.includes('@')) return uri;

  try {
    const parts = uri.split('@');
    const hostPart = parts.pop();
    const credsPart = parts.join('@');

    if (!credsPart.includes('://')) return uri;

    const [protocol, auth] = credsPart.split('://');
    if (!auth.includes(':')) return uri;

    const [username, password] = auth.split(':');

    // Bolt Optimization: Speed is a feature, but correctness is paramount.
    // Encoding special characters in passwords prevents SRV lookup errors (EBADNAME).
    const encodedPassword = encodeURIComponent(password);
    return `${protocol}://${username}:${encodedPassword}@${hostPart}`;
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

    // Clean up and safely encode the URI
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

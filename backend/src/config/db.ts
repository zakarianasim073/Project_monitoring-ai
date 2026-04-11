import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Bolt: Helper to URL-encode the password segment of a MongoDB URI.
 * This prevents EBADNAME errors caused by special characters like '@', '<', or '>'.
 */
const safeEncode = (uri: string) => {
  if (!uri.includes('@')) return uri;

  try {
    const lastAtIndex = uri.lastIndexOf('@');
    const firstPart = uri.substring(0, lastAtIndex);
    const lastPart = uri.substring(lastAtIndex);

    const protocolMatch = firstPart.match(/^(mongodb(?:\+srv)?:\/\/[^:]+:)(.*)$/);
    if (!protocolMatch) return uri;

    const protocolAndUser = protocolMatch[1];
    const password = protocolMatch[2];

    return `${protocolAndUser}${encodeURIComponent(password)}${lastPart}`;
  } catch {
    return uri;
  }
};

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up and safely encode password
    uri = uri.trim().replace(/[^a-zA-Z0-9/?=&]+$/, '');
    uri = safeEncode(uri);

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

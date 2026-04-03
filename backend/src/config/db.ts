import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🛡️ Sentinel: Automatically encodes the password segment of the MONGO_URI
 * to prevent EBADNAME errors if special characters (like '@' or '>') are present.
 */
const safeEncode = (uri: string) => {
  if (!uri.includes('@')) return uri;

  const parts = uri.split('@');
  const hostPart = parts.pop();
  const authPart = parts.join('@');

  if (!authPart.includes(':')) return uri;

  const authSegments = authPart.split(':');
  const protocol = authSegments[0];
  // Join the rest back if there are multiple colons
  const rest = authSegments.slice(1).join(':');

  // Find where the password starts
  const lastColonIndex = rest.lastIndexOf(':');
  if (lastColonIndex === -1) return uri;

  const user = rest.substring(0, lastColonIndex);
  const pass = rest.substring(lastColonIndex + 1);

  return `${protocol}:${user}:${encodeURIComponent(pass)}@${hostPart}`;
};

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up and encode URI
    uri = safeEncode(uri.trim().replace(/[^a-zA-Z0-9/?=&]+$/, ''));

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log the cleaned URI for debugging (masking sensitive parts)
    if (uri) {
      const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
      console.log('Attempted URI:', maskedUri);
    }
    process.exit(1);
  }
};

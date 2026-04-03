import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Safely URL-encodes the credentials portion of a MongoDB connection URI.
 * This prevents EBADNAME errors caused by special characters in the password.
 */
const safeEncode = (uri: string): string => {
  try {
    if (!uri.includes('@')) return uri;

    const parts = uri.split('://');
    if (parts.length !== 2) return uri;

    const protocol = parts[0];
    const rest = parts[1];

    const lastAtIndex = rest.lastIndexOf('@');
    if (lastAtIndex === -1) return uri;

    const credentials = rest.substring(0, lastAtIndex);
    const hostAndOptions = rest.substring(lastAtIndex + 1);

    const credentialParts = credentials.split(':');
    if (credentialParts.length !== 2) return uri;

    const username = encodeURIComponent(credentialParts[0]);
    const password = encodeURIComponent(credentialParts[1]);

    return `${protocol}://${username}:${password}@${hostAndOptions}`;
  } catch {
    return uri; // Fallback to original URI on parsing error
  }
};

export const connectDB = async () => {
  let rawUri = process.env.MONGO_URI || '';
  let uri = '';
  try {
    if (!rawUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up and safely encode the URI
    uri = safeEncode(rawUri.trim().replace(/[^a-zA-Z0-9/?=&@:]+$/, ''));

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

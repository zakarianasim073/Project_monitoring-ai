import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Safely encodes the password part of a MongoDB URI if present.
 * This prevents SRV lookup errors (EBADNAME) when passwords contain special characters.
 */
const safeEncode = (uri: string) => {
  try {
    // Find the last '@' which separates credentials from the host
    const lastAtIndex = uri.lastIndexOf('@');
    if (lastAtIndex === -1) return uri;

    const credentialsPart = uri.substring(0, lastAtIndex);
    const hostPart = uri.substring(lastAtIndex); // includes the '@'

    // Separate protocol from credentials (e.g., 'mongodb+srv://user:pass')
    const protocolSeparator = '://';
    const protocolEndIndex = credentialsPart.indexOf(protocolSeparator);
    if (protocolEndIndex === -1) return uri;

    const protocol = credentialsPart.substring(0, protocolEndIndex + protocolSeparator.length);
    const userInfo = credentialsPart.substring(protocolEndIndex + protocolSeparator.length);

    // Separate username from password
    const firstColonIndex = userInfo.indexOf(':');
    if (firstColonIndex === -1) return uri;

    const username = userInfo.substring(0, firstColonIndex);
    const password = userInfo.substring(firstColonIndex + 1);

    // Only encode if it hasn't been encoded already (simple check for %)
    const encodedPassword = password.includes('%') ? password : encodeURIComponent(password);

    return `${protocol}${username}:${encodedPassword}${hostPart}`;
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

    // Clean up the URI from common copy-paste artifacts and trailing special characters
    uri = uri.trim().replace(/[^a-zA-Z0-9/?=&]+$/, '');

    // Auto-encode password to handle special characters like '@', '<', '>'
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

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Automates URL-encoding of special characters in MongoDB URI password.
 * This prevents EBADNAME/SRV lookup errors for passwords containing characters like '@', '<', '>'.
 * Bolt: This is critical for robust connection setup in heterogeneous environments.
 */
const safeEncode = (uri: string): string => {
  const parts = uri.split('@');
  if (parts.length < 2) return uri;

  const credentialsPart = parts[0];
  const hostAndParams = parts.slice(1).join('@');

  const schemeEndIndex = credentialsPart.indexOf('://') + 3;
  if (schemeEndIndex === 2) return uri; // "://" not found

  const scheme = credentialsPart.substring(0, schemeEndIndex);
  const credentials = credentialsPart.substring(schemeEndIndex);

  const [username, ...passwordParts] = credentials.split(':');
  if (passwordParts.length === 0) return uri;

  const password = passwordParts.join(':');
  const encodedPassword = encodeURIComponent(password);

  return `${scheme}${username}:${encodedPassword}@${hostAndParams}`;
};

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Bolt: Clean and then safely encode the password part
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

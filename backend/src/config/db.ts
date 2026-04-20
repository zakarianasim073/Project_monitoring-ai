import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up the URI and handle special characters in credentials
    uri = uri.trim();

    // Auto-encode password if it contains special characters to prevent EBADNAME errors
    if (uri.includes('://') && uri.includes('@')) {
      const protocolPart = uri.split('://')[0];
      const remainder = uri.split('://')[1];
      const lastAtIndex = remainder.lastIndexOf('@');
      const credentialsPart = remainder.substring(0, lastAtIndex);
      const hostPart = remainder.substring(lastAtIndex + 1);

      if (credentialsPart.includes(':')) {
        const [username, ...passwordParts] = credentialsPart.split(':');
        const password = passwordParts.join(':');

        const safeEncode = (str: string) => {
          try {
            return encodeURIComponent(decodeURIComponent(str));
          } catch {
            return encodeURIComponent(str);
          }
        };

        uri = `${protocolPart}://${username}:${safeEncode(password)}@${hostPart}`;
      }
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log the cleaned URI for debugging (masking password)
    if (uri) {
      // Improved masking logic to handle complex passwords and retain protocol structure
      const maskedUri = uri.replace(/:([^@/]+)@/, ':****@');
      console.log('Attempted URI:', maskedUri);
    }
    process.exit(1);
  }
};

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // PERFORMANCE: Sanitize and URL-encode the MONGO_URI to prevent SRV lookup errors (EBADNAME)
    // and avoid connection latency from misparsed hostnames.
    uri = uri.trim().replace(/[> ]+$/, '');

    // Ensure special characters like '>' in the password are URL-encoded
    if (uri.includes(':') && uri.includes('@')) {
      const parts = uri.split('@');
      const connectionPart = parts[0];
      const hostPart = parts.slice(1).join('@');
      const protocolSplit = connectionPart.split('://');
      const protocol = protocolSplit[0];
      const credentials = protocolSplit[1];

      if (credentials && credentials.includes(':')) {
        const [username, password] = credentials.split(':');
        const encodedPassword = encodeURIComponent(decodeURIComponent(password));
        uri = `${protocol}://${username}:${encodedPassword}@${hostPart}`;
      }
    }

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

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
    // We target the password between the last colon (before @) and the last @ (before the host)
    if (uri.includes('://') && uri.includes('@')) {
      const protocolSplit = uri.split('://');
      const protocol = protocolSplit[0];
      const rest = protocolSplit[1];

      const lastAtIndex = rest.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const credentialsPart = rest.substring(0, lastAtIndex);
        const hostPart = rest.substring(lastAtIndex + 1);

        const firstColonIndex = credentialsPart.indexOf(':');
        if (firstColonIndex !== -1) {
          const username = credentialsPart.substring(0, firstColonIndex);
          const password = credentialsPart.substring(firstColonIndex + 1);

          // Re-encode to handle special characters correctly
          const encodedPassword = encodeURIComponent(decodeURIComponent(password));
          uri = `${protocol}://${username}:${encodedPassword}@${hostPart}`;
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
      const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
      console.log('Attempted URI:', maskedUri);
    }
    process.exit(1);
  }
};

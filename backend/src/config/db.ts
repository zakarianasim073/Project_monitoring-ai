import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Robustly handle malformed MONGO_URI from Render dashboards (e.g. trailing > or unencoded credentials)
    // 1. Identify parts: [protocol]://[user:pass]@[host]/[db]
    const protocolSeparator = uri.includes('://') ? '://' : ':';
    const parts = uri.split(protocolSeparator);

    if (parts.length === 2) {
      const protocol = parts[0];
      let rest = parts[1];

      // Use lastIndexOf('@') to correctly split credentials from host (handles @ in passwords)
      const lastAtIndex = rest.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        let creds = rest.substring(0, lastAtIndex);
        let hostAndRest = rest.substring(lastAtIndex + 1);

        // Clean trailing artifacts from host (like >)
        hostAndRest = hostAndRest.replace(/[^a-zA-Z0-9.\-_~:/?#[\]@!$&'()*+,;=]+$/, '');

        // Encode special characters in credentials (e.g. > in password)
        const [user, ...passParts] = creds.split(':');
        const pass = passParts.join(':');

        const encodedUser = encodeURIComponent(user);
        const encodedPass = pass ? `:${encodeURIComponent(pass)}` : '';

        uri = `${protocol}${protocolSeparator}${encodedUser}${encodedPass}@${hostAndRest}`;
      } else {
        // Fallback for URIs without credentials
        uri = `${protocol}${protocolSeparator}${rest.replace(/[^a-zA-Z0-9.\-_~:/?#[\]@!$&'()*+,;=]+$/, '')}`;
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

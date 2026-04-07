import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let rawUri = process.env.MONGO_URI || '';
  try {
    if (!rawUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up the URI from common copy-paste artifacts
    rawUri = rawUri.trim();

    let finalUri = rawUri;

    // Support both mongodb+srv:// and mongodb+srv: (though // is standard)
    const protocolSeparator = rawUri.includes('://') ? '://' : ':';

    if (rawUri.includes('@')) {
      const protocolSplit = rawUri.split(protocolSeparator);
      if (protocolSplit.length >= 2) {
        const protocol = protocolSplit[0];
        const rest = protocolSplit.slice(1).join(protocolSeparator);

        const lastAtIndex = rest.lastIndexOf('@');
        if (lastAtIndex !== -1) {
          const credentials = rest.substring(0, lastAtIndex);
          const hostInfo = rest.substring(lastAtIndex + 1);

          if (credentials.includes(':')) {
            const firstColonIndex = credentials.indexOf(':');
            const username = credentials.substring(0, firstColonIndex);
            const password = credentials.substring(firstColonIndex + 1);

            finalUri = `${protocol}${protocolSeparator}${encodeURIComponent(username)}:${encodeURIComponent(password)}@${hostInfo}`;
          } else {
            finalUri = `${protocol}${protocolSeparator}${encodeURIComponent(credentials)}@${hostInfo}`;
          }
        }
      }
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(finalUri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log masked URI for debugging
    if (rawUri) {
      const maskedUri = rawUri.replace(/:([^@]+)@/, ':****@');
      console.log('Attempted (raw) URI:', maskedUri);
    }
    process.exit(1);
  }
};

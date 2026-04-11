import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up the URI from leading/trailing whitespace
    uri = uri.trim();

    // Check for placeholders
    if (uri.includes('<username>') || uri.includes('<password>')) {
      console.warn('⚠️ MONGO_URI contains placeholder <username> or <password>');
    }

    // Automatically URL-encode the password segment to handle special characters (e.g., '>', '@')
    // The standard MongoDB URI format is: mongodb+srv://<username>:<password>@<host>/<database>?<options>
    // We split by the last '@' to isolate the credentials segment from the host/options
    const lastAtIndex = uri.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const credsPart = uri.substring(0, lastAtIndex); // "mongodb+srv://user:pass"
      const hostPart = uri.substring(lastAtIndex);     // "@host/db?options"

      const protocolIndex = credsPart.indexOf('://');
      if (protocolIndex !== -1) {
        const protocol = credsPart.substring(0, protocolIndex + 3); // "mongodb+srv://"
        const credentials = credsPart.substring(protocolIndex + 3); // "user:pass"

        const colonIndex = credentials.indexOf(':');
        if (colonIndex !== -1) {
          const username = credentials.substring(0, colonIndex);
          const password = credentials.substring(colonIndex + 1);

          // URL-encode both username and password to prevent connection failures
          // We use decode/encode pattern to avoid double-encoding if already partially encoded
          const safeEncode = (str: string) => {
            try {
              return encodeURIComponent(decodeURIComponent(str));
            } catch {
              return encodeURIComponent(str);
            }
          };

          const encodedUser = safeEncode(username);
          const encodedPass = safeEncode(password);

          uri = `${protocol}${encodedUser}:${encodedPass}${hostPart}`;
        }
      }
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log the URI for debugging with a masked password, splitting by last '@' for accuracy
    if (uri) {
      const lastAtIndex = uri.lastIndexOf('@');
      let maskedUri = uri;
      if (lastAtIndex !== -1) {
        const credsPart = uri.substring(0, lastAtIndex);
        const hostPart = uri.substring(lastAtIndex);
        maskedUri = credsPart.replace(/:([^@:]+)$/, ':****') + hostPart;
      }
      console.log('Attempted URI:', maskedUri);
    }
    process.exit(1);
  }
};

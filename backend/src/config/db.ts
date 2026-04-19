import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up the URI from common copy-paste artifacts
    uri = uri.trim();

    // Check for common placeholder strings
    if (uri.includes('<username>') || uri.includes('<password>')) {
      console.warn('⚠️ MONGO_URI appears to contain placeholder strings (<username> or <password>). Please update your environment variables.');
    }

    // Automatically URL-encode the password segment if it contains special characters
    // Standard MongoDB URI: mongodb+srv://<username>:<password>@<host>/<database>
    const lastAtIdx = uri.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const prefix = uri.substring(0, lastAtIdx);
      const suffix = uri.substring(lastAtIdx);
      const firstColonIdx = prefix.indexOf(':');
      const secondColonIdx = prefix.indexOf(':', firstColonIdx + 1);

      if (secondColonIdx !== -1) {
        const base = prefix.substring(0, secondColonIdx + 1);
        const password = prefix.substring(secondColonIdx + 1);
        uri = `${base}${encodeURIComponent(password)}${suffix}`;
      }
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log the cleaned URI for debugging (masking password using the last '@' as host separator)
    if (uri) {
      const lastAtIdx = uri.lastIndexOf('@');
      const firstColonIdx = uri.indexOf(':');
      const secondColonIdx = uri.indexOf(':', firstColonIdx + 1);

      let maskedUri = uri;
      if (secondColonIdx !== -1 && lastAtIdx !== -1 && secondColonIdx < lastAtIdx) {
        maskedUri = `${uri.substring(0, secondColonIdx + 1)}****${uri.substring(lastAtIdx)}`;
      }
      console.log('Attempted URI:', maskedUri);
    }
    process.exit(1);
  }
};

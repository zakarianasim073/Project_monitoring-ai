import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const safeEncode = (str: string) => {
  try {
    return encodeURIComponent(decodeURIComponent(str));
  } catch {
    return encodeURIComponent(str);
  }
};

export const connectDB = async () => {
  let uri = (process.env.MONGO_URI || '').trim();
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Handle credentials with special characters (like '@' or '>') by encoding the password segment
    if (uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://')) {
      const protocol = uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
      const remainder = uri.slice(protocol.length);
      const lastAt = remainder.lastIndexOf('@');

      if (lastAt !== -1) {
        const credentials = remainder.slice(0, lastAt);
        const host = remainder.slice(lastAt + 1);
        const [username, ...passwordParts] = credentials.split(':');

        if (passwordParts.length > 0) {
          const password = passwordParts.join(':');
          uri = `${protocol}${username}:${safeEncode(password)}@${host}`;
        }
      }
    }

    // Warning for placeholders
    if (uri.includes('<username>') || uri.includes('<password>')) {
      console.warn('⚠️ Warning: MONGO_URI contains placeholder strings like "<username>" or "<password>".');
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);

    // Better masking: find the last '@' as the host separator
    if (uri) {
      const lastAt = uri.lastIndexOf('@');
      const protocolMatch = uri.match(/^mongodb(?:\+srv)?:\/\//);
      if (lastAt !== -1 && protocolMatch) {
        const protocol = protocolMatch[0];
        const host = uri.slice(lastAt);
        const credentials = uri.slice(protocol.length, lastAt);
        const [username] = credentials.split(':');
        console.log(`Attempted URI: ${protocol}${username}:****${host}`);
      }
    }
    process.exit(1);
  }
};

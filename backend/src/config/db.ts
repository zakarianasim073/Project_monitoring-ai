import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const safeEncode = (str: string) => {
  try {
    // Decode first to prevent double-encoding, then encode
    return encodeURIComponent(decodeURIComponent(str));
  } catch {
    return encodeURIComponent(str);
  }
};

export const connectDB = async () => {
  let uri = (process.env.MONGO_URI || '').trim();

  if (!uri) {
    console.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  // Handle credentials encoding for special characters (like '@' or '>')
  if (uri.includes('@')) {
    const lastAtIndex = uri.lastIndexOf('@');
    const credentialsPart = uri.substring(0, lastAtIndex);
    const hostPart = uri.substring(lastAtIndex + 1);

    if (credentialsPart.includes('://')) {
      const protocolSplit = credentialsPart.split('://');
      const protocol = protocolSplit[0];
      const credentials = protocolSplit[1];

      if (credentials.includes(':')) {
        const [username, password] = credentials.split(':');
        uri = `${protocol}://${safeEncode(username)}:${safeEncode(password)}@${hostPart}`;
      } else {
        uri = `${protocol}://${safeEncode(credentials)}@${hostPart}`;
      }
    }
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);

    // Log masked URI for debugging
    if (uri.includes('@')) {
      const lastAtIndex = uri.lastIndexOf('@');
      const hostPart = uri.substring(lastAtIndex + 1);
      const credentialsPart = uri.substring(0, lastAtIndex);
      const maskedCredentials = credentialsPart.replace(/:([^@/]+)$/, ':****');
      console.log('Attempted URI:', `${maskedCredentials}@${hostPart}`);
    }

    process.exit(1);
  }
};

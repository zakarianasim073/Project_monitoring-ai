import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const safeEncode = (uri: string) => {
  try {
    // Correctly split URI by the last '@' symbol to separate credentials from hostname
    const lastAtIndex = uri.lastIndexOf('@');
    if (lastAtIndex === -1) return uri;

    const credentialsPart = uri.substring(0, lastAtIndex);
    const hostPart = uri.substring(lastAtIndex);

    const protocolIndex = credentialsPart.indexOf('://');
    const protocol = credentialsPart.substring(0, protocolIndex + 3);
    const auth = credentialsPart.substring(protocolIndex + 3);

    const [user, ...passParts] = auth.split(':');
    const pass = passParts.join(':');

    if (!user || !pass) return uri;

    // URL-encode both username and password segment to handle special characters
    return `${protocol}${encodeURIComponent(user)}:${encodeURIComponent(pass)}${hostPart}`;
  } catch {
    return uri;
  }
};

export const connectDB = async () => {
  const rawUri = (process.env.MONGO_URI || '').trim();
  const uri = safeEncode(rawUri);

  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Mask password for safer logging
    if (rawUri) {
      const maskedUri = rawUri.replace(/:([^@]+)@/, ':****@');
      console.log('Attempted URI:', maskedUri);
    }
    process.exit(1);
  }
};

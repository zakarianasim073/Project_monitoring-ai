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
  let rawUri = process.env.MONGO_URI || '';
  let uriToUse = rawUri.trim();

  try {
    if (!uriToUse) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Performance Optimization: Sanitize and safely encode URI components to prevent connection failures
    // Identifying the last '@' as the host separator allows for passwords containing '@' or other special characters.
    if (uriToUse.includes('://') && uriToUse.includes('@')) {
      const protocolPart = uriToUse.split('://')[0];
      const rest = uriToUse.split('://')[1];
      const lastAtIndex = rest.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const credentials = rest.substring(0, lastAtIndex);
        const hostPath = rest.substring(lastAtIndex + 1);

        if (credentials.includes(':')) {
          const [user, ...pwdParts] = credentials.split(':');
          const pwd = pwdParts.join(':');
          uriToUse = `${protocolPart}://${user}:${safeEncode(pwd)}@${hostPath}`;
        }
      }
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uriToUse);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Mask password in logs
    if (uriToUse) {
      const maskedUri = uriToUse.replace(/:([^@]+)@/, (match, p1) => {
        const lastAt = match.lastIndexOf('@');
        return `:****@${match.substring(lastAt + 1)}`;
      });
      console.log('Attempted URI:', maskedUri);
    }
    process.exit(1);
  }
};

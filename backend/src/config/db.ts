import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Robust parsing for MONGO_URI to handle special characters like '>' in passwords
    // Memory fix: split after '://' and find last '@' to isolate credentials
    if (uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://')) {
      const protocol = uri.split('://')[0] + '://';
      const rest = uri.split('://')[1];
      const lastAt = rest.lastIndexOf('@');

      if (lastAt !== -1) {
        const credentials = rest.substring(0, lastAt);
        const hostPath = rest.substring(lastAt + 1);

        if (credentials.includes(':')) {
          const [username, ...passwordParts] = credentials.split(':');
          const password = passwordParts.join(':');
          // Encode special characters in password
          const encodedPassword = encodeURIComponent(password);
          uri = `${protocol}${username}:${encodedPassword}@${hostPath}`;
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

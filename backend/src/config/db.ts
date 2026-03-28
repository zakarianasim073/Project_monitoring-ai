import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Handle potential special characters in password (like '@', '>', etc.)
    // Standard MongoDB SRV: mongodb+srv://username:password@cluster.mongodb.net/
    let connectionUri = uri.trim();
    const lastAtIndex = connectionUri.lastIndexOf('@');
    const firstColonIndex = connectionUri.indexOf(':');
    const protocolIndex = connectionUri.indexOf('://');

    if (lastAtIndex !== -1 && protocolIndex !== -1 && lastAtIndex > protocolIndex + 3) {
      const prefix = connectionUri.substring(0, protocolIndex + 3); // e.g., "mongodb+srv://"
      const userinfoPart = connectionUri.substring(protocolIndex + 3, lastAtIndex); // e.g., "user:p@ss>word"
      const hostPart = connectionUri.substring(lastAtIndex); // e.g., "@cluster.mongodb.net/"

      const colonIndex = userinfoPart.indexOf(':');
      if (colonIndex !== -1) {
        const username = userinfoPart.substring(0, colonIndex);
        const password = userinfoPart.substring(colonIndex + 1);
        connectionUri = `${prefix}${username}:${encodeURIComponent(password)}${hostPart}`;
      }
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(connectionUri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log the cleaned URI for debugging (masking password)
    if (uri) {
      const maskedUri = uri.trim().replace(/:([^@]+)@(?=[^@]*$)/, ':****@');
      console.log('Attempted URI (masked):', maskedUri);
    }
    process.exit(1);
  }
};

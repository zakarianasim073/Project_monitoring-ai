import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    uri = uri.trim();

    // Check for placeholder strings in URI
    if (uri.includes('<username>') || uri.includes('<password>')) {
      console.warn('⚠️ WARNING: MONGO_URI contains placeholder strings like "<username>" or "<password>". Please update your environment variables.');
    }

    // Ensure the protocol is correct (SRV vs standard)
    if (uri.startsWith('mongodb+srv:') && !uri.startsWith('mongodb+srv://')) {
        uri = uri.replace('mongodb+srv:', 'mongodb+srv://');
    } else if (uri.startsWith('mongodb:') && !uri.startsWith('mongodb://')) {
        uri = uri.replace('mongodb:', 'mongodb://');
    }

    // If the URI contains a password with special characters like '@' or '>',
    // it can break the connection if not URL-encoded.
    // Standard URI format: mongodb+srv://[username:password@]host[/[database][?options]]
    // We attempt to find the userinfo segment and encode the password.
    const protocolSeparator = '://';
    const protocolIndex = uri.indexOf(protocolSeparator);

    if (protocolIndex !== -1) {
      const afterProtocol = uri.substring(protocolIndex + protocolSeparator.length);
      const atSymbolIndex = afterProtocol.lastIndexOf('@'); // Use lastIndexOf to handle passwords containing '@'

      if (atSymbolIndex !== -1) {
        const userinfo = afterProtocol.substring(0, atSymbolIndex);
        const hostAndRest = afterProtocol.substring(atSymbolIndex + 1);
        const [username, ...passwordParts] = userinfo.split(':');

        if (passwordParts.length > 0) {
          const password = passwordParts.join(':');
          // Encode only if not already encoded
          const encodedPassword = password.includes('%') ? password : encodeURIComponent(password);
          uri = `${uri.substring(0, protocolIndex + protocolSeparator.length)}${username}:${encodedPassword}@${hostAndRest}`;
        }
      }
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log the URI for debugging (masking password)
    if (uri) {
      const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//\$1:****@');
      console.log('Attempted URI:', maskedUri);
    }
    process.exit(1);
  }
};

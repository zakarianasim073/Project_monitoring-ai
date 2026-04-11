import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  try {
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Clean up the URI from common copy-paste artifacts and trailing special characters
    uri = uri.trim().replace(/[^a-zA-Z0-9/?=&]+$/, '');

    // Handle common mistake of including brackets in password from templates
    if (uri.includes(':<') && uri.includes('>@')) {
      uri = uri.replace(/:<([^>]+)>@/, (match, p1) => `:${encodeURIComponent(p1)}@`);
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log the cleaned URI for debugging (masking credentials securely)
    if (uri) {
      try {
        const url = new URL(uri);
        if (url.password) url.password = '****';
        if (url.username) url.username = '****';
        console.log('Attempted URI:', url.toString());
      } catch (e) {
        // Fallback masking if URL is too malformed to parse
        const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
        console.log('Attempted URI (fallback mask):', maskedUri);
      }
    }
    process.exit(1);
  }
};

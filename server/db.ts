import mongoose from 'mongoose';
import config from './config';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
    console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('MongoDB connection error:', message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err: Error) => {
    console.error('MongoDB runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
}

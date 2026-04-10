import mongoose from 'mongoose';
import logger from '../utils/logger';

export const connectWithRetry = async (uri: string, retries = 5, delay = 3000): Promise<void> => {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(uri);
      logger.info('MongoDB connected successfully');
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`MongoDB connection attempt ${i}/${retries} failed: ${message}`);
      if (i === retries) {
        logger.error('All MongoDB connection attempts failed');
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting reconnect...');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${(err as Error).message}`);
});

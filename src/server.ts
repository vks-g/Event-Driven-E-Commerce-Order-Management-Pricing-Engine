import app from './app';
import env from './config/env';
import { connectWithRetry } from './config/database';
import logger from './utils/logger';

const registerEventHandlers = (): void => {
  import('./events/handlers/inventoryHandlers').then((m) => m.registerHandlers());
  import('./events/handlers/orderHandlers').then((m) => m.registerHandlers());
  logger.info('All event handlers registered');
};

const startServer = async (): Promise<void> => {
  try {
    await connectWithRetry(env.mongodbUri);
    registerEventHandlers();

    app.listen(env.port, () => {
      logger.info(`Server running on http://localhost:${env.port} in ${env.nodeEnv} mode`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${(err as Error).message}`);
    process.exit(1);
  }
};

startServer();

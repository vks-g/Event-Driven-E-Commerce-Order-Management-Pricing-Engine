export interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  logLevel: string;
}

const config: EnvConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_orders',
  logLevel: process.env.LOG_LEVEL || 'debug',
};

export default config;

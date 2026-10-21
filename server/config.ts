import * as dotenv from 'dotenv';
import { ServerConfig } from './types';

dotenv.config();

const config: ServerConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tonyscoin-marketplace',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  pinata: {
    jwt: process.env.PINATA_JWT || '',
    gateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud',
  },
  upload: {
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
};

export default config;

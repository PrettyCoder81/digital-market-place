/**
 * Backend Configuration
 * Centralized environment configuration for the TonysCoin Marketplace API
 */

require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tonyscoin-marketplace',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  pinata: {
    jwt: process.env.PINATA_JWT || '',
    gateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud',
  },
  upload: {
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
};

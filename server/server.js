/**
 * Backend Server - Express.js + MongoDB
 * TonysCoin Digital Marketplace API
 *
 * Responsibilities:
 *  - Store product info and blockchain transactions in MongoDB
 *  - Expose GET/POST methods consumed by the React frontend
 *  - Upload files publicly to IPFS via Pinata
 *
 * Run with: node server/server.js   (or: npm run dev for nodemon)
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const config = require('./config');
const { connectDB } = require('./db');

// Import routes
const ipfsRoutes = require('./routes/ipfs');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');

const app = express();

// ---------- Middleware ----------
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ---------- API Routes ----------
app.use('/api/ipfs', ipfsRoutes);        // Public IPFS (Pinata) uploads
app.use('/api/products', productRoutes); // Product info stored in MongoDB
app.use('/api/transactions', transactionRoutes); // Blockchain tx logs in MongoDB

// ---------- Health check ----------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ---------- 404 handler ----------
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// ---------- Error handling middleware ----------
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ---------- Start ----------
async function start() {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;

/**
 * Backend Server - Express.js + MongoDB
 * TonysCoin Digital Marketplace API
 * 
 * This file provides the complete backend implementation.
 * Run separately from the frontend with: node server/server.js
 * 
 * Environment variables required:
 * - MONGODB_URI: MongoDB connection string
 * - PINATA_API_KEY: Pinata API key for IPFS uploads
 * - PINATA_SECRET_KEY: Pinata secret key
 * - PORT: Server port (default: 5000)
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { PinataSDK } = require('pinata');
require('dotenv').config();

// Import routes
const ipfsRoutes = require('./routes/ipfs');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tonyscoin-marketplace', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;

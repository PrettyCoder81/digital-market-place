/**
 * Mongoose Models
 * Database schemas for the TonysCoin Digital Marketplace
 */

const mongoose = require('mongoose');

/**
 * User Schema
 * Stores wallet addresses and roles
 */
const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  username: {
    type: String,
    sparse: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

/**
 * ProductMetadata Schema
 * Stores product information synced from blockchain
 */
const productMetadataSchema = new mongoose.Schema({
  productId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  ipfsHash: {
    type: String,
    required: true,
  },
  ipfsUrl: {
    type: String,
    required: true,
  },
  ownerAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  price: {
    type: String, // Stored as string to preserve precision (in TC)
    required: true,
  },
  isListed: {
    type: Boolean,
    default: true,
    index: true,
  },
  txHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

productMetadataSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Transaction Schema
 * Logs all blockchain transactions
 */
const transactionSchema = new mongoose.Schema({
  txHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['CREATE', 'BUY', 'TRANSFER', 'WITHDRAW', 'FEE_UPDATE'],
    required: true,
    index: true,
  },
  productId: {
    type: Number,
    index: true,
  },
  from: {
    type: String,
    required: true,
    lowercase: true,
  },
  to: {
    type: String,
    lowercase: true,
  },
  amount: {
    type: String, // Amount in TC
  },
  blockNumber: {
    type: Number,
  },
  gasUsed: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'confirmed',
  },
});

// Create models
const User = mongoose.model('User', userSchema);
const ProductMetadata = mongoose.model('ProductMetadata', productMetadataSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = {
  User,
  ProductMetadata,
  Transaction,
};

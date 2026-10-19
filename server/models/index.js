const mongoose = require('mongoose');

// user schema
const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    username: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', function (next) {
  this.lastActive = new Date();
  next();
});

// product Meta schema
const productMetadataSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      min: 0,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
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
      match: [/^0x[a-fA-F0-9]{40}$/, 'Invalid owner address'],
    },
    price: {
      type: String, // in TC, stored as string to preserve precision
      required: true,
    },
    imageURI: {
      type: String, // full IPFS URI as stored on-chain
      default: '',
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
  },
  { timestamps: true }
);

// transaction schema
const transactionSchema = new mongoose.Schema(
  {
    txHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['CREATE', 'MINT', 'BUY', 'SELL', 'TRANSFER', 'WITHDRAW', 'FEE_UPDATE', 'LISTING', 'UNLISTING'],
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
      index: true,
    },
    to: {
      type: String,
      lowercase: true,
    },
    amount: {
      type: String, // Amount in TC (string for precision)
      default: '0',
    },
    blockNumber: {
      type: Number,
    },
    gasUsed: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'confirmed',
      index: true,
    },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: 'updatedAt' } }
);

// model creation
const User = mongoose.model('User', userSchema);
const ProductMetadata = mongoose.model('ProductMetadata', productMetadataSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = {
  User,
  ProductMetadata,
  Transaction,
};

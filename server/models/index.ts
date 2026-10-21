import mongoose, { Document, Model, Schema } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
  walletAddress: string;
  role: UserRole;
  username?: string;
  lastActive: Date;
}

export interface IProductMetadata extends Document {
  productId: number;
  name: string;
  description: string;
  ipfsHash: string;
  ipfsUrl: string;
  ownerAddress: string;
  price: string;
  imageURI: string;
  isListed: boolean;
  txHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType =
  | 'CREATE'
  | 'MINT'
  | 'BUY'
  | 'SELL'
  | 'TRANSFER'
  | 'WITHDRAW'
  | 'FEE_UPDATE'
  | 'LISTING'
  | 'UNLISTING';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface ITransaction extends Document {
  txHash: string;
  type: TransactionType;
  productId?: number;
  from: string;
  to?: string;
  amount: string;
  blockNumber?: number;
  gasUsed?: string;
  status: TransactionStatus;
  timestamp: Date;
  updatedAt: Date;
}

export const TRANSACTION_TYPES: TransactionType[] = [
  'CREATE',
  'MINT',
  'BUY',
  'SELL',
  'TRANSFER',
  'WITHDRAW',
  'FEE_UPDATE',
  'LISTING',
  'UNLISTING',
];

const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const userSchema: Schema<IUser> = new Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      match: [walletAddressRegex, 'Invalid wallet address'],
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

const productMetadataSchema: Schema<IProductMetadata> = new Schema(
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
      match: [walletAddressRegex, 'Invalid owner address'],
    },
    price: {
      type: String,
      required: true,
    },
    imageURI: {
      type: String,
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

const transactionSchema: Schema<ITransaction> = new Schema(
  {
    txHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: TRANSACTION_TYPES,
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
      type: String,
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

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export const ProductMetadata: Model<IProductMetadata> = mongoose.model<IProductMetadata>(
  'ProductMetadata',
  productMetadataSchema
);
export const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  'Transaction',
  transactionSchema
);

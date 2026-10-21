import mongoose, { Document, Model, Schema } from 'mongoose';

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

export const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  'Transaction',
  transactionSchema
);

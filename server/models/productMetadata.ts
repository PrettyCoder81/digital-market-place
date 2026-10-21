import mongoose, { Document, Model, Schema } from 'mongoose';

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

const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;

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

export const ProductMetadata: Model<IProductMetadata> = mongoose.model<IProductMetadata>(
  'ProductMetadata',
  productMetadataSchema
);

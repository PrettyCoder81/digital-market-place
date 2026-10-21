import mongoose, { Document, Model, Schema } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
  walletAddress: string;
  role: UserRole;
  username?: string;
  lastActive: Date;
}

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

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

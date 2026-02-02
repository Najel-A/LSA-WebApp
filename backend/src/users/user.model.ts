import { Schema, model, type HydratedDocument } from 'mongoose';

/** User document fields */
export interface IUser {
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Hydrated User document with Mongoose internals */
export type UserDocument = HydratedDocument<IUser>;

/** Public user record (for type references without Mongoose internals) */
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Index for fast email lookups
userSchema.index({ email: 1 });

export const User = model<IUser>('User', userSchema);

/** Convert Mongoose document to plain UserRecord */
export function toUserRecord(doc: UserDocument): UserRecord {
  return {
    id: doc._id.toString(),
    email: doc.email,
    passwordHash: doc.passwordHash,
    createdAt: doc.createdAt,
  };
}

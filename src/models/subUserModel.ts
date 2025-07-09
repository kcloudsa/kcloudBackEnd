import { Schema, model } from 'mongoose';

import { IsubUser } from '../interfaces/IsubUsers';
import { slugify } from '../Utils/slugify';

const subUserSchema = new Schema<IsubUser>({
  id: { type: Schema.Types.ObjectId, required: true },
  superAdminID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    displayName: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      set: slugify,
      lowercase: true,
    },
  },
  contactInfo: {
    email: {
      email: { type: String, required: true },
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
      verificationCode: { type: String },
    },
    phone: {
      countryCode: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
      verificationCode: { type: String },
    },
  },
  premissions: { type: [String], required: true },
  status: { type: String, required: true },
  password: {
    hashed: { type: String, required: true },
    expirationDate: { type: Date, required: true },
  },
  avatar: { type: String },
});

export const SubUserModel = model<IsubUser>('SubUser', subUserSchema);

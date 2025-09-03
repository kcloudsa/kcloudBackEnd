import mongoose, { Schema } from 'mongoose';

import bcrypt from 'bcryptjs';
import Iuser from '../interfaces/Iuser';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ulid } from 'ulid';
import { slugify } from '../Utils/slugify';
const userSchema = new Schema<Iuser>({
  userID: {
    type: String,
    unique: true,
    default: ulid,
  },
  userName: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: false,
      lowercase: true,
    },
  },
  active: { type: Boolean, default: true },
  notes: { type: String },
  userInfo: {
    gender: { type: String, required: true, trim: true },
    nationality: {
      type: String,
      required: true,
      trim: true,
      default: 'Saudi',
    },
    address: {
      city: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
    },
    profilePicture: { type: String },
  },
  role: {
    type: String,
    required: true,
    trim: true,
    default: 'user',
    enum: ['user', 'owner', 'admin', 'demo', 'tenant'],
  },
  historyID: {
    type: Schema.Types.ObjectId,
    ref: 'History',
    required: false,
    default: null,
  },
  contactInfo: {
    email: {
      email: { type: String, required: true, trim: true, unique: true },
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
      verificationCode: { type: String, required: true, trim: true },
    },
    phone: {
      countryCode: { type: String, required: true, trim: true },
      phoneNumber: { type: String, required: true, trim: true, unique: true },
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
      verificationCode: { type: String, required: true, trim: true },
    },
  },
  subscriptionID: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  subUsersIDs: {
    type: [{ type: Schema.Types.ObjectId, ref: 'SubUser' }],
    default: [],
    validate: {
      validator: (v: mongoose.Types.ObjectId[]) =>
        Array.isArray(v) &&
        v.every((id) => mongoose.Types.ObjectId.isValid(id)),
      message: 'Each sub user ID must be a valid ObjectId',
    },
  },
  password: {
    hashed: { type: String, required: true, trim: true },
    expirationDate: { type: Date, required: true },
  },
});

userSchema.pre('save', async function (next) {
  try {
    const self: any = this;

    // Keep slug up to date when name changes or on create
    if (self.isNew || self.isModified('userName.firstName') || self.isModified('userName.lastName')) {
      self.userName.slug = slugify(`${self.userName.firstName} ${self.userName.lastName}`);
    }

    // Hash password only if the plaintext (non-bcrypt) value was set/changed
    if (self.isModified('password.hashed')) {
      const current = self.password?.hashed as string | undefined;
      if (current && !current.startsWith('$2')) {
        self.password.hashed = await bcrypt.hash(current, 12);
      }
    }

    next();
  } catch (err) {
    next(err as any);
  }
});

const UserModel = mongoose.model<Iuser>('User', userSchema);
export default UserModel;

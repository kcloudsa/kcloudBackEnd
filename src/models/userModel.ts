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
  if (!this.isModified('password') || !this.password?.hashed) return next();

  this.userName.slug = slugify(
    `${this.userName.firstName} ${this.userName.lastName}`,
  );

  this.password.hashed = await bcrypt.hash(this.password.hashed, 12);
  next();
});

const UserModel = mongoose.model<Iuser>('User', userSchema);
export default UserModel;

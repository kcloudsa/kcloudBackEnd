import { Schema, model } from 'mongoose';
import { Icontact } from '../interfaces/Icontact';
import { slugify } from '../Utils/slugify';

const contactSchema = new Schema<Icontact>(
  {
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
    description: { type: String, default: '' },
    phone: {
      number: { type: String, required: true },
      countryCode: { type: String, required: true },
    },
    tagID: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
    userID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  },
);
export const ContactsModel = model<Icontact>('Contact', contactSchema);

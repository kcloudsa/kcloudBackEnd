import { Schema, model } from 'mongoose';
import { Itag } from '../interfaces/Itag';
import { slugify } from '../Utils/slugify';

const tagSchema = new Schema<Itag>(
  {
    tagName: {
      name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      slug: {
        type: String,
        required: true,
        unique: true,
        set: slugify,
        lowercase: true,
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  },
);

export const Tag = model<Itag>('Tag', tagSchema);

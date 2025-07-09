import { Document, Schema } from 'mongoose';

export interface Itag extends Document {
  userId: Schema.Types.ObjectId;
  tagName: {
    name: string;
    slug: string;
  };
}

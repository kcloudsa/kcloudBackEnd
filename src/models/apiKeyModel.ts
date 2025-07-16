// models/ApiKeyModel.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKey extends Document {
  key: string;
  label: string;
  active: boolean;
  createdAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
  key: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IApiKey>('ApiKey', ApiKeySchema);

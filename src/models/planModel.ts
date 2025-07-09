import mongoose, { Schema } from 'mongoose';
import { IPlan } from '../interfaces/Iplan';

const PlanSchema = new Schema<IPlan>({
  name: { type: String, required: true },
  interval: { type: String, enum: ['monthly', 'yearly'], required: true },
  price: { type: Number, required: true },
  paymobPriceId: { type: String, required: true },
  features: { type: Schema.Types.Mixed, required: true },
  description: String,
  isActive: { type: Boolean, default: true },
});

export default mongoose.model<IPlan>('Plan', PlanSchema);

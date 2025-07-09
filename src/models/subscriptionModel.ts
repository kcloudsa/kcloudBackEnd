import mongoose, { Schema } from 'mongoose';
import { Isubscription } from '../interfaces/Isubscription';

const SubscriptionSchema = new Schema<Isubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
  paymobSubscriptionId: String,
  status: {
    type: String,
    enum: ['active', 'canceled', 'trialing', 'past_due'],
    default: 'active',
  },
  startedAt: { type: Date, default: Date.now },
  currentPeriodEnd: { type: Date, required: true },
  trialEndsAt: Date,
  cancelAtPeriodEnd: { type: Boolean, default: false },
});

export default mongoose.model<Isubscription>(
  'Subscription',
  SubscriptionSchema,
);

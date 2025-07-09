import mongoose, { Document } from 'mongoose';

export interface Isubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  paymobSubscriptionId?: string;
  status: string; //|'active' | 'canceled' | 'trialing' | 'past_due';
  startedAt: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
  cancelAtPeriodEnd: boolean;
}

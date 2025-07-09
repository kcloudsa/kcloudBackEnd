import { Document } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  interval: 'monthly' | 'yearly';
  price: number;
  paymobPriceId: string; // For paymob billing sync
  features: {
    [key: string]: number | boolean | string;
  };
  description?: string;
  isActive: boolean;
}

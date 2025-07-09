import { Schema, model } from 'mongoose';
import { ISettings } from '../interfaces/Isetting';
const SettingsSchema = new Schema<ISettings>({
  userId: { type: String, required: true, unique: true },
  general: {
    currency: String,
    timezone: String,
    dateFormat: String,
    landingPage: String,
  },
  appearance: {
    language: String,
    theme: String,
    color: String,
    fontSize: String,
  },
  notifications: {
    email: Boolean,
    inApp: Boolean,
    sms: Boolean,
  },
  dataManagement: {
    autoBackup: Boolean,
  },
  branding: {
    logoUrl: String,
    subdomain: String,
  },
  legal: {
    termsAccepted: Boolean,
    cookiePrefs: Boolean,
  },
  dangerZone: {
    subscriptionStatus: String,
  },
});

export const Settings = model<ISettings>('Settings', SettingsSchema);

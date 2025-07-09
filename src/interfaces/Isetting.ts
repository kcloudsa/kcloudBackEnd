import { Document } from 'mongoose';
export interface IGeneral {
  currency: string;
  timezone: string;
  dateFormat: string;
  landingPage: string;
}
export interface IAppearance {
  language: string;
  theme: string;
  color: string;
  fontSize: string;
}
export interface INotifications {
  email: boolean;
  inApp: boolean;
  sms: boolean;
}
export interface IBranding {
  logoUrl?: string;
  subdomain?: string;
}
export interface ILegal {
  termsAccepted: boolean;
  cookiePrefs: boolean;
}
export interface IDangerZone {
  subscriptionStatus: string;
}
export interface ISettings extends Document {
  userId: string;
  general: IGeneral;
  appearance: IAppearance;
  notifications: INotifications;
  dataManagement: {
    autoBackup: boolean;
  };
  branding: IBranding;
  legal: ILegal;
  dangerZone: IDangerZone;
}

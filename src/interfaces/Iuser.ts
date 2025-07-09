import { Document, Types } from 'mongoose';
export interface IContactInfo {
  email: {
    email: string;
    verified: boolean;
    verifiedAt: Date;
    verificationCode: string;
  };
  phone: {
    countryCode: string;
    phoneNumber: string;
    verified: boolean;
    verifiedAt: Date;
    verificationCode: string;
  };
}
export interface IUserTInfo {
  gender: string;
  nationality: string;
  address: {
    city: string;
    country: string;
  };
  profilePicture?: string;
}
export interface IUserName {
  firstName: string;
  lastName: string;
  displayName: string;
  slug?: string; // Optional slug field for URL-friendly names
}
export interface IPassword {
  hashed: string;
  expirationDate: Date;
}
// interface ISuperAdmin {
//   isSub:boolean;
//   superAdminID: string;
//   role: string;
// }
export default interface Iuser extends Document {
  userID?: string;
  userName: IUserName;
  contactInfo: IContactInfo;
  password: IPassword;
  historyID: Types.ObjectId;
  userInfo: IUserTInfo;
  active: boolean;
  notes?: string;
  role: string;
  subUsersIDs: Types.ObjectId[];
  subscriptionID: Types.ObjectId;
}

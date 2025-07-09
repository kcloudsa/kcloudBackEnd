import { Document, Schema } from 'mongoose';
import { IUserName } from './Iuser';

export interface Iphone {
  number: string;
  countryCode: string;
}

export interface Icontact extends Document {
  name: IUserName;
  description?: string;
  phone: Iphone;
  tagID: Schema.Types.ObjectId;
  userID: Schema.Types.ObjectId;
}

import { Document, Schema } from 'mongoose';
import { IContactInfo, IPassword, IUserName } from './Iuser';

export interface IsubUser extends Document {
  superAdminID: Schema.Types.ObjectId; // Reference to the super admin
  id: Schema.Types.ObjectId;
  name: IUserName;
  contactInfo: IContactInfo;
  premissions: string[];
  //   templates: string[]; // Array of template IDs
  status: string; //'active' | 'inactive' | 'suspended';
  password: IPassword;
  avatar?: string; // Optional avatar field
}

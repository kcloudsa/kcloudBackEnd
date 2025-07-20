import { Document } from 'mongoose';
export interface IrentalSource extends Document {
  SourceName: string; //[//   "Booking",//   "Gather Inn",//   "Overnight stay",//   "Real estate",//   "Auction",//   "Airbnb",//   "Rent",//   "WhatsApp"// ]
  description?: string;
}

import { Document } from 'mongoose';
export interface IrentalSource extends Document {
  name: string; //[//   "Booking",//   "Gather Inn",//   "Overnight stay",//   "Real estate",//   "Auction",//   "Airbnb",//   "Rent",//   "WhatsApp"// ]
  description?: string;
}

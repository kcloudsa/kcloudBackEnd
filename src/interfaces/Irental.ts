import { Document, Schema } from 'mongoose';

interface IperiodicIncrease {
  increaseValue: number;
  periodicDuration: number;
  isPercentage: boolean;
}

interface Iparticipats {
  owner: {
    userID: Schema.Types.ObjectId;
    role: 'owner';
  };
  tentant: {
    userID: Schema.Types.ObjectId;
    role: 'tentant';
  };
}

export interface Irental extends Document {
  unitID: Schema.Types.ObjectId; // Reference to the unit
  contractNumber: string; // Unique contract number
  moveTypeID: Schema.Types.ObjectId; // Reference to the move type
  startDate: Date; // Start date of the rental
  endDate: Date; // End date of the rental
  rentalSourceID: Schema.Types.ObjectId; // Reference to the rental source
  startPrice: number; // Price at the start of the rental
  currentPrice: number; // Current price of the rental status: string; // Status of the rental, e.g., 'active', 'completed', 'cancelled'
  securityDeposit: number; // Security deposit amount
  rentalAmount: number; // Total rental amount
  isMonthly: boolean; // Indicates if the rental is monthly
  monthsCount: number; // Number of months for the rental
  roommates: number; // Number of roommates
  status: string; // Status of the rental, e.g., 'active', 'completed', 'cancelled'
  notes: string;
  periodicIncrease: IperiodicIncrease; // Periodic increase details
  participats: Iparticipats;
}

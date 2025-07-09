import { Schema, model } from 'mongoose';
import { Irental } from '../interfaces/Irental';

const rentalSchema = new Schema<Irental>(
  {
    unitID: { type: Schema.Types.ObjectId, required: true, ref: 'Unit' },
    contractNumber: { type: String, required: true },
    moveTypeID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'MoveType',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rentalSourceID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'RentalSource',
    },
    startPrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    }, // e.g., 'active', 'completed', 'cancelled'
    securityDeposit: { type: Number, required: true },
    rentalAmount: { type: Number, required: true },
    isMonthly: { type: Boolean, default: false },
    monthsCount: { type: Number, default: 0 },
    roommates: { type: Number, default: 0 },
    notes: { type: String },
    periodicIncrease: {
      increaseValue: { type: Number },
      periodicDuration: { type: Number },
      isPercentage: { type: Boolean },
    },
    participats: {
      owner: {
        userID: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['owner'], default: 'owner' },
      },
      tentant: {
        userID: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['tentant'], default: 'tentant' },
      },
    },
  },
  {
    timestamps: true,
  },
);

// 2 - Virtual: endDate (calculated)
rentalSchema.virtual('endDate').get(function () {
  if (this.isMonthly) {
    if (!this.startDate || !this.monthsCount) return null;

    const end = new Date(this.startDate);
    end.setMonth(end.getMonth() + this.monthsCount);
    return end;
  } else {
    return this.endDate;
  }
});

// 3 - Virtual: status (based on dynamic endDate)
rentalSchema.virtual('status').get(function () {
  if (this.isMonthly) {
    if (this.status === 'inactive') return 'inactive';
    const today = new Date();
    const end = new Date(this.startDate);
    end.setMonth(end.getMonth() + this.monthsCount);
    return end < today ? 'terminated' : 'active';
  } else {
    return this.status;
  }
});

// 4 - Virtual: restMonthsLeft (real-time remaining months)
rentalSchema.virtual('restMonthsLeft').get(function () {
  if (!this.isMonthly) return 0; // If not monthly, no remaining months
  if (!this.startDate || !this.monthsCount) return 0;
  const today = new Date();
  const start = new Date(this.startDate);
  if (today < start) return this.monthsCount;
  const diffYears = today.getFullYear() - start.getFullYear();
  const diffMonths = today.getMonth() - start.getMonth();
  const passedMonths = diffYears * 12 + diffMonths;
  const rest = this.monthsCount - passedMonths;
  return rest < 0 ? 0 : rest;
});
export const RentalModel = model<Irental>('Rental', rentalSchema);

//const rental = await RentalModel.findById(rentalId).lean({ virtuals: true });

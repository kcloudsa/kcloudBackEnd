import { Schema, model } from 'mongoose';
import { Irental } from '../interfaces/Irental';
import {
  calcFixedIncreaseRent,
  calculateTotalRentInPercentage,
} from '../Utils/calculateTotalRent';
function calculateDerivedFields(doc: any) {
  if (!doc) return;

  // 1 - endDateCalc
  if (doc.isMonthly && doc.startDate && doc.monthsCount) {
    const end = new Date(doc.startDate);
    end.setMonth(end.getMonth() + doc.monthsCount);
    doc.endDate = end;
  } else {
    doc.endDate;
  }

  // 2 - rentalStatus
  if (doc.isMonthly) {
    const today = new Date();
    if (!doc.startDate || !doc.monthsCount) {
      doc.rentalStatus = doc.status || 'inactive';
    } else {
      const end = new Date(doc.startDate);
      end.setMonth(end.getMonth() + doc.monthsCount);
      doc.rentalStatus = end < today ? 'terminated' : 'active';
    }
  } else {
    doc.rentalStatus;
  }

  // 3 - restMonthsLeft
  if (!doc.isMonthly || !doc.startDate || !doc.monthsCount) {
    doc.restMonthsLeft = 0;
  } else {
    const today = new Date();
    const start = new Date(doc.startDate);
    if (today < start) {
      doc.restMonthsLeft = doc.monthsCount;
    } else {
      const diffYears = today.getFullYear() - start.getFullYear();
      const diffMonths = today.getMonth() - start.getMonth();
      const passedMonths = diffYears * 12 + diffMonths;
      const rest = doc.monthsCount - passedMonths;
      doc.restMonthsLeft = rest < 0 ? 0 : rest;
    }
  }
}

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
    endDate: { type: Date },
    rentalSourceID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'RentalSource',
    },
    startPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, min: 0 },
    securityDeposit: { type: Number, required: true, min: 0 },
    rentalAmount: { type: Number, required: true, min: 0 },
    isMonthly: { type: Boolean, default: false },
    monthsCount: { type: Number, default: 0, min: 0 },
    roommates: { type: Number, default: 0, min: 0 },
    notes: { type: String },
    periodicIncrease: {
      increaseValue: { type: Number },
      periodicDuration: { type: Number },
      isPercentage: { type: Boolean },
    },
    specialPrices: [
      {
        type: {
          type: String,
          enum: ['weekly', 'once', 'monthly'],
          required: true,
        },
        // For `weekly` type
        dayOfWeek: {
          type: String,
          enum: [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ],
        },

        // For `once` type
        date: Date,

        // Special price
        price: { type: Number, required: true, min: 0 },
      },
    ],
    participats: {
      owner: {
        userID: { type: String },
        role: { type: String, enum: ['owner'], default: 'owner' },
      },
      tentant: {
        userID: { type: String },
        role: { type: String, enum: ['tentant'], default: 'tentant' },
      },
    },
    rentalStatus: {
      type: String,
      enum: ['active', 'terminated', 'inactive', 'completed', 'cancelled'],
    },
    restMonthsLeft: { type: Number },
  },
  {
    timestamps: true,
  },
);
rentalSchema.pre('save', function (next) {
  if (
    (this.isNew && this.currentPrice === undefined) ||
    this.currentPrice === null
  ) {
    this.currentPrice = this.startPrice;
  }
  if (this.isMonthly && this.startDate && this.monthsCount) {
    const end = new Date(this.startDate);
    end.setMonth(end.getMonth() + this.monthsCount);
    this.endDate = end;
  } else {
    this.endDate;
  }
  if (
    this.startPrice &&
    this.periodicIncrease != null &&
    this.periodicIncrease?.isPercentage
  ) {
    if (
      this.startPrice &&
      this.periodicIncrease != null &&
      this.periodicIncrease?.increaseValue
    ) {
      this.rentalAmount = calculateTotalRentInPercentage(
        this.startPrice,
        this.periodicIncrease?.increaseValue,
        this.periodicIncrease?.periodicDuration,
      );
    } else {
      this.rentalAmount = this.startPrice;
    }
  } else {
    if (
      this.startPrice &&
      this.periodicIncrease != null &&
      this.periodicIncrease.increaseValue
    ) {
      this.rentalAmount = calcFixedIncreaseRent(
        this.startPrice,
        this.periodicIncrease.increaseValue,
        this.periodicIncrease.periodicDuration,
      );
    } else {
      this.rentalAmount = this.startPrice;
    }
  }
  next();
});
rentalSchema.post('find', function (docs) {
  for (const doc of docs) {
    calculateDerivedFields(doc);
  }
});

// Apply logic after .findOne() or .findById()
rentalSchema.post('findOne', function (doc) {
  calculateDerivedFields(doc);
});

rentalSchema.post('findOneAndUpdate', function (doc) {
  calculateDerivedFields(doc);
});

export const RentalModel = model<Irental>('Rental', rentalSchema);

//const rental = await RentalModel.findById(rentalId).lean({ virtuals: true });

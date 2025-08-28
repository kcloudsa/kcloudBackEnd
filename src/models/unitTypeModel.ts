import { Schema, model, Types } from 'mongoose';
import { IunitType } from '../interfaces/IunitType';

const unitTypeSchema = new Schema<IunitType>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new Types.ObjectId(), // Auto-generate if not provided
    },
    type: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

export const UnitTypeModel = model<IunitType>('UnitType', unitTypeSchema);

// Initialize default unit types
const initializeUnitTypes = async () => {
  try {
    const existingCount = await UnitTypeModel.countDocuments();
    
    if (existingCount === 0) {
      const defaultTypes = [
        { _id: new Types.ObjectId('000000000000000000000001'), type: 'room' },
        { _id: new Types.ObjectId('000000000000000000000002'), type: 'apartment' },
        { _id: new Types.ObjectId('000000000000000000000003'), type: 'studio' },
        { _id: new Types.ObjectId('000000000000000000000004'), type: 'Restroom' },
        { _id: new Types.ObjectId('000000000000000000000005'), type: 'Villa' },
        { _id: new Types.ObjectId('000000000000000000000006'), type: 'farm' },
      ];
      
      await UnitTypeModel.insertMany(defaultTypes);
      console.log('Default unit types initialized');
    }
  } catch (error) {
    console.error('Error initializing unit types:', error);
  }
};

// Call this function when your application starts
initializeUnitTypes();

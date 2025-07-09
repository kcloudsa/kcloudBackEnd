import { Document, Schema } from 'mongoose';
export interface Igeo {
  latitude: number;
  longitude: number;
  //   accuracy?: number; // Optional, for accuracy of the geolocation
  //   altitude?: number; // Optional, for altitude information
  //   speed?: number; // Optional, for speed if applicable
  //   timestamp?: Date; // Optional, for when the location was recorded
}
export interface Ilocation {
  address: string;
  city: string;
  country: string;
  geo?: Igeo; // Optional, for geolocation
}

export interface IUnit extends Document {
  uniteGroupID: Schema.Types.ObjectId;
  userID: Schema.Types.ObjectId;
  unitTypeID: Schema.Types.ObjectId;
  number: string;
  description?: string;
  notes?: string;
  processingCost: number; // Cost associated with processing this unit
  location: Ilocation; // Optional, for storing location information
  baseUnit: string; // The base unit for this type (e.g., 'meter' for length)
  unitMedia?: string[];
  favorite: boolean;
  unitStatus: string; // ["available", "Reserved", "Under_maintenance"]
}

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import UserModel from '../../models/userModel';
import Iuser from '../../interfaces/Iuser';
import { createRentalSchema } from '../../validation/rentals';
import { UnitModel } from '../../models/unitModel';
import { MoveTypeModel } from '../../models/moveTypeModel';
import { ImoveType } from '../../interfaces/ImoveType';
import { RentalModel } from '../../models/rentalModel';
import { IrentalSource } from '../../interfaces/IrentalSource';
import { RentalSourceModel } from '../../models/rentalSourceModel';
import { Types } from 'mongoose';
import { recordHistory } from '../../Utils/recordHistory';
export const nameRental = asyncHandler(async (req: Request, res: Response) => {
  try {
    const emojis = ['yahia', '😀', '😳', '🙄'];
    res.json(emojis);
  } catch (error) {
    console.error('Error fetching emojis:', error);
    res.status(500).json({ message: 'Failed to fetch emojis', error });
  }
});
export const createRental = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const parsed = createRentalSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten(),
        });
        return;
      }
      const data = parsed.data; // Now fully typed and safe!
      const {
        userID,
        moveTypeID,
        rentalSourceID,
        contractNumber,
        unitID,
        startDate,
        participats,
      } = req.body;
      // Assuming you have a way to fetch the user by ID
      const user: Iuser | null = await UserModel.findOne({
        userID,
      });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Assuming you have a way to fetch the user by ID
      const moveType: ImoveType | null = await MoveTypeModel.findById(
        moveTypeID,
      );
      if (!moveType) {
        res.status(404).json({ message: 'moveType not found' });
        return;
      }
      const RentalSource: IrentalSource | null =
        await RentalSourceModel.findById(rentalSourceID);
      if (!RentalSource) {
        res.status(404).json({ message: 'RentalSource not found' });
        return;
      }

      // Check if unit already exists
      const existingRental = await RentalModel.findOne({
        contractNumber,
        moveTypeID,
        unitID,
        startDate,
        'participats.owner.userID': participats?.owner?.userID,
        'participats.tentant.userID': participats?.tentant?.userID,
      });
      if (existingRental) {
        res.status(400).json({
          message: 'A rental with this configuration already exists',
        });

        return;
      }
      const newRental = await RentalModel.create(data);
      if (!newRental) {
        res.status(400).json({ message: 'Failed to create rental ' });
        return;
      }
      await recordHistory({
        table: 'Unit',
        documentId: newRental._id as Types.ObjectId,
        action: 'create', // or 'update' based on your logic
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
          role: user.role,
        },
        diff: newRental.toObject(), // Assuming you want to log the entire user object
        reason: 'User create new unit', // optional
      });
      res.status(201).json({
        message: 'rental created successfully',
        unit: newRental,
      });
    } catch (error) {
      console.error('Error creating rental:', error);
      res.status(500).json({ message: 'Failed to create rental', error });
    }
  },
);
export const getAllRentals = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const rentals = await RentalModel.find();
      res.json(rentals);
      return;
    } catch (error) {
      console.error('Error fetching unit types:', error);
      res.status(500).json({ message: 'Failed to fetch unit types', error });
      return;
    }
  },
);

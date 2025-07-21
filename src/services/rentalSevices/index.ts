import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import UserModel from '../../models/userModel';
import Iuser from '../../interfaces/Iuser';
import { createRentalSchema } from '../../validation/rentals';
import { MoveTypeModel } from '../../models/moveTypeModel';
import { ImoveType } from '../../interfaces/ImoveType';
import { RentalModel } from '../../models/rentalModel';
import { IrentalSource } from '../../interfaces/IrentalSource';
import { RentalSourceModel } from '../../models/rentalSourceModel';
import mongoose, { Types } from 'mongoose';
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
        rentalID,
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

      // Check if rental already exists
      const existingRental = await RentalModel.findOne({
        contractNumber,
        moveTypeID,
        rentalID,
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
        table: 'rental',
        documentId: newRental._id as Types.ObjectId,
        action: 'create', // or 'update' based on your logic
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
          role: user.role,
        },
        diff: newRental.toObject(), // Assuming you want to log the entire user object
        reason: 'User create new rental', // optional
      });
      res.status(201).json({
        message: 'rental created successfully',
        rental: newRental,
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
      console.error('Error fetching rental types:', error);
      res.status(500).json({ message: 'Failed to fetch rental types', error });
      return;
    }
  },
);
export const getRentalByID = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const rentalId = req.params.id;
      if (!rentalId) {
        res.status(400).json({ message: 'Rental ID is required' });
        return;
      }
      if (!mongoose.Types.ObjectId.isValid(rentalId)) {
        res.status(400).json({ message: 'Invalid rental ID format' });
        return;
      }
      const rental = await RentalModel.findById(rentalId);
      console.log('rental', rental);
      if (!rental) {
        res.status(404).json({ message: 'rental not found' });
        return;
      }

      res.json(rental);
      return;
    } catch (error) {
      console.error('Error fetching rental types:', error);
      res.status(500).json({ message: 'Failed to fetch rental types', error });
      return;
    }
  },
);
export const deleteRental = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.body.userID;
      // Assuming you have a way to fetch the user by ID
      const user: Iuser | null = await UserModel.findOne({ userID: userId });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      const rentalId = req.params.id;
      if (!rentalId) {
        res.status(400).json({ message: 'Rental ID is required' });
        return;
      }
      if (!mongoose.Types.ObjectId.isValid(rentalId)) {
        res.status(400).json({ message: 'Invalid rental ID format' });
        return;
      }
      const deletedrental = await RentalModel.findByIdAndDelete(rentalId);
      if (!deletedrental) {
        res.status(404).json({ message: 'rental not found' });
        return;
      }
      await recordHistory({
        table: 'rental',
        documentId: deletedrental._id as Types.ObjectId,
        action: 'delete', // or 'update' based on your logic
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
          role: user.role,
        },
        diff: deletedrental.toObject(), // Assuming you want to log the entire user object
        reason: 'User delete rental', // optional
      });
      res.json({
        message: 'rental deleted successfully',
        rental: deletedrental,
      });
      return;
    } catch (error) {
      console.error('Error fetching rental :', error);
      res.status(500).json({ message: 'Failed to fetch rental ', error });
      return;
    }
  },
);

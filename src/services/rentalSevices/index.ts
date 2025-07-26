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
import { deepMerge } from '../../Utils/deepMerge';
import { getDeepDiff } from '../../Utils/deepDiff';
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
      const {
        userID,
        moveTypeID,
        rentalSourceID,
        contractNumber,
        startDate,
        participats,
        monthsCount,
        isMonthly,
        endDate,
        unitID,
      } = req.body;
      const parsed = createRentalSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten(),
        });
        return;
      }
      const isMonthlyMode = isMonthly && monthsCount;
      const hasEndDate = !!endDate;

      if (!isMonthlyMode && !hasEndDate) {
        res.status(400).json({
          message:
            'You must set both isMonthly and monthsCount, or provide an endDate.',
        });
        return;
      }
      const rentalStart = new Date(startDate);
      let rentalEnd: Date | null = endDate ? new Date(endDate) : null;
      rentalStart.setHours(0, 0, 0, 0);
      rentalEnd?.setHours(0, 0, 0, 0);
      if (endDate) {
        rentalEnd = new Date(endDate);
      } else if (isMonthly && monthsCount) {
        rentalEnd = new Date(rentalStart);
        rentalEnd.setMonth(rentalEnd.getMonth() + monthsCount);
      } else {
        res.status(400).json({ message: 'Cannot determine rental end date.' });
        return;
      }
      if (rentalEnd <= rentalStart) {
        res.status(400).json({
          message: 'endDate must be after startDate',
        });
        return;
      }
      // Check for overlapping rentals for the same unit (rentalID)
      const overlappingRental = await RentalModel.findOne({
        unitID,
        $and: [
          { startDate: { $lte: rentalEnd } },
          { endDate: { $gte: rentalStart } },
        ],
      });

      if (overlappingRental) {
        console.log('Overlapping rental found:', overlappingRental);
        res.status(400).json({
          message:
            'This unit already has a rental during the specified period.',
        });
        return;
      }
      const data = parsed.data; // Now fully typed and safe!
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
        moveTypeID,
        unitID,
        startDate,
        'participats.owner.userID': participats?.owner?.userID,
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
export const updateRental = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.body.userID;
      // Assuming you have a way to fetch the user by ID
      const user: Iuser | null = await UserModel.findOne({
        userID: userId,
      });
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
      const existingDoc = await RentalModel.findById(rentalId);
      if (!existingDoc) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }
      const updateData = req.body;
      const mergedData = deepMerge(existingDoc.toObject(), updateData);

      const diff = getDeepDiff(existingDoc.toObject(), mergedData);
      // Find and update the notification
      if (!diff || Object.keys(diff).length === 0) {
        res.status(400).json({ message: 'No changes detected' });
        return;
      }
      const rental = await RentalModel.findByIdAndUpdate(rentalId, req.body, {
        new: true,
        runValidators: true,
      })
        .populate('moveTypeID')
        .populate('rentalSourceID')
        .populate('participats.owner.userID')
        .populate('participats.tentant.userID');
      if (!rental) {
        res.status(404).json({ message: 'rental not found' });
        return;
      }
      await recordHistory({
        table: 'rental',
        documentId: rental._id as Types.ObjectId,
        action: 'update', // or 'update' based on your logic
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
          role: user.role,
        },
        diff, // Assuming you want to log the entire user object
        reason: 'User update rental', // optional
      });
      res.json({
        message: 'rental updated successfully',
        rental,
      });
      return;
    } catch (error) {
      console.error('Error updating rental:', error);
      res.status(500).json({ message: 'Failed to update rental', error });
      return;
    }
  },
);

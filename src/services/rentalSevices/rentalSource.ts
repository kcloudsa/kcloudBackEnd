import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { createMoveTypeSchema } from '../../validation/moveType';
import { MoveTypeModel } from '../../models/moveTypeModel';
import { recordHistory } from '../../Utils/recordHistory';
import Iuser from '../../interfaces/Iuser';
import UserModel from '../../models/userModel';
import { Types } from 'mongoose';
import { RentalSourceModel } from '../../models/rentalSourceModel';
import { createRentalSourceSchema } from '../../validation/rentalSource';

export const namerentalSource = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const emojis = ['yahia', '😀', '😳', '🙄'];
      res.json(emojis);
    } catch (error) {
      console.error('Error fetching emojis:', error);
      res.status(500).json({ message: 'Failed to fetch emojis', error });
    }
  },
);

export const getRentalSources = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const rentalSource = await RentalSourceModel.find();
      res.json(rentalSource);
      return;
    } catch (error) {
      console.error('Error fetching unit types:', error);
      res.status(500).json({ message: 'Failed to fetch unit types', error });
      return;
    }
  },
);

export const createRentalSource = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { userID, SourceName, description } = req.body;
      // Assuming you have a way to fetch the user by ID
      const user: Iuser | null = await UserModel.findOne({ userID });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (!SourceName) {
        res.status(404).json({ message: 'SourceName not found' });
        return;
      }
      const existingRentalSource = await RentalSourceModel.findOne({
        SourceName,
      });
      if (existingRentalSource) {
        res.status(400).json({ message: 'Source Name already exists' });
        return;
      }

      const parsed = createRentalSourceSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten(),
        });
        return;
      }
      const newRentalSource = await RentalSourceModel.create({
        SourceName,
        description,
      });
      await recordHistory({
        table: 'RentalSource',
        documentId: newRentalSource._id as Types.ObjectId,
        action: 'create', // or 'update' based on your logic
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
          role: user.role,
        },
        diff: newRentalSource.toObject(), // Assuming you want to log the entire user object
        reason: 'User create new Move type', // optional
      });
      res.status(201).json({
        message: 'Move type created successfully',
        unitType: newRentalSource,
      });

      return;
    } catch (error) {
      console.error('Error fetching emojis:', error);
      res.status(500).json({ message: 'Failed to fetch emojis', error });
      return;
    }
  },
);

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { createMoveTypeSchema } from '../../validation/moveType';
import { MoveTypeModel } from '../../models/moveTypeModel';
import { recordHistory } from '../../Utils/recordHistory';
import Iuser from '../../interfaces/Iuser';
import UserModel from '../../models/userModel';
import { Types } from 'mongoose';

export const nameMoveType = asyncHandler(
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

export const getmoveTypes = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const moveTypes = await MoveTypeModel.find();
      res.json(moveTypes);
      return;
    } catch (error) {
      console.error('Error fetching unit types:', error);
      res.status(500).json({ message: 'Failed to fetch unit types', error });
      return;
    }
  },
);

export const createMoveType = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.body.userID;
      // Assuming you have a way to fetch the user by ID
      const user: Iuser | null = await UserModel.findOne({ userID: userId });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      const type = req.body.type;
      if (!type) {
        res.status(404).json({ message: 'type not found' });
        return;
      }
      const existingUnitType = await MoveTypeModel.findOne({
        type: type,
      });
      if (existingUnitType) {
        res.status(400).json({ message: 'Move type already exists' });
        return;
      }

      const parsed = createMoveTypeSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten(),
        });
        return;
      }
      const newMoveType = await MoveTypeModel.create({
        type: type,
      });
      await recordHistory({
        table: 'MoveType',
        documentId: newMoveType._id as Types.ObjectId,
        action: 'create', // or 'update' based on your logic
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
          role: user.role,
        },
        diff: newMoveType.toObject(), // Assuming you want to log the entire user object
        reason: 'User create new Move type', // optional
      });
      res.status(201).json({
        message: 'Move type created successfully',
        unitType: newMoveType,
      });

      return;
    } catch (error) {
      console.error('Error fetching emojis:', error);
      res.status(500).json({ message: 'Failed to fetch emojis', error });
      return;
    }
  },
);

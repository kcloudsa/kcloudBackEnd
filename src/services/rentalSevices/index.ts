import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import UserModel from '../../models/userModel';
import Iuser from '../../interfaces/Iuser';
import { createRentalSchema } from '../../validation/rentals';
import { UnitModel } from '../../models/unitModel';
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
      const userId = req.body.userID;
      // Assuming you have a way to fetch the user by ID
      const user: Iuser | null = await UserModel.findOne({
        userID: userId,
      });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      const parsed = createRentalSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten(),
        });
        return;
      }
      const data = parsed.data; // Now fully typed and safe!
      // Check if unit already exists
      const existingUnit = await UnitModel.findOne({});
      if (existingUnit) {
        res.status(400).json({
          message:
            'Unit with this number in same uniteGroup already exists in the group',
        });
        return;
      }
      // Create unit payload
      const unitPayload = {};
      const newUnit = await UnitModel.create(unitPayload);
      if (!newUnit) {
        res.status(400).json({ message: 'Failed to create unit' });
        return;
      }
      //   await recordHistory({
      //     table: 'Unit',
      //     documentId: newUnit._id as Types.ObjectId,
      //     action: 'create', // or 'update' based on your logic
      //     performedBy: {
      //       userId: user._id as Types.ObjectId,
      //       name: user.userName.slug,
      //       role: user.role,
      //     },
      //     diff: newUnit.toObject(), // Assuming you want to log the entire user object
      //     reason: 'User create new unit', // optional
      //   });
      res.status(201).json({
        message: 'Unit created successfully',
        unit: newUnit,
      });
    } catch (error) {
      console.error('Error creating unit:', error);
      res.status(500).json({ message: 'Failed to create unit', error });
    }
  },
);

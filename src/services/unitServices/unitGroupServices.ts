import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { UnitGroupModel } from '../../models/unitGroupModel';
import { createUintGroupsSchema } from '../../validation/unitGroups';
import { Types } from 'mongoose';
import { recordHistory } from '../../Utils/recordHistory';
import UserModel from '../../models/userModel';
import { getDeepDiff } from '../../Utils/deepDiff';
import { deepMerge } from '../../Utils/deepMerge';
import Iuser from '../../interfaces/Iuser';

export const nameUnitGroup = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const emojis = ['yahia', '😀', '😳', '🙄'];

      res.json(emojis);
      return;
    } catch (error) {
      console.error('Error fetching emojis:', error);
      res.status(500).json({ message: 'Failed to fetch emojis', error });
      return;
    }
  },
);

export const getAllUnitGroups = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const groups = await UnitGroupModel.find({});
      if (!groups || groups.length === 0) {
        res.status(200).json({ message: 'No unit groups found', data: [] });
        return;
      }
      res.status(200).json(groups);
      return;
    } catch (error) {
      console.error('Error fetching unit groups:', error);
      res.status(500).json({ message: 'Failed to fetch unit groups', error });
    }
  },
);

export const createUnitGroup = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { name, description, unitGroupStatus } = req.body;
      // Use authenticated user from Passport (req.user)
      const user = (req.user as any) as Iuser | undefined;
      if (!user || !name) {
        res.status(400).json({ message: 'User and name are required' });
        return;
      }
      const parsed = createUintGroupsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten(),
        });
        return;
      }
  // ensure user exists in DB (optional)
      const dbUser = await UserModel.findOne({ userID: user.userID }) || (user as any);
      if (!dbUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      // Check if the unit group already exists
      const existingGroup = await UnitGroupModel.findOne({
        name: name,
        userID: user._id,
      });
      if (existingGroup) {
        res.status(400).json({ message: 'Unit group already exists' });
        return;
      }

      // Create the new unit group
      const newGroup = new UnitGroupModel({
        userID: user._id as Types.ObjectId,
        name,
        description: description || '',
        unitGroupStatus: unitGroupStatus || 'active',
      });
      const savedGroup = await newGroup.save();
      if (!savedGroup) {
        res.status(500).json({ message: 'Failed to create unit group' });
        return;
      }

      await recordHistory({
        table: 'UnitGroups',
        documentId: savedGroup._id as Types.ObjectId,
        action: 'create', // or 'update' based on your logic
        performedBy: {
          userId: dbUser._id as Types.ObjectId,
          name: (dbUser.userName && (dbUser.userName.slug || dbUser.userName.displayName)) || dbUser.name || dbUser.email,
          role: dbUser.role,
        },
        diff: savedGroup.toObject(), // Assuming you want to log the entire user object
        reason: 'User create new unit type', // optional
      });
      res.status(201).json(savedGroup);
      return;
    } catch (error) {
      console.error('Error creating unit group:', error);
      res.status(500).json({ message: 'Failed to create unit group', error });
    }
  },
);

export const getUnitGroupById = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'Unit group ID is required' });
        return;
      }
      const group = await UnitGroupModel.findById(id);
      if (!group) {
        res.status(404).json({ message: 'Unit group not found' });
        return;
      }
      res.status(200).json(group);
      return;
    } catch (error) {
      console.error('Error fetching unit group:', error);
      res.status(500).json({ message: 'Failed to fetch unit group', error });
    }
  },
);

export const updateUnitGroup = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
  const { id } = req.params;
  const { name, description, unitGroupStatus } = req.body;
  const userID = req.body.userID || (req.user as any)?.userID || (req.user as any)?._id?.toString();
      if (!id) {
        res.status(400).json({ message: 'Unit group ID is required' });
        return;
      }
      if (!name && !description && !unitGroupStatus) {
        res.status(400).json({
          message:
            'At least one field (name, description, unitGroupStatus) is required for update',
        });

        return;
      }
  const user = (req.user as any) as Iuser | undefined;
      if (!user) {
        res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        return;
      }
      const existingGroup = await UnitGroupModel.findById(id);
      if (!existingGroup) {
        res.status(404).json({ message: 'Unit group not found' });
        return;
      }

      const deepMerg = deepMerge(existingGroup.toObject(), {
        name,
        description,
        unitGroupStatus,
      });

      const diff = getDeepDiff(existingGroup.toObject(), {
        name: deepMerg.name,
        description: deepMerg.description,
        unitGroupStatus: deepMerg.unitGroupStatus,
      });
      if (!diff || Object.keys(diff).length === 0) {
        res.status(400).json({ message: 'No changes detected' });
        return;
      }

      const updatedGroup = await UnitGroupModel.findByIdAndUpdate(
        id,
        {
          name,
          description,
          unitGroupStatus,
        },
        { new: true },
      );
      if (!updatedGroup) {
        res.status(404).json({ message: 'Unit group not found' });
        return;
      }

      const dbUser = await UserModel.findOne({ userID: user.userID }) || (user as any);
      await recordHistory({
        table: 'UnitGroups',
        documentId: updatedGroup._id as Types.ObjectId,
        action: 'update', // or 'create' based on your logic
        performedBy: {
          userId: dbUser._id as Types.ObjectId,
          name: (dbUser.userName && (dbUser.userName.slug || dbUser.userName.displayName)) || dbUser.name || dbUser.email,
          role: dbUser.role,
        },
        diff, // Assuming you want to log the entire user object
        reason: 'User updated unit group', // optional
      });
      res.status(200).json(updatedGroup);
      return;
    } catch (error) {
      console.error('Error updating unit group:', error);
      res.status(500).json({ message: 'Failed to update unit group', error });
    }
  },
);

export const deleteUnitGroup = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'Unit group ID is required' });
        return;
      }
      const deletedGroup = await UnitGroupModel.findByIdAndDelete(id);
      if (!deletedGroup) {
        res.status(404).json({ message: 'Unit group not found' });
        return;
      }
  const user = await UserModel.findOne({ userID: deletedGroup.userID }) || (req.user as any);
      if (!user) {
        res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        return;
      }
      await recordHistory({
        table: 'UnitGroups',
        documentId: deletedGroup._id as Types.ObjectId,
        action: 'delete',
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: (user.userName && (user.userName.slug || user.userName.displayName)) || user.name || user.email,
          role: user.role,
        },
        diff: deletedGroup.toObject(),
        reason: 'User deleted unit group', // optional
      });
      res.status(200).json({ message: 'Unit group deleted successfully' });
      return;
    } catch (error) {
      console.error('Error deleting unit group:', error);
      res.status(500).json({ message: 'Failed to delete unit group', error });
    }
  },
);

import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { UnitGroupModel } from '../../models/unitGroupModel';
import { createUintGroupsSchema } from '../../validation/unitGroups';
import { Types } from 'mongoose';
import { recordHistory } from '../../Utils/recordHistory';
import UserModel from '../../models/userModel';
import { getDeepDiff } from '../../Utils/deepDiff';
import { deepMerge } from '../../Utils/deepMerge';

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
      const { userID, name, description, unitGroupStatus } = req.body;
      // Validate required fields
      if (!userID || !name) {
        res.status(400).json({ message: 'User ID and name are required' });
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
      const user = await UserModel.findOne({ userID });
      if (!user) {
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
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
          role: user.role,
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
      const { name, description, unitGroupStatus, userID } = req.body;
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
      const user = await UserModel.findOne({ userID });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
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

      await recordHistory({
        table: 'UnitGroups',
        documentId: updatedGroup._id as Types.ObjectId,
        action: 'update', // or 'create' based on your logic
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
          role: user.role,
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
      const user = await UserModel.findOne({ userID: deletedGroup.userID });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      await recordHistory({
        table: 'UnitGroups',
        documentId: deletedGroup._id as Types.ObjectId,
        action: 'delete',
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
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

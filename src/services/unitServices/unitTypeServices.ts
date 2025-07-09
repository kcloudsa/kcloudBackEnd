import { Response, Request } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { UnitTypeModel } from '../../models/unitTypeModel';
import { recordHistory } from '../../Utils/recordHistory';
import { Types } from 'mongoose';
import Iuser from '../../interfaces/Iuser';
import UserModel from '../../models/userModel';
import { createUintTypeSchema } from '../../validation/unitTypies';

export const nameUnitType = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const emojis = ['yahia', '😀', '😳', '🙄'];
      console.log('ddddddd');
      res.json(emojis);
      return;
    } catch (error) {
      console.error('Error fetching emojis:', error);
      res.status(500).json({ message: 'Failed to fetch emojis', error });
      return;
    }
  },
);

export const createUnitType = expressAsyncHandler(
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
        res.status(400).json({ message: 'Unit type is required' });
        return;
      }
      console.log('type', type);
      const existingUnitType = await UnitTypeModel.findOne({
        type: type,
      });
      if (existingUnitType) {
        res.status(400).json({ message: 'Unit type already exists' });
        return;
      }
      const parsed = createUintTypeSchema.safeParse({ type });
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten(),
        });
        return;
      }
      const newUnitType = await UnitTypeModel.create({
        type: type,
      });
      await recordHistory({
        table: 'UnitType',
        documentId: newUnitType._id as Types.ObjectId,
        action: 'create', // or 'update' based on your logic
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
          role: user.role,
        },
        diff: newUnitType.toObject(), // Assuming you want to log the entire user object
        reason: 'User create new unit type', // optional
      });
      res.status(201).json({
        message: 'Unit type created successfully',
        unitType: newUnitType,
      });

      return;
    } catch (error) {
      res.status(500).json({ message: 'Failed to create unit type', error });
      return;
    }
  },
);
export const getUnitTypes = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const unitTypes = await UnitTypeModel.find();
      res.json(unitTypes);
      return;
    } catch (error) {
      console.error('Error fetching unit types:', error);
      res.status(500).json({ message: 'Failed to fetch unit types', error });
      return;
    }
  },
);
export const getUnitTypeById = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const unitTypeId = req.params.id;
      if (!unitTypeId) {
        res.status(400).json({ message: 'Unit type ID is required' });
        return;
      }
      const unitType = await UnitTypeModel.findById(unitTypeId);
      if (!unitType) {
        res.status(404).json({ message: 'Unit type not found' });
        return;
      }
      res.json(unitType);
    } catch (error) {
      console.error('Error fetching unit type:', error);
      res.status(500).json({ message: 'Failed to fetch unit type', error });
    }
  },
);
export const updateUnitType = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const unitTypeId = req.params.id;
      if (!unitTypeId) {
        res.status(400).json({ message: 'Unit type ID is required' });
        return;
      }
      const updateData = req.body;
      if (!updateData || Object.keys(updateData).length === 0) {
        res.status(400).json({ message: 'Update data is required' });
        return;
      }

      const existingUnitType = await UnitTypeModel.findById(unitTypeId);
      if (!existingUnitType) {
        res.status(404).json({ message: 'Unit type not found' });
        return;
      }

      // Validate the update data against the existing unit type schema
      // Here you can add any specific validation logic if needed
      // For example, you might want to check if the type is valid

      if (updateData.type && typeof updateData.type !== 'string') {
        res.status(400).json({ message: 'Invalid unit type format' });
        return;
      }

      if (updateData.type === existingUnitType.type) {
        res.status(400).json({ message: 'No changes detected in unit type' });
        return;
      }

      // Record the history before updating
      const userId = req.body.userID;
      const user: Iuser | null = await UserModel.findOne({ userID: userId });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const updatedUnitType = await UnitTypeModel.findByIdAndUpdate(
        unitTypeId,
        { type: updateData.type },
        {
          new: true,
          runValidators: true,
        },
      );
      if (!updatedUnitType) {
        res.status(404).json({ message: 'Unit type not found' });
        return;
      }
      // const diff = getDeepDiff(existingUnitType, updatedUnitType);
      const diff: Record<string, any> = {};

      diff.type = {
        from: existingUnitType.type,
        to: updatedUnitType.type,
      };

      await recordHistory({
        table: 'UnitType',
        documentId: existingUnitType._id as Types.ObjectId,
        action: 'update',
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
          role: user.role,
        },
        diff, // Assuming you want to log the changes
        reason: 'User updated unit type', // optional
      });
      res.status(200).json(updatedUnitType);
    } catch (error) {
      console.error('Error updating unit type:', error);
      res.status(500).json({ message: 'Failed to update unit type', error });
    }
  },
);
export const deleteUnitType = expressAsyncHandler(
  async (req: Request, res: Response) => {
    try {
      const unitTypeId = req.params.id;
      if (!unitTypeId) {
        res.status(400).json({ message: 'Unit type ID is required' });
        return;
      }
      const existingUnitType = await UnitTypeModel.findById(unitTypeId);
      if (!existingUnitType) {
        res.status(404).json({ message: 'Unit type not found' });
        return;
      }
      const userId = req.body.userID;
      const user: Iuser | null = await UserModel.findOne({ userID: userId });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      await UnitTypeModel.findByIdAndDelete(unitTypeId);
      // Record the history after deletion
      await recordHistory({
        table: 'UnitType',
        documentId: existingUnitType._id as Types.ObjectId,
        action: 'delete',
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
          role: user.role,
        },
        diff: existingUnitType.toObject(), // Assuming you want to log the deleted unit type
        reason: 'User deleted unit type', // optional
      });

      res.status(200).json({ message: 'Unit type deleted successfully' });
      return;
    } catch (error) {
      console.error('Error deleting unit type:', error);
      res.status(500).json({ message: 'Failed to delete unit type', error });
      return;
    }
  },
);

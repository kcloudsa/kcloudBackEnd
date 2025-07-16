// eslint-disable-next-line import/no-extraneous-dependencies
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { UnitModel } from '../../models/unitModel';
import { createUintSchema } from '../../validation/unit';
import { recordHistory } from '../../Utils/recordHistory';
import { Types } from 'mongoose';
import UserModel from '../../models/userModel';
import Iuser from '../../interfaces/Iuser';
import { deepMerge } from '../../Utils/deepMerge';
import { getDeepDiff } from '../../Utils/deepDiff';

export const nameUnit = asyncHandler(async (req: Request, res: Response) => {
  try {
    const emojis = ['yahia', '😀', '😳', '🙄'];
    res.json(emojis);
  } catch (error) {
    console.error('Error fetching emojis:', error);
    res.status(500).json({ message: 'Failed to fetch emojis', error });
  }
});

export const createUnit = asyncHandler(async (req: Request, res: Response) => {
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
    const parsed = createUintSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten(),
      });
      return;
    }
    const data = parsed.data; // Now fully typed and safe!
    // Check if unit already exists
    const existingUnit = await UnitModel.findOne({
      number: data.number,
      uniteGroupID: data.uniteGroupID,
      userID: user._id,
      unitTypeID: data.unitTypeId,
    });
    if (existingUnit) {
      res.status(400).json({
        message:
          'Unit with this number in same uniteGroup already exists in the group',
      });
      return;
    }
    // Create unit payload
    const unitPayload = {
      uniteGroupID: data.uniteGroupID,
      userID: user._id,
      unitTypeID: data.unitTypeId,
      number: data.number,
      description: data.description,
      notes: data.notes,
      processingCost: data.processingCost,
      location: data.location,
      baseUnit: data.baseUnit,
      unitMedia: data.unitMedia,
      favorite: data.favorite,
      unitStatus: data.unitStatus,
    };
    const newUnit = await UnitModel.create(unitPayload);
    if (!newUnit) {
      res.status(400).json({ message: 'Failed to create unit' });
      return;
    }
    await recordHistory({
      table: 'Unit',
      documentId: newUnit._id as Types.ObjectId,
      action: 'create', // or 'update' based on your logic
      performedBy: {
        userId: user._id as Types.ObjectId,
        name: user.userName.slug,
        role: user.role,
      },
      diff: newUnit.toObject(), // Assuming you want to log the entire user object
      reason: 'User create new unit', // optional
    });
    res.status(201).json({
      message: 'Unit created successfully',
      unit: newUnit,
    });
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ message: 'Failed to create unit', error });
  }
});

export const getUnits = asyncHandler(async (req: Request, res: Response) => {
  try {
    const units = await UnitModel.find().populate('unitTypeID');
    res.json(units);
    return;
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ message: 'Failed to fetch units', error });
    return;
  }
});
export const getUnitById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const unitId = req.params.id;
    if (!unitId) {
      res.status(400).json({ message: 'Unit ID is required' });
      return;
    }
    const unit = await UnitModel.findById(unitId);
    if (!unit) {
      res.status(404).json({ message: 'Unit not found' });
      return;
    }
    res.json(unit);
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ message: 'Failed to fetch unit', error });
  }
});

export const updateUnit = asyncHandler(async (req: Request, res: Response) => {
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
    const unitId = req.params.id;
    if (!unitId) {
      res.status(400).json({ message: 'Unit ID is required' });
      return;
    }
    const updateData = req.body;

    const existingDoc = await UnitModel.findById(unitId);
    if (!existingDoc) {
      res.status(404).json({ message: 'Unit not found' });
      return;
    }
    updateData.userID = user._id;
    const mergedData = deepMerge(existingDoc.toObject(), updateData);
    const original = existingDoc?.toObject();

    const diff = getDeepDiff(original, mergedData);
    if (!diff || Object.keys(diff).length === 0) {
      res.status(400).json({ message: 'No changes detected' });
      return;
    }
    const updatedUnit = await UnitModel.findByIdAndUpdate(unitId, mergedData, {
      new: true,
      runValidators: true,
    });
    if (!updatedUnit) {
      res.status(404).json({ message: 'Unit not found' });
      return;
    }

    await recordHistory({
      table: 'Units',
      documentId: updatedUnit._id as Types.ObjectId,
      action: 'update', // or 'create' based on your logic
      performedBy: {
        userId: user._id as Types.ObjectId,
        name: user.userName.slug,
        role: user.role,
      },
      diff, // Assuming you want to log the entire user object
      reason: 'User update unit ', // optional
    });
    res.json(updatedUnit);
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ message: 'Failed to update unit', error });
  }
});
export const deleteUnit = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.body.userID;
    // Assuming you have a way to fetch the user by ID
    const user: Iuser | null = await UserModel.findOne({ userID: userId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const unitId = req.params.id;
    if (!unitId) {
      res.status(400).json({ message: 'Unit ID is required' });
      return;
    }
    const deletedUnit = await UnitModel.findByIdAndDelete(unitId);
    if (!deletedUnit) {
      res.status(404).json({ message: 'Unit not found' });
      return;
    }
    await recordHistory({
      table: 'Units',
      documentId: deletedUnit._id as Types.ObjectId,
      action: 'delete', // or 'update' based on your logic
      performedBy: {
        userId: user._id as Types.ObjectId,
        name: user.userName.slug,
        role: user.role,
      },
      diff: deletedUnit.toObject(), // Assuming you want to log the entire user object
      reason: 'User delete unit ', // optional
    });

    res.json({ message: 'Unit deleted successfully', unit: deletedUnit });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ message: 'Failed to delete unit', error });
  }
});

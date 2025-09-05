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
  // If caller provided a user filter (some front-end calls include the user id),
  // return only that user's rental sources. Otherwise return all.
  const filter: any = {};
  const user = (req.user as any) as Iuser | undefined;
  const queryUserId = (req.query && (req.query.userID || req.query.userId)) as string | undefined;
  if (queryUserId) filter.userId = queryUserId;
  else if (user && user._id) filter.userId = (user._id as any);

  const rentalSource = await RentalSourceModel.find(filter);
  res.json({ success: true, data: rentalSource });
      return;
    } catch (error) {
      console.error('Error fetching unit types:', error);
  res.status(500).json({ message: 'Failed to fetch rental sources', error });
      return;
    }
  },
);

export const createRentalSource = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { SourceName, description } = req.body;
      // Use authenticated user from Passport (req.user) per migration guide
      const user = (req.user as any) as Iuser | undefined;
      if (!user) {
        res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        return;
      }

      if (!SourceName) {
        res.status(400).json({ message: 'SourceName is required' });
        return;
      }
      // Ensure uniqueness per user
      const existingRentalSource = await RentalSourceModel.findOne({
        SourceName,
        userId: user._id as any,
      });
      if (existingRentalSource) {
        res.status(409).json({ message: 'Rental source already exists for this user' });
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
        userId: user._id as any,
      });
      await recordHistory({
        table: 'RentalSource',
        documentId: newRentalSource._id as Types.ObjectId,
        action: 'create',
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: ((user.userName && (user.userName.slug || user.userName.displayName)) || user.contactInfo.email) as string,
          role: user.role,
        },
        diff: newRentalSource.toObject(),
        reason: 'User create new Rental source',
      });
      res.status(201).json({
        success: true,
        message: 'Rental source created successfully',
        data: newRentalSource,
      });

      return;
    } catch (error) {
      console.error('Error fetching emojis:', error);
      res.status(500).json({ message: 'Failed to create rental source', error });
      return;
    }
  },
);

export const getRentalSourceById = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string | undefined;
      if (!id) {
        res.status(400).json({ message: 'id parameter is required' });
        return;
      }

      const rentalSource = await RentalSourceModel.findById(id);
      if (!rentalSource) {
        res.status(404).json({ success: false, message: 'Rental source not found' });
        return;
      }

      res.json({ success: true, data: rentalSource });
      return;
    } catch (error) {
      console.error('Error fetching rental source by id:', error);
      res.status(500).json({ message: 'Failed to fetch rental source', error });
      return;
    }
  },
);

export const updateRentalSource = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string | undefined;
      if (!id) {
        res.status(400).json({ message: 'id parameter is required' });
        return;
      }

      const user = (req.user as any) as Iuser | undefined;
      if (!user) {
        res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        return;
      }

      const existing = await RentalSourceModel.findById(id);
      if (!existing) {
        res.status(404).json({ message: 'Rental source not found' });
        return;
      }

      if (existing.userId && String(existing.userId) !== String((user as any)._id)) {
        res.status(403).json({ message: 'Forbidden: cannot modify this rental source' });
        return;
      }

      const { SourceName, description } = req.body || {};
      if (!SourceName || typeof SourceName !== 'string' || !SourceName.trim()) {
        res.status(400).json({ message: 'SourceName is required' });
        return;
      }

      if (SourceName.trim() === existing.SourceName && (description ?? '') === (existing.description ?? '')) {
        res.status(400).json({ message: 'No changes detected' });
        return;
      }

      // Ensure uniqueness per user
      const duplicate = await RentalSourceModel.findOne({ SourceName: SourceName.trim(), userId: existing.userId });
      if (duplicate && String(duplicate._id) !== String(existing._id)) {
        res.status(409).json({ message: 'Rental source already exists for this user' });
        return;
      }

      const prev = existing.toObject();
      existing.SourceName = SourceName.trim();
      if (typeof description === 'string') existing.description = description;
      const updated = await existing.save();

      await recordHistory({
        table: 'RentalSource',
        documentId: updated._id as Types.ObjectId,
        action: 'update',
        performedBy: {
          userId: (user as any)._id as Types.ObjectId,
          name: ((user.userName && (user.userName.slug || user.userName.displayName)) || (user as any).contactInfo?.email) as string,
          role: user.role,
        },
        diff: {
          SourceName: { from: prev.SourceName, to: updated.SourceName },
          ...(prev.description !== updated.description ? { description: { from: prev.description, to: updated.description } } : {}),
        },
        reason: 'User updated rental source',
      });

      res.status(200).json({ success: true, data: updated });
      return;
    } catch (error) {
      console.error('Error updating rental source:', error);
      res.status(500).json({ message: 'Failed to update rental source', error });
      return;
    }
  },
);

export const deleteRentalSource = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string | undefined;
      if (!id) {
        res.status(400).json({ message: 'id parameter is required' });
        return;
      }

      const user = (req.user as any) as Iuser | undefined;
      if (!user) {
        res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        return;
      }

      const existing = await RentalSourceModel.findById(id);
      if (!existing) {
        res.status(404).json({ message: 'Rental source not found' });
        return;
      }

      if (existing.userId && String(existing.userId) !== String((user as any)._id)) {
        res.status(403).json({ message: 'Forbidden: cannot delete this rental source' });
        return;
      }

      await RentalSourceModel.findByIdAndDelete(id);

      await recordHistory({
        table: 'RentalSource',
        documentId: existing._id as Types.ObjectId,
        action: 'delete',
        performedBy: {
          userId: (user as any)._id as Types.ObjectId,
          name: ((user.userName && (user.userName.slug || user.userName.displayName)) || (user as any).contactInfo?.email) as string,
          role: user.role,
        },
        diff: existing.toObject(),
        reason: 'User deleted rental source',
      });

      res.status(200).json({ success: true, message: 'Rental source deleted successfully' });
      return;
    } catch (error) {
      console.error('Error deleting rental source:', error);
      res.status(500).json({ message: 'Failed to delete rental source', error });
      return;
    }
  },
);

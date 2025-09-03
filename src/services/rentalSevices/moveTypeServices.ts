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
  const filter: any = {};
  const user = (req.user as any) as Iuser | undefined;
  const queryUserId = (req.query && (req.query.userID || req.query.userId)) as string | undefined;
  if (queryUserId) filter.userId = queryUserId;
  else if (user && user._id) filter.userId = (user._id as any);

  const moveTypes = await MoveTypeModel.find(filter);
  res.json({ success: true, data: moveTypes });
      return;
    } catch (error) {
      console.error('Error fetching unit types:', error);
  res.status(500).json({ message: 'Failed to fetch move types', error });
      return;
    }
  },
);

export const createMoveType = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Use authenticated user from Passport (req.user) per migration guide
      const user = (req.user as any) as Iuser | undefined;
      if (!user) {
        // Unauthenticated
        res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        return;
      }

      // Derive a stable user id from `req.user` which might be a string, ObjectId, or object
      const rawReqUser = (req as any).user;
      let rawAuthId: any = null;
      if (typeof rawReqUser === 'string' && rawReqUser.trim()) {
        rawAuthId = rawReqUser;
      } else if (rawReqUser && (rawReqUser as any)._id) {
        rawAuthId = (rawReqUser as any)._id;
      } else if (rawReqUser && (rawReqUser as any).id) {
        rawAuthId = (rawReqUser as any).id;
      } else if (rawReqUser && (rawReqUser as any).userID) {
        rawAuthId = (rawReqUser as any).userID;
      } else if (rawReqUser && (rawReqUser as any).userId) {
        rawAuthId = (rawReqUser as any).userId;
      }

      if (!rawAuthId) {
        // Log minimal debug info to help diagnose the shape of req.user without dumping secrets
        console.error('createMoveType: authenticated user present but no id field. userType=', typeof rawReqUser, 'userKeys=', typeof rawReqUser === 'object' ? Object.keys(rawReqUser as any) : undefined);
        res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authenticated user has no id' });
        return;
      }
      const authUserId = rawAuthId as Types.ObjectId | string;
      const type = req.body.type;
      if (!type) {
        res.status(404).json({ message: 'type not found' });
        return;
      }
      // Check uniqueness per user (type + userId)
      const existingUnitType = await MoveTypeModel.findOne({
        type: type,
        userId: authUserId as any,
      });
      if (existingUnitType) {
        res.status(409).json({ message: 'Move type already exists for this user' });
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
    // Debug: log the derived auth user id (small, non-sensitive) to help diagnose validation issues
    console.debug('createMoveType: creating MoveType with userId=', typeof authUserId, authUserId ? String(authUserId).slice(0, 40) : authUserId);
      let newMoveType;
      try {
        newMoveType = await MoveTypeModel.create({
          type: type,
          // model requires `userId` (camelCase) — populate from authenticated user (accept ObjectId or string)
          userId: authUserId as any,
        });
      } catch (err: any) {
        // Convert duplicate key errors into a 409 with a helpful message
        if (err && err.code === 11000) {
          console.warn('Duplicate MoveType insert detected for user:', String(authUserId).slice(0, 24));
      res.status(409).json({ message: 'Move type already exists for this user' });
          return;
        }
        throw err;
      }
      await recordHistory({
        table: 'MoveType',
        documentId: newMoveType._id as Types.ObjectId,
        action: 'create',
        performedBy: {
          userId: authUserId as any,
          name: ((user.userName && (user.userName.slug || user.userName.displayName)) || user.contactInfo.email) as string,
          role: user.role,
        },
        diff: newMoveType.toObject(),
        reason: 'User create new Move type',
      });
  res.status(201).json({ success: true, message: 'Move type created successfully', data: newMoveType });

      return;
    } catch (error) {
      console.error('Error fetching Move type :', error);
      res.status(500).json({ message: 'Failed to fetch Move type ', error });
      return;
    }
  },
);

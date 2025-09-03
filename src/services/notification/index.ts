import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { recordHistory } from '../../Utils/recordHistory';
import Iuser from '../../interfaces/Iuser';
import UserModel from '../../models/userModel';
import { Types } from 'mongoose';
import { NotificationModel } from '../../models/notificationModel';
import { createNotificationSchema } from '../../validation/Notification';
import { deepMerge } from '../../Utils/deepMerge';
import { getDeepDiff } from '../../Utils/deepDiff';

export const nameNotification = asyncHandler(
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

export const getNotification = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { filters, pagination, sort, populate, select } = (req as any)
        .authenticatedQuery;

      // Build query with user isolation already applied by middleware
      let query = NotificationModel.find(filters);

      // Apply sorting
      query = query.sort(sort);

      // Apply population
      if (populate && populate.length > 0) {
        populate.forEach((field: string) => {
          query = query.populate(field);
        });
      }

      // Apply field selection
      if (select) {
        query = query.select(select);
      }

      // Execute queries in parallel
      const [notifications, totalCount] = await Promise.all([
        query.skip(pagination.skip).limit(pagination.limit).exec(),
        NotificationModel.countDocuments(filters),
      ]);

      if (!notifications || notifications.length === 0) {
        res.json({
          success: true,
          data: [],
          message: 'No notifications found',
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        });
        return;
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / pagination.limit);
      const hasNextPage = pagination.page < totalPages;
      const hasPrevPage = pagination.page > 1;

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        meta: {
          requestedBy: user.userName?.slug || user.email,
          timestamp: new Date().toISOString(),
          filters: Object.keys(filters).length > 1 ? filters : undefined,
        },
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      });
    }
  },
);

export const createNotification = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { type, title, message } = req.body;

      // userID is automatically injected by middleware, but validate other fields
      if (!type || !title || !message) {
        res.status(400).json({
          success: false,
          message: 'Type, title, and message are required',
        });
        return;
      }

      // Check for existing notification (duplicate prevention)
      const existingNotification = await NotificationModel.findOne({
        userID: user._id,
        type,
        title,
        message,
        createdAt: {
          $gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
        },
      });

      if (existingNotification) {
        res.status(409).json({
          success: false,
          message:
            'Duplicate notification - similar notification created recently',
        });
        return;
      }

      // Zod validation
      const parsed = createNotificationSchema.safeParse({
        userID: user._id.toString(),
        type,
        title,
        message,
      });

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.flatten(),
        });
        return;
      }

      // Create new notification with user ID as ObjectId
      const newNotification = await NotificationModel.create({
        userID: user._id, // Use ObjectId directly
        type,
        title,
        message,
      });

      // Record history
      await recordHistory({
        table: 'Notification',
        documentId: newNotification._id as Types.ObjectId,
        action: 'create',
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName?.slug || user.email,
          role: user.role,
        },
        diff: newNotification.toObject(),
        reason: 'User create new notification',
      });

      // Send response
      res.status(201).json({
        success: true,
        message: 'New notification created successfully',
        data: newNotification,
        meta: {
          createdBy: user.userName?.slug || user.email,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      });
    }
  },
);

export const getNotificationsByUserId = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userid = req.body.userID;
      // Find notifications by userID
      if (!userid || typeof userid !== 'string') {
        res.status(400).json({ message: 'Invalid or missing user ID' });
        return;
      }
      const notifications = await NotificationModel.find({ userID: userid });
      console.log(notifications);
      if (!notifications || notifications.length === 0) {
        res
          .status(404)
          .json({ message: 'No notifications found for this user' });
        return;
      }

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications by userId:', error);
      res.status(500).json({ message: 'Failed to fetch notifications', error });
    }
  },
);
export const getNotificationsById = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const notificationid = req.params.id;
      // Find notifications by userID
      const notifications = await NotificationModel.findById(notificationid);
      if (!notifications) {
        res
          .status(404)
          .json({ message: 'No notifications found for this user' });
        return;
      }

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications by userId:', error);
      res.status(500).json({ message: 'Failed to fetch notifications', error });
    }
  },
);

export const deleteNotification = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const notificationId = req.params.id;
      const userID = req.body.userID;
      if (!userID) {
        res.status(400).json({ message: 'User ID is required' });
        return;
      }

      // Find user by userID
      const user: Iuser | null = await UserModel.findOne({ userID });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      // Validate notificationId
      if (!Types.ObjectId.isValid(notificationId)) {
        res.status(400).json({ message: 'Invalid notification ID' });
        return;
      }

      // Find and delete the notification
      const deletedNotification = await NotificationModel.findByIdAndDelete(
        notificationId,
      );

      if (!deletedNotification) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }

      // Record history
      await recordHistory({
        table: 'Notification',
        documentId: deletedNotification._id as Types.ObjectId,
        action: 'delete',
        performedBy: {
          userId: user._id as Types.ObjectId, // Assuming user is set in request
          name: user.userName.slug,
          role: user.role,
        },
        diff: deletedNotification.toObject(),
        reason: 'User deleted a Notification',
      });

      res.json({
        message: 'Notification deleted successfully',
        Notification: deletedNotification,
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Failed to delete notification', error });
    }
  },
);

export const updateNotification = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const notificationId = req.params.id;
      const { read, type, title, message, userID } = req.body;

      // Validate notificationId
      if (!Types.ObjectId.isValid(notificationId)) {
        res.status(400).json({ message: 'Invalid notification ID' });
        return;
      }
      if (!userID) {
        res.status(400).json({ message: 'User ID is required' });
        return;
      }

      // Find user by userID
      const user: Iuser | null = await UserModel.findOne({ userID });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      const existingDoc = await NotificationModel.findById(notificationId);
      if (!existingDoc) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }

      const mergedData = deepMerge(existingDoc.toObject(), {
        read,
        type,
        title,
        message,
        userID,
      });

      const diff = getDeepDiff(existingDoc.toObject(), mergedData);
      // Find and update the notification
      if (!diff || Object.keys(diff).length === 0) {
        res.status(400).json({ message: 'No changes detected' });
        return;
      }
      const updatedNotification = await NotificationModel.findByIdAndUpdate(
        notificationId,
        { read, type, title, message },
        { new: true },
      );

      if (!updatedNotification) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }

      // Record history
      await recordHistory({
        table: 'Notification',
        documentId: updatedNotification._id as Types.ObjectId,
        action: 'update',
        performedBy: {
          userId: user._id as Types.ObjectId, // Assuming user is set in request
          name: user.userName.slug,
          role: user.role,
        },
        diff,
        reason: 'User updated a Notification',
      });

      res.json({
        message: 'Notification updated successfully',
        Notification: updatedNotification,
      });
    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({ message: 'Failed to update notification', error });
    }
  },
);

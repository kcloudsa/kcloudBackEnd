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
      const Notification = await NotificationModel.find();
      if (!Notification || Notification.length === 0) {
        // Check if Notification is empty
        res
          .status(404)
          .json({ message: 'No Notification found', Notification });
        return;
      }
      res.json(Notification);
    } catch (error) {
      console.error('Error fetching Notification:', error);
      res.status(500).json({ message: 'Failed to fetch Notification', error });
      return;
    }
  },
);

export const createNotification = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { userID, type, title, message } = req.body;

      // Validate presence of userID
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

      // Validate other fields before proceeding
      if (!type || !title || !message) {
        res
          .status(400)
          .json({ message: 'Type, title, and message are required' });
        return;
      }

      // Check for existing notification (duplicate prevention)
      const existingNotification = await NotificationModel.findOne({
        userID,
        type,
        title,
        message,
      });
      if (existingNotification) {
        res.status(400).json({ message: 'Notification already exists' });
        return;
      }

      // Zod validation
      const parsed = createNotificationSchema.safeParse({
        userID, // Pass correct userId for schema
        type,
        title,
        message,
      });

      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.flatten(),
        });
        return;
      }

      // Create new notification
      const newNotification = await NotificationModel.create(parsed.data);

      // Record history
      await recordHistory({
        table: 'Notification',
        documentId: newNotification._id as Types.ObjectId,
        action: 'create',
        performedBy: {
          userId: user._id as Types.ObjectId,
          name: user.userName.slug,
          role: user.role,
        },
        diff: newNotification.toObject(),
        reason: 'User create new Notification',
      });

      // Send response
      res.status(201).json({
        message: 'New notification created successfully',
        Notification: newNotification,
      });
      return;
    } catch (error) {
      console.error('Error creating newNotification:', error);
      res
        .status(500)
        .json({ message: 'Failed to create newNotification', error });
    }
    return;
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

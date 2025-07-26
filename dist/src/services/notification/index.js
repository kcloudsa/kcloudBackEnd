"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotification = exports.deleteNotification = exports.getNotificationsById = exports.getNotificationsByUserId = exports.createNotification = exports.getNotification = exports.nameNotification = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const recordHistory_1 = require("../../Utils/recordHistory");
const userModel_1 = __importDefault(require("../../models/userModel"));
const mongoose_1 = require("mongoose");
const notificationModel_1 = require("../../models/notificationModel");
const Notification_1 = require("../../validation/Notification");
const deepMerge_1 = require("../../Utils/deepMerge");
const deepDiff_1 = require("../../Utils/deepDiff");
exports.nameNotification = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const emojis = ['yahia', '😀', '😳', '🙄'];
        res.json(emojis);
    }
    catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ message: 'Failed to fetch emojis', error });
    }
});
exports.getNotification = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const Notification = await notificationModel_1.NotificationModel.find();
        if (!Notification || Notification.length === 0) {
            // Check if Notification is empty
            res
                .status(404)
                .json({ message: 'No Notification found', Notification });
            return;
        }
        res.json(Notification);
    }
    catch (error) {
        console.error('Error fetching Notification:', error);
        res.status(500).json({ message: 'Failed to fetch Notification', error });
        return;
    }
});
exports.createNotification = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { userID, type, title, message } = req.body;
        // Validate presence of userID
        if (!userID) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }
        // Find user by userID
        const user = await userModel_1.default.findOne({ userID });
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
        const existingNotification = await notificationModel_1.NotificationModel.findOne({
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
        const parsed = Notification_1.createNotificationSchema.safeParse({
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
        const newNotification = await notificationModel_1.NotificationModel.create(parsed.data);
        // Record history
        await (0, recordHistory_1.recordHistory)({
            table: 'Notification',
            documentId: newNotification._id,
            action: 'create',
            performedBy: {
                userId: user._id,
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
    }
    catch (error) {
        console.error('Error creating newNotification:', error);
        res
            .status(500)
            .json({ message: 'Failed to create newNotification', error });
    }
    return;
});
exports.getNotificationsByUserId = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const userid = req.body.userID;
        // Find notifications by userID
        if (!userid || typeof userid !== 'string') {
            res.status(400).json({ message: 'Invalid or missing user ID' });
            return;
        }
        const notifications = await notificationModel_1.NotificationModel.find({ userID: userid });
        console.log(notifications);
        if (!notifications || notifications.length === 0) {
            res
                .status(404)
                .json({ message: 'No notifications found for this user' });
            return;
        }
        res.json(notifications);
    }
    catch (error) {
        console.error('Error fetching notifications by userId:', error);
        res.status(500).json({ message: 'Failed to fetch notifications', error });
    }
});
exports.getNotificationsById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const notificationid = req.params.id;
        // Find notifications by userID
        const notifications = await notificationModel_1.NotificationModel.findById(notificationid);
        if (!notifications) {
            res
                .status(404)
                .json({ message: 'No notifications found for this user' });
            return;
        }
        res.json(notifications);
    }
    catch (error) {
        console.error('Error fetching notifications by userId:', error);
        res.status(500).json({ message: 'Failed to fetch notifications', error });
    }
});
exports.deleteNotification = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userID = req.body.userID;
        if (!userID) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }
        // Find user by userID
        const user = await userModel_1.default.findOne({ userID });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Validate notificationId
        if (!mongoose_1.Types.ObjectId.isValid(notificationId)) {
            res.status(400).json({ message: 'Invalid notification ID' });
            return;
        }
        // Find and delete the notification
        const deletedNotification = await notificationModel_1.NotificationModel.findByIdAndDelete(notificationId);
        if (!deletedNotification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        // Record history
        await (0, recordHistory_1.recordHistory)({
            table: 'Notification',
            documentId: deletedNotification._id,
            action: 'delete',
            performedBy: {
                userId: user._id, // Assuming user is set in request
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
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Failed to delete notification', error });
    }
});
exports.updateNotification = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const notificationId = req.params.id;
        const { read, type, title, message, userID } = req.body;
        // Validate notificationId
        if (!mongoose_1.Types.ObjectId.isValid(notificationId)) {
            res.status(400).json({ message: 'Invalid notification ID' });
            return;
        }
        if (!userID) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }
        // Find user by userID
        const user = await userModel_1.default.findOne({ userID });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const existingDoc = await notificationModel_1.NotificationModel.findById(notificationId);
        if (!existingDoc) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        const mergedData = (0, deepMerge_1.deepMerge)(existingDoc.toObject(), {
            read,
            type,
            title,
            message,
            userID,
        });
        const diff = (0, deepDiff_1.getDeepDiff)(existingDoc.toObject(), mergedData);
        // Find and update the notification
        if (!diff || Object.keys(diff).length === 0) {
            res.status(400).json({ message: 'No changes detected' });
            return;
        }
        const updatedNotification = await notificationModel_1.NotificationModel.findByIdAndUpdate(notificationId, { read, type, title, message }, { new: true });
        if (!updatedNotification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        // Record history
        await (0, recordHistory_1.recordHistory)({
            table: 'Notification',
            documentId: updatedNotification._id,
            action: 'update',
            performedBy: {
                userId: user._id, // Assuming user is set in request
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
    }
    catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ message: 'Failed to update notification', error });
    }
});

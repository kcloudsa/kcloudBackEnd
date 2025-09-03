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
        const user = req.user;
        const { filters, pagination, sort, populate, select } = req
            .authenticatedQuery;
        // Build query with user isolation already applied by middleware
        let query = notificationModel_1.NotificationModel.find(filters);
        // Apply sorting
        query = query.sort(sort);
        // Apply population
        if (populate && populate.length > 0) {
            populate.forEach((field) => {
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
            notificationModel_1.NotificationModel.countDocuments(filters),
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
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
});
exports.createNotification = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = req.user;
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
        const existingNotification = await notificationModel_1.NotificationModel.findOne({
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
                message: 'Duplicate notification - similar notification created recently',
            });
            return;
        }
        // Zod validation
        const parsed = Notification_1.createNotificationSchema.safeParse({
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
        const newNotification = await notificationModel_1.NotificationModel.create({
            userID: user._id, // Use ObjectId directly
            type,
            title,
            message,
        });
        // Record history
        await (0, recordHistory_1.recordHistory)({
            table: 'Notification',
            documentId: newNotification._id,
            action: 'create',
            performedBy: {
                userId: user._id,
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
    }
    catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
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

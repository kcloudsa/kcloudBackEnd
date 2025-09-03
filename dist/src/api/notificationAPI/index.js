"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_1 = require("../../services/notification");
const authQuery_1 = require("../../middlewares/authQuery");
const userIsolation_1 = require("../../middlewares/userIsolation");
const router = express_1.default.Router();
// Apply authentication to all routes
router.use(authQuery_1.requireAuth);
// Notification routes with user isolation
router
    .route('/')
    .get((0, userIsolation_1.validateAuthQueryWithUserIsolation)({
    allowCrossUserAccess: true, // Admins can see all notifications
    maxLimit: 200,
    allowedSortFields: ['createdAt', 'updatedAt', 'type', 'read'],
    allowedPopulateFields: ['userID'],
    userField: 'userID',
}), notification_1.getNotification)
    .post((0, userIsolation_1.injectUserID)('userID'), // Automatically inject user ID
notification_1.createNotification);
// User-specific notifications (for compatibility)
router.route('/user').get((0, userIsolation_1.validateAuthQueryWithUserIsolation)({
    allowCrossUserAccess: false, // Users can only see their own notifications
    maxLimit: 100,
    allowedSortFields: ['createdAt', 'updatedAt', 'type', 'read'],
    allowedPopulateFields: [],
    userField: 'userID',
}), notification_1.getNotificationsByUserId);
// Individual notification routes with ownership enforcement
router
    .route('/:id')
    .get((0, userIsolation_1.enforceUserOwnership)('notification'), notification_1.getNotificationsById)
    .patch((0, userIsolation_1.enforceUserOwnership)('notification'), notification_1.updateNotification)
    .delete((0, userIsolation_1.enforceUserOwnership)('notification'), notification_1.deleteNotification);
exports.default = router;

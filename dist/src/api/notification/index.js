"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_1 = require("../../services/notification");
const router = express_1.default.Router();
router.route('/').get(notification_1.getNotification).post(notification_1.createNotification);
router.route('/userNotifications').get(notification_1.getNotificationsByUserId);
router
    .route('/:id')
    .get(notification_1.getNotificationsById)
    .patch(notification_1.updateNotification)
    .delete(notification_1.deleteNotification);
exports.default = router;

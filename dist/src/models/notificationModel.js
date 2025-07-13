"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        required: [true, 'type is required'],
        enum: ['message', 'alert', 'danger'],
        default: 'message',
    }, // e.g., 'message', 'alert', 'danger'
    title: { type: String, required: [true, 'title is required'] }, // e.g., 'New Message', 'System Alert'
    message: { type: String, required: [true, 'message is required'] },
    read: { type: Boolean, default: false },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});
exports.NotificationModel = (0, mongoose_1.model)('Notification', notificationSchema);

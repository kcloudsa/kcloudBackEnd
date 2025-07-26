"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationSchema = void 0;
const zod_1 = require("zod");
exports.createNotificationSchema = zod_1.z.object({
    userID: zod_1.z.string().min(1, { message: 'User ID is required' }),
    type: zod_1.z.enum(['message', 'alert', 'danger'], {
        message: 'Invalid notification type',
    }),
    title: zod_1.z.string().min(1, { message: 'Title is required' }),
    message: zod_1.z.string().min(1, { message: 'Message is required' }),
    read: zod_1.z.boolean().optional(),
});

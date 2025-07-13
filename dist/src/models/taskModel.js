"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModel = void 0;
const mongoose_1 = require("mongoose");
const taskSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'overdue', 'todo'],
        default: 'todo',
    },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    maintenanceID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Maintenance',
        default: null,
    },
    unitID: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Unit', default: null },
    tanentID: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    contactID: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Contact', default: null },
    property: {
        id: { type: mongoose_1.Schema.Types.ObjectId, required: true },
        address: { type: String, required: true },
        type: { type: String, required: true },
    },
    dueDate: { type: String, required: true },
    createdAt: { type: String, default: new Date().toISOString() },
    category: {
        type: String,
        enum: [
            'maintenance',
            'inspection',
            'cleaning',
            'marketing',
            'administrative',
        ],
        required: true,
    },
    isStarred: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
});
exports.TaskModel = (0, mongoose_1.model)('Task', taskSchema);

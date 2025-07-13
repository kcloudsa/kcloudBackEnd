"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceRequestModel = void 0;
const mongoose_1 = require("mongoose");
const maintenanceRequestSchema = new mongoose_1.Schema({
    unitID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'Unit', // Assuming you have a Unit model
    },
    reportedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Assuming you have a User model
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'closed'],
        default: 'open',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    resolvedAt: {
        type: Date,
        default: null, // Optional date when the request was resolved
    },
}, {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
});
exports.MaintenanceRequestModel = mongoose_1.models.MaintenanceRequest ||
    (0, mongoose_1.model)('MaintenanceRequest', maintenanceRequestSchema);

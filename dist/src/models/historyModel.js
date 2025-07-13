"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const historySchema = new mongoose_1.default.Schema({
    table: { type: String, required: true },
    documentId: { type: mongoose_1.default.Schema.Types.ObjectId, required: true },
    action: {
        type: String,
        enum: ['create', 'update', 'delete', 'restore', 'login'],
        required: true,
    },
    timestamp: { type: Date, default: Date.now },
    performedBy: {
        userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        role: String,
    },
    diff: { type: mongoose_1.default.Schema.Types.Mixed },
    reason: { type: String },
});
const HistoryModel = mongoose_1.default.model('History', historySchema);
exports.default = HistoryModel;

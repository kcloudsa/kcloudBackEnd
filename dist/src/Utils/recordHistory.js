"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordHistory = void 0;
const historyModel_1 = __importDefault(require("../models/historyModel")); // adjust the path as needed
/**
 * Utility to record a history event
 */
const recordHistory = async (options) => {
    try {
        const history = new historyModel_1.default({
            table: options.table,
            documentId: options.documentId,
            action: options.action,
            performedBy: options.performedBy,
            diff: options.diff || undefined,
            reason: options.reason || undefined,
        });
        await history.save();
    }
    catch (error) {
        console.error('Failed to record history:', error);
    }
};
exports.recordHistory = recordHistory;

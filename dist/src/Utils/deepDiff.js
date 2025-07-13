"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeepDiff = getDeepDiff;
exports.generateDiff = generateDiff;
const mongoose_1 = __importDefault(require("mongoose"));
function getDeepDiff(original, updated, prefix = '') {
    const diff = {};
    for (const key in updated) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const originalValue = original[key];
        const updatedValue = updated[key];
        const isObject = (val) => typeof val === 'object' &&
            val !== null &&
            !Array.isArray(val) &&
            !(val instanceof Date) &&
            !(val instanceof mongoose_1.default.Types.ObjectId);
        if (isObject(updatedValue)) {
            const nestedDiff = getDeepDiff(originalValue || {}, updatedValue, fullKey);
            Object.assign(diff, nestedDiff);
        }
        else if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
            diff[fullKey] = { from: originalValue, to: updatedValue };
        }
    }
    return diff;
}
function generateDiff(oldData, newData) {
    const diff = {};
    for (const key in newData) {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
            diff[key] = {
                from: oldData[key],
                to: newData[key],
            };
        }
    }
    return diff;
}

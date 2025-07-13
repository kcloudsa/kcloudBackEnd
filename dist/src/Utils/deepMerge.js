"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepMerge = deepMerge;
const mongoose_1 = __importDefault(require("mongoose"));
function deepMerge(target, source) {
    const output = { ...target };
    for (const key in source) {
        const sourceValue = source[key];
        const targetValue = target[key];
        const isMergeableObject = (val) => typeof val === 'object' &&
            val !== null &&
            !Array.isArray(val) &&
            !(val instanceof Date) &&
            !(val instanceof mongoose_1.default.Types.ObjectId);
        if (isMergeableObject(sourceValue) && isMergeableObject(targetValue)) {
            output[key] = deepMerge(targetValue, sourceValue);
        }
        else {
            output[key] = sourceValue;
        }
    }
    return output;
}

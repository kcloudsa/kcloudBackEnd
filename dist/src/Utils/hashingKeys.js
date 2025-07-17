"use strict";
// import crypto from 'crypto';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareKey = exports.hashKey = exports.generateHashedAccessKey = void 0;
const generateHashedAccessKey = (dbKey, userId, routeKey, timestamp) => {
    const raw = `${dbKey}.${userId}.${routeKey}.${timestamp}`;
    return crypto_1.default.createHash('sha256').update(raw).digest('hex');
};
exports.generateHashedAccessKey = generateHashedAccessKey;
// export const compareKey = (
//   dbKey: string,
//   userId: string,
//   routeKey: string,
//   timestamp: string,
//   hashed: string,
// ): boolean => hashKey(dbKey, userId, routeKey, timestamp) === hashed;
const crypto_1 = __importDefault(require("crypto"));
const hashKey = (key) => crypto_1.default.createHash('sha256').update(key).digest('hex');
exports.hashKey = hashKey;
const compareKey = (input, hashed) => (0, exports.hashKey)(input) === hashed;
exports.compareKey = compareKey;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserKey = void 0;
const hashingKeys_1 = require("../Utils/hashingKeys");
const apiKeyModel_1 = __importDefault(require("../models/apiKeyModel"));
const checkUserKey = async (req, res, next) => {
    const key = req.headers['x-user-key'];
    if (!key || typeof key !== 'string') {
        return res.status(401).json({ message: 'Missing user API key' });
    }
    const hashed = (0, hashingKeys_1.hashKey)(key);
    const found = await apiKeyModel_1.default.findOne({
        key: hashed,
        active: true,
    });
    if (!found) {
        return res.status(401).json({ message: 'Invalid or expired user API key' });
    }
    // optionally attach user to req
    req.body.user = found?.userID;
    next();
};
exports.checkUserKey = checkUserKey;

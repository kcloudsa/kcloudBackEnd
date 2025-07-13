"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const validateBody = () => {
    return async (req, res, next) => {
        try {
            if (!req.body || typeof req.body !== 'object') {
                return res
                    .status(400)
                    .json({ message: 'Invalid or missing request body' });
            }
            const { userID } = req.body;
            if (!userID) {
                return res.status(400).json({ message: 'User ID is required' });
            }
            const user = await userModel_1.default.findOne({ userID });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            req.user = user;
            return next();
        }
        catch (error) {
            console.error('Error in validateBody:', error);
            return res.status(500).json({ message: 'Internal server error', error });
        }
    };
};
exports.validateBody = validateBody;

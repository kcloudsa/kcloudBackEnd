"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMoveType = exports.getmoveTypes = exports.nameMoveType = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const moveType_1 = require("../../validation/moveType");
const moveTypeModel_1 = require("../../models/moveTypeModel");
const recordHistory_1 = require("../../Utils/recordHistory");
const userModel_1 = __importDefault(require("../../models/userModel"));
exports.nameMoveType = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const emojis = ['yahia', '😀', '😳', '🙄'];
        res.json(emojis);
    }
    catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ message: 'Failed to fetch emojis', error });
    }
});
exports.getmoveTypes = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const moveTypes = await moveTypeModel_1.MoveTypeModel.find();
        res.json(moveTypes);
        return;
    }
    catch (error) {
        console.error('Error fetching unit types:', error);
        res.status(500).json({ message: 'Failed to fetch unit types', error });
        return;
    }
});
exports.createMoveType = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const userId = req.body.userID;
        // Assuming you have a way to fetch the user by ID
        const user = await userModel_1.default.findOne({ userID: userId });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const type = req.body.type;
        if (!type) {
            res.status(404).json({ message: 'type not found' });
            return;
        }
        const existingUnitType = await moveTypeModel_1.MoveTypeModel.findOne({
            type: type,
        });
        if (existingUnitType) {
            res.status(400).json({ message: 'Move type already exists' });
            return;
        }
        const parsed = moveType_1.createMoveTypeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: 'Validation failed',
                errors: parsed.error.flatten(),
            });
            return;
        }
        const newMoveType = await moveTypeModel_1.MoveTypeModel.create({
            type: type,
        });
        await (0, recordHistory_1.recordHistory)({
            table: 'MoveType',
            documentId: newMoveType._id,
            action: 'create', // or 'update' based on your logic
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff: newMoveType.toObject(), // Assuming you want to log the entire user object
            reason: 'User create new Move type', // optional
        });
        res.status(201).json({
            message: 'Move type created successfully',
            unitType: newMoveType,
        });
        return;
    }
    catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ message: 'Failed to fetch emojis', error });
        return;
    }
});

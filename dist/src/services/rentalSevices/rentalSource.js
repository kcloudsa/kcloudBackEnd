"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRentalSource = exports.getRentalSources = exports.namerentalSource = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const recordHistory_1 = require("../../Utils/recordHistory");
const userModel_1 = __importDefault(require("../../models/userModel"));
const rentalSourceModel_1 = require("../../models/rentalSourceModel");
const rentalSource_1 = require("../../validation/rentalSource");
exports.namerentalSource = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const emojis = ['yahia', '😀', '😳', '🙄'];
        res.json(emojis);
    }
    catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ message: 'Failed to fetch emojis', error });
    }
});
exports.getRentalSources = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const rentalSource = await rentalSourceModel_1.RentalSourceModel.find();
        res.json(rentalSource);
        return;
    }
    catch (error) {
        console.error('Error fetching unit types:', error);
        res.status(500).json({ message: 'Failed to fetch unit types', error });
        return;
    }
});
exports.createRentalSource = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { userID, SourceName, description } = req.body;
        // Assuming you have a way to fetch the user by ID
        const user = await userModel_1.default.findOne({ userID });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (!SourceName) {
            res.status(404).json({ message: 'SourceName not found' });
            return;
        }
        const existingRentalSource = await rentalSourceModel_1.RentalSourceModel.findOne({
            SourceName,
        });
        if (existingRentalSource) {
            res.status(400).json({ message: 'Source Name already exists' });
            return;
        }
        const parsed = rentalSource_1.createRentalSourceSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: 'Validation failed',
                errors: parsed.error.flatten(),
            });
            return;
        }
        const newRentalSource = await rentalSourceModel_1.RentalSourceModel.create({
            SourceName,
            description,
        });
        await (0, recordHistory_1.recordHistory)({
            table: 'RentalSource',
            documentId: newRentalSource._id,
            action: 'create', // or 'update' based on your logic
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff: newRentalSource.toObject(), // Assuming you want to log the entire user object
            reason: 'User create new Move type', // optional
        });
        res.status(201).json({
            message: 'Move type created successfully',
            unitType: newRentalSource,
        });
        return;
    }
    catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ message: 'Failed to fetch emojis', error });
        return;
    }
});

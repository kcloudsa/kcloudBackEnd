"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRental = exports.nameRental = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const userModel_1 = __importDefault(require("../../models/userModel"));
const rentals_1 = require("../../validation/rentals");
const unitModel_1 = require("../../models/unitModel");
exports.nameRental = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const emojis = ['yahia', '😀', '😳', '🙄'];
        res.json(emojis);
    }
    catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ message: 'Failed to fetch emojis', error });
    }
});
exports.createRental = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const userId = req.body.userID;
        // Assuming you have a way to fetch the user by ID
        const user = await userModel_1.default.findOne({
            userID: userId,
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const parsed = rentals_1.createRentalSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: 'Validation failed',
                errors: parsed.error.flatten(),
            });
            return;
        }
        const data = parsed.data; // Now fully typed and safe!
        // Check if unit already exists
        const existingUnit = await unitModel_1.UnitModel.findOne({});
        if (existingUnit) {
            res.status(400).json({
                message: 'Unit with this number in same uniteGroup already exists in the group',
            });
            return;
        }
        // Create unit payload
        const unitPayload = {};
        const newUnit = await unitModel_1.UnitModel.create(unitPayload);
        if (!newUnit) {
            res.status(400).json({ message: 'Failed to create unit' });
            return;
        }
        //   await recordHistory({
        //     table: 'Unit',
        //     documentId: newUnit._id as Types.ObjectId,
        //     action: 'create', // or 'update' based on your logic
        //     performedBy: {
        //       userId: user._id as Types.ObjectId,
        //       name: user.userName.slug,
        //       role: user.role,
        //     },
        //     diff: newUnit.toObject(), // Assuming you want to log the entire user object
        //     reason: 'User create new unit', // optional
        //   });
        res.status(201).json({
            message: 'Unit created successfully',
            unit: newUnit,
        });
    }
    catch (error) {
        console.error('Error creating unit:', error);
        res.status(500).json({ message: 'Failed to create unit', error });
    }
});

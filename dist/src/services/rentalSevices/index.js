"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRentals = exports.createRental = exports.nameRental = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const userModel_1 = __importDefault(require("../../models/userModel"));
const rentals_1 = require("../../validation/rentals");
const moveTypeModel_1 = require("../../models/moveTypeModel");
const rentalModel_1 = require("../../models/rentalModel");
const rentalSourceModel_1 = require("../../models/rentalSourceModel");
const recordHistory_1 = require("../../Utils/recordHistory");
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
        const parsed = rentals_1.createRentalSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: 'Validation failed',
                errors: parsed.error.flatten(),
            });
            return;
        }
        const data = parsed.data; // Now fully typed and safe!
        const { userID, moveTypeID, rentalSourceID, contractNumber, unitID, startDate, participats, } = req.body;
        // Assuming you have a way to fetch the user by ID
        const user = await userModel_1.default.findOne({
            userID,
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Assuming you have a way to fetch the user by ID
        const moveType = await moveTypeModel_1.MoveTypeModel.findById(moveTypeID);
        if (!moveType) {
            res.status(404).json({ message: 'moveType not found' });
            return;
        }
        const RentalSource = await rentalSourceModel_1.RentalSourceModel.findById(rentalSourceID);
        if (!RentalSource) {
            res.status(404).json({ message: 'RentalSource not found' });
            return;
        }
        // Check if unit already exists
        const existingRental = await rentalModel_1.RentalModel.findOne({
            contractNumber,
            moveTypeID,
            unitID,
            startDate,
            'participats.owner.userID': participats?.owner?.userID,
            'participats.tentant.userID': participats?.tentant?.userID,
        });
        if (existingRental) {
            res.status(400).json({
                message: 'A rental with this configuration already exists',
            });
            return;
        }
        const newRental = await rentalModel_1.RentalModel.create(data);
        if (!newRental) {
            res.status(400).json({ message: 'Failed to create rental ' });
            return;
        }
        await (0, recordHistory_1.recordHistory)({
            table: 'Unit',
            documentId: newRental._id,
            action: 'create', // or 'update' based on your logic
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff: newRental.toObject(), // Assuming you want to log the entire user object
            reason: 'User create new unit', // optional
        });
        res.status(201).json({
            message: 'rental created successfully',
            unit: newRental,
        });
    }
    catch (error) {
        console.error('Error creating rental:', error);
        res.status(500).json({ message: 'Failed to create rental', error });
    }
});
exports.getAllRentals = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const rentals = await rentalModel_1.RentalModel.find();
        res.json(rentals);
        return;
    }
    catch (error) {
        console.error('Error fetching unit types:', error);
        res.status(500).json({ message: 'Failed to fetch unit types', error });
        return;
    }
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRentalsByUserID = exports.getRentalsByUnitID = exports.updateRental = exports.deleteRental = exports.getRentalByID = exports.getAllRentals = exports.createRental = exports.nameRental = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const userModel_1 = __importDefault(require("../../models/userModel"));
const rentals_1 = require("../../validation/rentals");
const moveTypeModel_1 = require("../../models/moveTypeModel");
const rentalModel_1 = require("../../models/rentalModel");
const rentalSourceModel_1 = require("../../models/rentalSourceModel");
const mongoose_1 = __importDefault(require("mongoose"));
const recordHistory_1 = require("../../Utils/recordHistory");
const deepMerge_1 = require("../../Utils/deepMerge");
const deepDiff_1 = require("../../Utils/deepDiff");
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
        const { userID, moveTypeID, rentalSourceID, contractNumber, startDate, participats, monthsCount, isMonthly, endDate, unitID, } = req.body;
        const parsed = rentals_1.createRentalSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: 'Validation failed',
                errors: parsed.error.flatten(),
            });
            return;
        }
        const isMonthlyMode = isMonthly && monthsCount;
        const hasEndDate = !!endDate;
        if (!isMonthlyMode && !hasEndDate) {
            res.status(400).json({
                message: 'You must set both isMonthly and monthsCount, or provide an endDate.',
            });
            return;
        }
        const rentalStart = new Date(startDate);
        let rentalEnd = endDate ? new Date(endDate) : null;
        rentalStart.setHours(0, 0, 0, 0);
        rentalEnd?.setHours(0, 0, 0, 0);
        if (endDate) {
            rentalEnd = new Date(endDate);
        }
        else if (isMonthly && monthsCount) {
            rentalEnd = new Date(rentalStart);
            rentalEnd.setMonth(rentalEnd.getMonth() + monthsCount);
        }
        else {
            res.status(400).json({ message: 'Cannot determine rental end date.' });
            return;
        }
        if (rentalEnd <= rentalStart) {
            res.status(400).json({
                message: 'endDate must be after startDate',
            });
            return;
        }
        // Check for overlapping rentals for the same unit (rentalID)
        const overlappingRental = await rentalModel_1.RentalModel.findOne({
            unitID,
            $and: [
                { startDate: { $lte: rentalEnd } },
                { endDate: { $gte: rentalStart } },
            ],
        });
        if (overlappingRental) {
            console.log('Overlapping rental found:', overlappingRental);
            res.status(400).json({
                message: 'This unit already has a rental during the specified period.',
            });
            return;
        }
        const data = parsed.data; // Now fully typed and safe!
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
        // Check if rental already exists
        const existingRental = await rentalModel_1.RentalModel.findOne({
            moveTypeID,
            unitID,
            startDate,
            'participats.owner.userID': participats?.owner?.userID,
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
            table: 'rental',
            documentId: newRental._id,
            action: 'create', // or 'update' based on your logic
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff: newRental.toObject(), // Assuming you want to log the entire user object
            reason: 'User create new rental', // optional
        });
        res.status(201).json({
            message: 'rental created successfully',
            rental: newRental,
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
        console.error('Error fetching rental types:', error);
        res.status(500).json({ message: 'Failed to fetch rental types', error });
        return;
    }
});
exports.getRentalByID = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const rentalId = req.params.id;
        if (!rentalId) {
            res.status(400).json({ message: 'Rental ID is required' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(rentalId)) {
            res.status(400).json({ message: 'Invalid rental ID format' });
            return;
        }
        const rental = await rentalModel_1.RentalModel.findById(rentalId);
        console.log('rental', rental);
        if (!rental) {
            res.status(404).json({ message: 'rental not found' });
            return;
        }
        res.json(rental);
        return;
    }
    catch (error) {
        console.error('Error fetching rental types:', error);
        res.status(500).json({ message: 'Failed to fetch rental types', error });
        return;
    }
});
exports.deleteRental = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const userId = req.body.userID;
        // Assuming you have a way to fetch the user by ID
        const user = await userModel_1.default.findOne({ userID: userId });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const rentalId = req.params.id;
        if (!rentalId) {
            res.status(400).json({ message: 'Rental ID is required' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(rentalId)) {
            res.status(400).json({ message: 'Invalid rental ID format' });
            return;
        }
        const deletedrental = await rentalModel_1.RentalModel.findByIdAndDelete(rentalId);
        if (!deletedrental) {
            res.status(404).json({ message: 'rental not found' });
            return;
        }
        await (0, recordHistory_1.recordHistory)({
            table: 'rental',
            documentId: deletedrental._id,
            action: 'delete', // or 'update' based on your logic
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff: deletedrental.toObject(), // Assuming you want to log the entire user object
            reason: 'User delete rental', // optional
        });
        res.json({
            message: 'rental deleted successfully',
            rental: deletedrental,
        });
        return;
    }
    catch (error) {
        console.error('Error fetching rental :', error);
        res.status(500).json({ message: 'Failed to fetch rental ', error });
        return;
    }
});
exports.updateRental = (0, express_async_handler_1.default)(async (req, res) => {
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
        const rentalId = req.params.id;
        if (!rentalId) {
            res.status(400).json({ message: 'Rental ID is required' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(rentalId)) {
            res.status(400).json({ message: 'Invalid rental ID format' });
            return;
        }
        const existingDoc = await rentalModel_1.RentalModel.findById(rentalId);
        if (!existingDoc) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        const updateData = req.body;
        const mergedData = (0, deepMerge_1.deepMerge)(existingDoc.toObject(), updateData);
        const diff = (0, deepDiff_1.getDeepDiff)(existingDoc.toObject(), mergedData);
        // Find and update the notification
        if (!diff || Object.keys(diff).length === 0) {
            res.status(400).json({ message: 'No changes detected' });
            return;
        }
        const rental = await rentalModel_1.RentalModel.findByIdAndUpdate(rentalId, req.body, {
            new: true,
            runValidators: true,
        })
            .populate('moveTypeID')
            .populate('rentalSourceID')
            .populate('participats.owner.userID')
            .populate('participats.tentant.userID');
        if (!rental) {
            res.status(404).json({ message: 'rental not found' });
            return;
        }
        await (0, recordHistory_1.recordHistory)({
            table: 'rental',
            documentId: rental._id,
            action: 'update', // or 'update' based on your logic
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff, // Assuming you want to log the entire user object
            reason: 'User update rental', // optional
        });
        res.json({
            message: 'rental updated successfully',
            rental,
        });
        return;
    }
    catch (error) {
        console.error('Error updating rental:', error);
        res.status(500).json({ message: 'Failed to update rental', error });
        return;
    }
});
exports.getRentalsByUnitID = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const unitID = req.params.id;
        if (!unitID) {
            res.status(400).json({ message: 'Unit ID is required' });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(unitID)) {
            res.status(400).json({ message: 'Invalid unit ID format' });
            return;
        }
        const rentals = await rentalModel_1.RentalModel.find({ unitID })
            .populate('moveTypeID')
            .populate('rentalSourceID')
            .populate('participats.owner.userID')
            .populate('participats.tentant.userID');
        if (!rentals || rentals.length === 0) {
            res.status(404).json({ message: 'No rentals found for this unit' });
            return;
        }
        res.json(rentals);
        return;
    }
    catch (error) {
        console.error('Error fetching rentals by unit ID:', error);
        res.status(500).json({ message: 'Failed to fetch rentals', error });
        return;
    }
});
exports.getRentalsByUserID = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const userID = req.body.userID;
        if (!userID) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }
        const rentals = await rentalModel_1.RentalModel.find({
            'participats.owner.userID': userID,
        })
            .populate('moveTypeID')
            .populate('rentalSourceID')
            .populate('participats.owner.userID')
            .populate('participats.tentant.userID');
        if (!rentals || rentals.length === 0) {
            res.status(404).json({ message: 'No rentals found for this user' });
            return;
        }
        res.json(rentals);
        return;
    }
    catch (error) {
        console.error('Error fetching rentals by user ID:', error);
        res.status(500).json({ message: 'Failed to fetch rentals', error });
        return;
    }
});

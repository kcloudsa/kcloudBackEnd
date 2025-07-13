"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUnit = exports.updateUnit = exports.getUnitById = exports.getUnits = exports.createUnit = exports.nameUnit = void 0;
// eslint-disable-next-line import/no-extraneous-dependencies
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const unitModel_1 = require("../../models/unitModel");
const unit_1 = require("../../validation/unit");
const recordHistory_1 = require("../../Utils/recordHistory");
const userModel_1 = __importDefault(require("../../models/userModel"));
const deepMerge_1 = require("../../Utils/deepMerge");
const deepDiff_1 = require("../../Utils/deepDiff");
exports.nameUnit = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const emojis = ['yahia', '😀', '😳', '🙄'];
        res.json(emojis);
    }
    catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ message: 'Failed to fetch emojis', error });
    }
});
exports.createUnit = (0, express_async_handler_1.default)(async (req, res) => {
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
        const parsed = unit_1.createUintSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: 'Validation failed',
                errors: parsed.error.flatten(),
            });
            return;
        }
        const data = parsed.data; // Now fully typed and safe!
        // Check if unit already exists
        const existingUnit = await unitModel_1.UnitModel.findOne({
            number: data.number,
            uniteGroupID: data.uniteGroupID,
            userID: data.userID,
        });
        if (existingUnit) {
            res.status(400).json({
                message: 'Unit with this number in same uniteGroup already exists in the group',
            });
            return;
        }
        // Create unit payload
        const unitPayload = {
            uniteGroupID: data.uniteGroupID,
            userID: data.userID,
            unitTypeID: data.unitTypeId,
            number: data.number,
            description: data.description,
            notes: data.notes,
            processingCost: data.processingCost,
            location: data.location,
            baseUnit: data.baseUnit,
            unitMedia: data.unitMedia,
            favorite: data.favorite,
            unitStatus: data.unitStatus,
        };
        const newUnit = await unitModel_1.UnitModel.create(unitPayload);
        if (!newUnit) {
            res.status(400).json({ message: 'Failed to create unit' });
            return;
        }
        await (0, recordHistory_1.recordHistory)({
            table: 'Unit',
            documentId: newUnit._id,
            action: 'create', // or 'update' based on your logic
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff: newUnit.toObject(), // Assuming you want to log the entire user object
            reason: 'User create new unit', // optional
        });
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
exports.getUnits = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const units = await unitModel_1.UnitModel.find().populate('unitTypeID');
        res.json(units);
        return;
    }
    catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({ message: 'Failed to fetch units', error });
    }
});
exports.getUnitById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const unitId = req.params.id;
        if (!unitId) {
            res.status(400).json({ message: 'Unit ID is required' });
            return;
        }
        const unit = await unitModel_1.UnitModel.findById(unitId);
        if (!unit) {
            res.status(404).json({ message: 'Unit not found' });
            return;
        }
        res.json(unit);
    }
    catch (error) {
        console.error('Error fetching unit:', error);
        res.status(500).json({ message: 'Failed to fetch unit', error });
    }
});
exports.updateUnit = (0, express_async_handler_1.default)(async (req, res) => {
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
        const unitId = req.params.id;
        if (!unitId) {
            res.status(400).json({ message: 'Unit ID is required' });
            return;
        }
        const updateData = req.body.unit;
        const existingDoc = await unitModel_1.UnitModel.findById(unitId);
        if (!existingDoc) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const mergedData = (0, deepMerge_1.deepMerge)(existingDoc.toObject(), updateData);
        const updatedUnit = await unitModel_1.UnitModel.findByIdAndUpdate(unitId, mergedData, {
            new: true,
            runValidators: true,
        }).populate('unitTypeID');
        if (!updatedUnit) {
            res.status(404).json({ message: 'Unit not found' });
            return;
        }
        const original = existingDoc?.toObject();
        const updated = updatedUnit.toObject();
        const diff = (0, deepDiff_1.getDeepDiff)(original, updated);
        await (0, recordHistory_1.recordHistory)({
            table: 'Units',
            documentId: updatedUnit._id,
            action: 'update', // or 'create' based on your logic
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff, // Assuming you want to log the entire user object
            reason: 'User update unit ', // optional
        });
        res.json(updatedUnit);
    }
    catch (error) {
        console.error('Error updating unit:', error);
        res.status(500).json({ message: 'Failed to update unit', error });
    }
});
exports.deleteUnit = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const userId = req.body.userID;
        // Assuming you have a way to fetch the user by ID
        const user = await userModel_1.default.findOne({ userID: userId });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const unitId = req.params.id;
        if (!unitId) {
            res.status(400).json({ message: 'Unit ID is required' });
            return;
        }
        const deletedUnit = await unitModel_1.UnitModel.findByIdAndDelete(unitId);
        if (!deletedUnit) {
            res.status(404).json({ message: 'Unit not found' });
            return;
        }
        await (0, recordHistory_1.recordHistory)({
            table: 'Units',
            documentId: deletedUnit._id,
            action: 'delete', // or 'update' based on your logic
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff: deletedUnit.toObject(), // Assuming you want to log the entire user object
            reason: 'User delete unit ', // optional
        });
        res.json({ message: 'Unit deleted successfully', unit: deletedUnit });
    }
    catch (error) {
        console.error('Error deleting unit:', error);
        res.status(500).json({ message: 'Failed to delete unit', error });
    }
});

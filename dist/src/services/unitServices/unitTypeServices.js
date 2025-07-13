"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUnitType = exports.updateUnitType = exports.getUnitTypeById = exports.getUnitTypes = exports.createUnitType = exports.nameUnitType = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const unitTypeModel_1 = require("../../models/unitTypeModel");
const recordHistory_1 = require("../../Utils/recordHistory");
const userModel_1 = __importDefault(require("../../models/userModel"));
const unitTypies_1 = require("../../validation/unitTypies");
exports.nameUnitType = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const emojis = ['yahia', '😀', '😳', '🙄'];
        console.log('ddddddd');
        res.json(emojis);
        return;
    }
    catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ message: 'Failed to fetch emojis', error });
        return;
    }
});
exports.createUnitType = (0, express_async_handler_1.default)(async (req, res) => {
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
            res.status(400).json({ message: 'Unit type is required' });
            return;
        }
        console.log('type', type);
        const existingUnitType = await unitTypeModel_1.UnitTypeModel.findOne({
            type: type,
        });
        if (existingUnitType) {
            res.status(400).json({ message: 'Unit type already exists' });
            return;
        }
        const parsed = unitTypies_1.createUintTypeSchema.safeParse({ type });
        if (!parsed.success) {
            res.status(400).json({
                message: 'Validation failed',
                errors: parsed.error.flatten(),
            });
            return;
        }
        const newUnitType = await unitTypeModel_1.UnitTypeModel.create({
            type: type,
        });
        await (0, recordHistory_1.recordHistory)({
            table: 'UnitType',
            documentId: newUnitType._id,
            action: 'create', // or 'update' based on your logic
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff: newUnitType.toObject(), // Assuming you want to log the entire user object
            reason: 'User create new unit type', // optional
        });
        res.status(201).json({
            message: 'Unit type created successfully',
            unitType: newUnitType,
        });
        return;
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create unit type', error });
        return;
    }
});
exports.getUnitTypes = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const unitTypes = await unitTypeModel_1.UnitTypeModel.find();
        res.json(unitTypes);
        return;
    }
    catch (error) {
        console.error('Error fetching unit types:', error);
        res.status(500).json({ message: 'Failed to fetch unit types', error });
        return;
    }
});
exports.getUnitTypeById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const unitTypeId = req.params.id;
        if (!unitTypeId) {
            res.status(400).json({ message: 'Unit type ID is required' });
            return;
        }
        const unitType = await unitTypeModel_1.UnitTypeModel.findById(unitTypeId);
        if (!unitType) {
            res.status(404).json({ message: 'Unit type not found' });
            return;
        }
        res.json(unitType);
    }
    catch (error) {
        console.error('Error fetching unit type:', error);
        res.status(500).json({ message: 'Failed to fetch unit type', error });
    }
});
exports.updateUnitType = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const unitTypeId = req.params.id;
        if (!unitTypeId) {
            res.status(400).json({ message: 'Unit type ID is required' });
            return;
        }
        const updateData = req.body;
        if (!updateData || Object.keys(updateData).length === 0) {
            res.status(400).json({ message: 'Update data is required' });
            return;
        }
        const existingUnitType = await unitTypeModel_1.UnitTypeModel.findById(unitTypeId);
        if (!existingUnitType) {
            res.status(404).json({ message: 'Unit type not found' });
            return;
        }
        // Validate the update data against the existing unit type schema
        // Here you can add any specific validation logic if needed
        // For example, you might want to check if the type is valid
        if (updateData.type && typeof updateData.type !== 'string') {
            res.status(400).json({ message: 'Invalid unit type format' });
            return;
        }
        if (updateData.type === existingUnitType.type) {
            res.status(400).json({ message: 'No changes detected in unit type' });
            return;
        }
        // Record the history before updating
        const userId = req.body.userID;
        const user = await userModel_1.default.findOne({ userID: userId });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const updatedUnitType = await unitTypeModel_1.UnitTypeModel.findByIdAndUpdate(unitTypeId, { type: updateData.type }, {
            new: true,
            runValidators: true,
        });
        if (!updatedUnitType) {
            res.status(404).json({ message: 'Unit type not found' });
            return;
        }
        // const diff = getDeepDiff(existingUnitType, updatedUnitType);
        const diff = {};
        diff.type = {
            from: existingUnitType.type,
            to: updatedUnitType.type,
        };
        await (0, recordHistory_1.recordHistory)({
            table: 'UnitType',
            documentId: existingUnitType._id,
            action: 'update',
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff, // Assuming you want to log the changes
            reason: 'User updated unit type', // optional
        });
        res.status(200).json(updatedUnitType);
    }
    catch (error) {
        console.error('Error updating unit type:', error);
        res.status(500).json({ message: 'Failed to update unit type', error });
    }
});
exports.deleteUnitType = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const unitTypeId = req.params.id;
        if (!unitTypeId) {
            res.status(400).json({ message: 'Unit type ID is required' });
            return;
        }
        const existingUnitType = await unitTypeModel_1.UnitTypeModel.findById(unitTypeId);
        if (!existingUnitType) {
            res.status(404).json({ message: 'Unit type not found' });
            return;
        }
        const userId = req.body.userID;
        const user = await userModel_1.default.findOne({ userID: userId });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        await unitTypeModel_1.UnitTypeModel.findByIdAndDelete(unitTypeId);
        // Record the history after deletion
        await (0, recordHistory_1.recordHistory)({
            table: 'UnitType',
            documentId: existingUnitType._id,
            action: 'delete',
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff: existingUnitType.toObject(), // Assuming you want to log the deleted unit type
            reason: 'User deleted unit type', // optional
        });
        res.status(200).json({ message: 'Unit type deleted successfully' });
        return;
    }
    catch (error) {
        console.error('Error deleting unit type:', error);
        res.status(500).json({ message: 'Failed to delete unit type', error });
        return;
    }
});

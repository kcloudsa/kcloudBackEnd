"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUnitGroup = exports.updateUnitGroup = exports.getUnitGroupById = exports.createUnitGroup = exports.getAllUnitGroups = exports.nameUnitGroup = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const unitGroupModel_1 = require("../../models/unitGroupModel");
const unitGroups_1 = require("../../validation/unitGroups");
const recordHistory_1 = require("../../Utils/recordHistory");
const userModel_1 = __importDefault(require("../../models/userModel"));
const deepDiff_1 = require("../../Utils/deepDiff");
const deepMerge_1 = require("../../Utils/deepMerge");
exports.nameUnitGroup = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const emojis = ['yahia', '😀', '😳', '🙄'];
        res.json(emojis);
        return;
    }
    catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ message: 'Failed to fetch emojis', error });
        return;
    }
});
exports.getAllUnitGroups = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const groups = await unitGroupModel_1.UnitGroupModel.find({});
        if (!groups || groups.length === 0) {
            res.status(200).json({ message: 'No unit groups found', data: [] });
            return;
        }
        res.status(200).json(groups);
        return;
    }
    catch (error) {
        console.error('Error fetching unit groups:', error);
        res.status(500).json({ message: 'Failed to fetch unit groups', error });
    }
});
exports.createUnitGroup = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { name, description, unitGroupStatus } = req.body;
        // Use authenticated user from Passport (req.user)
        const user = req.user;
        if (!user || !name) {
            res.status(400).json({ message: 'User and name are required' });
            return;
        }
        const parsed = unitGroups_1.createUintGroupsSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: 'Validation failed',
                errors: parsed.error.flatten(),
            });
            return;
        }
        // ensure user exists in DB (optional)
        const dbUser = await userModel_1.default.findOne({ userID: user.userID }) || user;
        if (!dbUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Check if the unit group already exists
        const existingGroup = await unitGroupModel_1.UnitGroupModel.findOne({
            name: name,
            userID: user._id,
        });
        if (existingGroup) {
            res.status(400).json({ message: 'Unit group already exists' });
            return;
        }
        // Create the new unit group
        const newGroup = new unitGroupModel_1.UnitGroupModel({
            userID: user._id,
            name,
            description: description || '',
            unitGroupStatus: unitGroupStatus || 'active',
        });
        const savedGroup = await newGroup.save();
        if (!savedGroup) {
            res.status(500).json({ message: 'Failed to create unit group' });
            return;
        }
        await (0, recordHistory_1.recordHistory)({
            table: 'UnitGroups',
            documentId: savedGroup._id,
            action: 'create', // or 'update' based on your logic
            performedBy: {
                userId: dbUser._id,
                name: (dbUser.userName && (dbUser.userName.slug || dbUser.userName.displayName)) || dbUser.name || dbUser.email,
                role: dbUser.role,
            },
            diff: savedGroup.toObject(), // Assuming you want to log the entire user object
            reason: 'User create new unit type', // optional
        });
        res.status(201).json(savedGroup);
        return;
    }
    catch (error) {
        console.error('Error creating unit group:', error);
        res.status(500).json({ message: 'Failed to create unit group', error });
    }
});
exports.getUnitGroupById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: 'Unit group ID is required' });
            return;
        }
        const group = await unitGroupModel_1.UnitGroupModel.findById(id);
        if (!group) {
            res.status(404).json({ message: 'Unit group not found' });
            return;
        }
        res.status(200).json(group);
        return;
    }
    catch (error) {
        console.error('Error fetching unit group:', error);
        res.status(500).json({ message: 'Failed to fetch unit group', error });
    }
});
exports.updateUnitGroup = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, unitGroupStatus } = req.body;
        const userID = req.body.userID || req.user?.userID || req.user?._id?.toString();
        if (!id) {
            res.status(400).json({ message: 'Unit group ID is required' });
            return;
        }
        if (!name && !description && !unitGroupStatus) {
            res.status(400).json({
                message: 'At least one field (name, description, unitGroupStatus) is required for update',
            });
            return;
        }
        const user = req.user;
        if (!user) {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            return;
        }
        const existingGroup = await unitGroupModel_1.UnitGroupModel.findById(id);
        if (!existingGroup) {
            res.status(404).json({ message: 'Unit group not found' });
            return;
        }
        const deepMerg = (0, deepMerge_1.deepMerge)(existingGroup.toObject(), {
            name,
            description,
            unitGroupStatus,
        });
        const diff = (0, deepDiff_1.getDeepDiff)(existingGroup.toObject(), {
            name: deepMerg.name,
            description: deepMerg.description,
            unitGroupStatus: deepMerg.unitGroupStatus,
        });
        if (!diff || Object.keys(diff).length === 0) {
            res.status(400).json({ message: 'No changes detected' });
            return;
        }
        const updatedGroup = await unitGroupModel_1.UnitGroupModel.findByIdAndUpdate(id, {
            name,
            description,
            unitGroupStatus,
        }, { new: true });
        if (!updatedGroup) {
            res.status(404).json({ message: 'Unit group not found' });
            return;
        }
        const dbUser = await userModel_1.default.findOne({ userID: user.userID }) || user;
        await (0, recordHistory_1.recordHistory)({
            table: 'UnitGroups',
            documentId: updatedGroup._id,
            action: 'update', // or 'create' based on your logic
            performedBy: {
                userId: dbUser._id,
                name: (dbUser.userName && (dbUser.userName.slug || dbUser.userName.displayName)) || dbUser.name || dbUser.email,
                role: dbUser.role,
            },
            diff, // Assuming you want to log the entire user object
            reason: 'User updated unit group', // optional
        });
        res.status(200).json(updatedGroup);
        return;
    }
    catch (error) {
        console.error('Error updating unit group:', error);
        res.status(500).json({ message: 'Failed to update unit group', error });
    }
});
exports.deleteUnitGroup = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: 'Unit group ID is required' });
            return;
        }
        const deletedGroup = await unitGroupModel_1.UnitGroupModel.findByIdAndDelete(id);
        if (!deletedGroup) {
            res.status(404).json({ message: 'Unit group not found' });
            return;
        }
        const user = await userModel_1.default.findOne({ userID: deletedGroup.userID }) || req.user;
        if (!user) {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            return;
        }
        await (0, recordHistory_1.recordHistory)({
            table: 'UnitGroups',
            documentId: deletedGroup._id,
            action: 'delete',
            performedBy: {
                userId: user._id,
                name: (user.userName && (user.userName.slug || user.userName.displayName)) || user.name || user.email,
                role: user.role,
            },
            diff: deletedGroup.toObject(),
            reason: 'User deleted unit group', // optional
        });
        res.status(200).json({ message: 'Unit group deleted successfully' });
        return;
    }
    catch (error) {
        console.error('Error deleting unit group:', error);
        res.status(500).json({ message: 'Failed to delete unit group', error });
    }
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRentalSource = exports.updateRentalSource = exports.getRentalSourceById = exports.createRentalSource = exports.getRentalSources = exports.namerentalSource = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const recordHistory_1 = require("../../Utils/recordHistory");
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
        // If caller provided a user filter (some front-end calls include the user id),
        // return only that user's rental sources. Otherwise return all.
        const filter = {};
        const user = req.user;
        const queryUserId = (req.query && (req.query.userID || req.query.userId));
        if (queryUserId)
            filter.userId = queryUserId;
        else if (user && user._id)
            filter.userId = user._id;
        const rentalSource = await rentalSourceModel_1.RentalSourceModel.find(filter);
        res.json({ success: true, data: rentalSource });
        return;
    }
    catch (error) {
        console.error('Error fetching unit types:', error);
        res.status(500).json({ message: 'Failed to fetch rental sources', error });
        return;
    }
});
exports.createRentalSource = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { SourceName, description } = req.body;
        // Use authenticated user from Passport (req.user) per migration guide
        const user = req.user;
        if (!user) {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            return;
        }
        if (!SourceName) {
            res.status(400).json({ message: 'SourceName is required' });
            return;
        }
        // Ensure uniqueness per user
        const existingRentalSource = await rentalSourceModel_1.RentalSourceModel.findOne({
            SourceName,
            userId: user._id,
        });
        if (existingRentalSource) {
            res.status(409).json({ message: 'Rental source already exists for this user' });
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
            userId: user._id,
        });
        await (0, recordHistory_1.recordHistory)({
            table: 'RentalSource',
            documentId: newRentalSource._id,
            action: 'create',
            performedBy: {
                userId: user._id,
                name: ((user.userName && (user.userName.slug || user.userName.displayName)) || user.contactInfo.email),
                role: user.role,
            },
            diff: newRentalSource.toObject(),
            reason: 'User create new Rental source',
        });
        res.status(201).json({
            success: true,
            message: 'Rental source created successfully',
            data: newRentalSource,
        });
        return;
    }
    catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ message: 'Failed to create rental source', error });
        return;
    }
});
exports.getRentalSourceById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ message: 'id parameter is required' });
            return;
        }
        const rentalSource = await rentalSourceModel_1.RentalSourceModel.findById(id);
        if (!rentalSource) {
            res.status(404).json({ success: false, message: 'Rental source not found' });
            return;
        }
        res.json({ success: true, data: rentalSource });
        return;
    }
    catch (error) {
        console.error('Error fetching rental source by id:', error);
        res.status(500).json({ message: 'Failed to fetch rental source', error });
        return;
    }
});
exports.updateRentalSource = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ message: 'id parameter is required' });
            return;
        }
        const user = req.user;
        if (!user) {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            return;
        }
        const existing = await rentalSourceModel_1.RentalSourceModel.findById(id);
        if (!existing) {
            res.status(404).json({ message: 'Rental source not found' });
            return;
        }
        if (existing.userId && String(existing.userId) !== String(user._id)) {
            res.status(403).json({ message: 'Forbidden: cannot modify this rental source' });
            return;
        }
        const { SourceName, description } = req.body || {};
        if (!SourceName || typeof SourceName !== 'string' || !SourceName.trim()) {
            res.status(400).json({ message: 'SourceName is required' });
            return;
        }
        if (SourceName.trim() === existing.SourceName && (description ?? '') === (existing.description ?? '')) {
            res.status(400).json({ message: 'No changes detected' });
            return;
        }
        // Ensure uniqueness per user
        const duplicate = await rentalSourceModel_1.RentalSourceModel.findOne({ SourceName: SourceName.trim(), userId: existing.userId });
        if (duplicate && String(duplicate._id) !== String(existing._id)) {
            res.status(409).json({ message: 'Rental source already exists for this user' });
            return;
        }
        const prev = existing.toObject();
        existing.SourceName = SourceName.trim();
        if (typeof description === 'string')
            existing.description = description;
        const updated = await existing.save();
        await (0, recordHistory_1.recordHistory)({
            table: 'RentalSource',
            documentId: updated._id,
            action: 'update',
            performedBy: {
                userId: user._id,
                name: ((user.userName && (user.userName.slug || user.userName.displayName)) || user.contactInfo?.email),
                role: user.role,
            },
            diff: {
                SourceName: { from: prev.SourceName, to: updated.SourceName },
                ...(prev.description !== updated.description ? { description: { from: prev.description, to: updated.description } } : {}),
            },
            reason: 'User updated rental source',
        });
        res.status(200).json({ success: true, data: updated });
        return;
    }
    catch (error) {
        console.error('Error updating rental source:', error);
        res.status(500).json({ message: 'Failed to update rental source', error });
        return;
    }
});
exports.deleteRentalSource = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ message: 'id parameter is required' });
            return;
        }
        const user = req.user;
        if (!user) {
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            return;
        }
        const existing = await rentalSourceModel_1.RentalSourceModel.findById(id);
        if (!existing) {
            res.status(404).json({ message: 'Rental source not found' });
            return;
        }
        if (existing.userId && String(existing.userId) !== String(user._id)) {
            res.status(403).json({ message: 'Forbidden: cannot delete this rental source' });
            return;
        }
        await rentalSourceModel_1.RentalSourceModel.findByIdAndDelete(id);
        await (0, recordHistory_1.recordHistory)({
            table: 'RentalSource',
            documentId: existing._id,
            action: 'delete',
            performedBy: {
                userId: user._id,
                name: ((user.userName && (user.userName.slug || user.userName.displayName)) || user.contactInfo?.email),
                role: user.role,
            },
            diff: existing.toObject(),
            reason: 'User deleted rental source',
        });
        res.status(200).json({ success: true, message: 'Rental source deleted successfully' });
        return;
    }
    catch (error) {
        console.error('Error deleting rental source:', error);
        res.status(500).json({ message: 'Failed to delete rental source', error });
        return;
    }
});

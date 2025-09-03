"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRentalSourceById = exports.createRentalSource = exports.getRentalSources = exports.namerentalSource = void 0;
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

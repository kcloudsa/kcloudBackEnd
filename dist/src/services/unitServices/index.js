"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUnit = exports.listSpecialPrices = exports.deleteSpecialPrice = exports.addSpecialPrices = exports.updateUnit = exports.getUnitById = exports.getUnits = exports.createUnit = exports.nameUnit = void 0;
// eslint-disable-next-line import/no-extraneous-dependencies
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const unitModel_1 = require("../../models/unitModel");
const unit_1 = require("../../validation/unit");
const recordHistory_1 = require("../../Utils/recordHistory");
const mongoose_1 = require("mongoose");
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
        const user = req.user; // User from Passport authentication
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
            userID: user._id,
            unitTypeID: data.unitTypeID,
        });
        if (existingUnit) {
            res.status(400).json({
                success: false,
                message: 'Unit with this number in same uniteGroup already exists in the group',
                code: 'DUPLICATE_UNIT'
            });
            return;
        }
        // Create unit payload
        const unitPayload = {
            uniteGroupID: data.uniteGroupID,
            userID: user._id,
            unitTypeID: data.unitTypeID,
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
            res.status(400).json({
                success: false,
                message: 'Failed to create unit',
                code: 'CREATION_FAILED'
            });
            return;
        }
        // Auto-update unit status based on existing rentals/maintenance
        try {
            const { updateUnitStatus } = await Promise.resolve().then(() => __importStar(require('../statusUpdateServices')));
            await updateUnitStatus(newUnit._id);
        }
        catch (statusError) {
            console.warn('Warning: Could not update unit status:', statusError);
            // Don't fail the request if status update fails
        }
        await (0, recordHistory_1.recordHistory)({
            table: 'Unit',
            documentId: newUnit._id,
            action: 'create',
            performedBy: {
                userId: user._id,
                name: user.userName?.slug || user.email,
                role: user.role,
            },
            diff: newUnit.toObject(),
            reason: 'User create new unit',
        });
        res.status(201).json({
            success: true,
            message: 'Unit created successfully',
            data: newUnit,
            meta: {
                createdBy: user.userName?.slug || user.email,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error creating unit:', error);
        res.status(500).json({ message: 'Failed to create unit', error });
    }
});
exports.getUnits = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { filters, pagination, sort, populate, select } = req.authenticatedQuery;
        const user = req.user;
        const includeAnalytics = req.includeAnalytics || false;
        // Build query
        let query = unitModel_1.UnitModel.find(filters);
        // Apply sorting
        query = query.sort(sort);
        // Normalize select (support comma or space separated)
        let finalSelect = select;
        if (typeof finalSelect === 'string') {
            finalSelect = finalSelect.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
        }
        // Determine all ref paths in schema (for auto-populate fallback)
        const schemaRefPaths = Object.entries(unitModel_1.UnitModel.schema.paths)
            .filter(([, pathSchema]) => pathSchema?.options?.ref)
            .map(([name]) => name);
        // Requested populate or auto
        const requestedPopulate = Array.isArray(populate) && populate.length > 0 ? populate : schemaRefPaths;
        // Ensure that when selecting specific fields, local ref id fields needed for populate are included BEFORE applying select
        if (finalSelect) {
            const tokens = new Set(finalSelect.split(' ').filter(Boolean));
            const hasExclusions = Array.from(tokens).some((t) => t.startsWith('-'));
            // Only auto-include populate paths for inclusion-type selects
            if (!hasExclusions && requestedPopulate.length > 0) {
                for (const p of requestedPopulate)
                    tokens.add(p);
            }
            finalSelect = Array.from(tokens).join(' ');
            query = query.select(finalSelect);
        }
        // Apply population AFTER select so Mongoose still has the id field values (select above ensured inclusion)
        for (const field of requestedPopulate) {
            query = query.populate({ path: field });
        }
        // Execute queries in parallel for better performance
        const [units, totalCount, analytics] = await Promise.all([
            query.skip(pagination.skip).limit(pagination.limit).lean(false).exec(),
            unitModel_1.UnitModel.countDocuments(filters),
            includeAnalytics ? getUnitsAnalytics(filters) : Promise.resolve(null)
        ]);
        // Auto-update unit statuses in background (don't wait for completion)
        if (units.length > 0) {
            setTimeout(async () => {
                try {
                    const { updateMultipleUnitsStatus } = await Promise.resolve().then(() => __importStar(require('../statusUpdateServices')));
                    const unitIds = units.map((unit) => unit._id);
                    await updateMultipleUnitsStatus(unitIds);
                }
                catch (statusError) {
                    console.warn('Warning: Could not update units status:', statusError);
                }
            }, 100); // Small delay to not block the response
        }
        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / pagination.limit);
        const hasNextPage = pagination.page < totalPages;
        const hasPrevPage = pagination.page > 1;
        // Build response
        const response = {
            success: true,
            data: units,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                totalCount,
                totalPages,
                hasNextPage,
                hasPrevPage
            },
            meta: {
                requestedBy: user.userName?.slug || user.email,
                timestamp: new Date().toISOString(),
                filters: Object.keys(filters).length > 1 ? filters : undefined, // Exclude userID from display
                populatedPaths: requestedPopulate
            }
        };
        if (analytics) {
            response.analytics = analytics;
        }
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch units',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
// Helper function for analytics (admin only)
const getUnitsAnalytics = async (baseFilters) => {
    try {
        const [statusDistribution, costStats, recentActivity] = await Promise.all([
            unitModel_1.UnitModel.aggregate([
                { $match: baseFilters },
                { $group: { _id: '$unitStatus', count: { $sum: 1 } } }
            ]),
            unitModel_1.UnitModel.aggregate([
                { $match: baseFilters },
                {
                    $group: {
                        _id: null,
                        avgCost: { $avg: '$processingCost' },
                        minCost: { $min: '$processingCost' },
                        maxCost: { $max: '$processingCost' },
                        totalUnits: { $sum: 1 }
                    }
                }
            ]),
            unitModel_1.UnitModel.find(baseFilters)
                .sort({ createdAt: -1 })
                .limit(5)
                .select('number unitStatus createdAt')
        ]);
        return {
            statusDistribution,
            costStats: costStats[0] || {},
            recentActivity
        };
    }
    catch (error) {
        console.error('Error generating analytics:', error);
        return null;
    }
};
exports.getUnitById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const unitId = req.params.id;
        const user = req.user;
        if (!unitId || !mongoose_1.Types.ObjectId.isValid(unitId)) {
            res.status(400).json({
                success: false,
                message: 'Valid Unit ID is required',
                code: 'INVALID_UNIT_ID'
            });
            return;
        }
        // Security check: ensure user can only access their own units (unless admin)
        const filter = { _id: unitId };
        if (user.role !== 'admin') {
            filter.userID = user._id;
        }
        // Auto-populate all referenced fields defined in schema
        const schemaRefPaths = Object.entries(unitModel_1.UnitModel.schema.paths)
            .filter(([, pathSchema]) => pathSchema?.options?.ref)
            .map(([name]) => name);
        let docQuery = unitModel_1.UnitModel.findOne(filter);
        for (const path of schemaRefPaths) {
            docQuery = docQuery.populate({ path });
        }
        const unit = await docQuery;
        if (!unit) {
            res.status(404).json({
                success: false,
                message: 'Unit not found or access denied',
                code: 'UNIT_NOT_FOUND'
            });
            return;
        }
        res.json({
            success: true,
            data: unit,
            meta: {
                requestedBy: user.userName?.slug || user.email,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error fetching unit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unit',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
exports.updateUnit = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = req.user; // User from Passport authentication
        const unitId = req.params.id;
        if (!unitId || !mongoose_1.Types.ObjectId.isValid(unitId)) {
            res.status(400).json({
                success: false,
                message: 'Valid Unit ID is required',
                code: 'INVALID_UNIT_ID'
            });
            return;
        }
        const updateData = req.body;
        // Security check: ensure user can only update their own units (unless admin)
        const filter = { _id: unitId };
        if (user.role !== 'admin') {
            filter.userID = user._id;
        }
        const existingDoc = await unitModel_1.UnitModel.findOne(filter);
        if (!existingDoc) {
            res.status(404).json({
                success: false,
                message: 'Unit not found or access denied',
                code: 'UNIT_NOT_FOUND'
            });
            return;
        }
        updateData.userID = user._id;
        const mergedData = (0, deepMerge_1.deepMerge)(existingDoc.toObject(), updateData);
        const original = existingDoc?.toObject();
        const diff = (0, deepDiff_1.getDeepDiff)(original, mergedData);
        if (!diff || Object.keys(diff).length === 0) {
            res.status(400).json({
                success: false,
                message: 'No changes detected',
                code: 'NO_CHANGES'
            });
            return;
        }
        const updatedUnit = await unitModel_1.UnitModel.findByIdAndUpdate(unitId, mergedData, {
            new: true,
            runValidators: true,
        });
        if (!updatedUnit) {
            res.status(404).json({
                success: false,
                message: 'Unit not found',
                code: 'UNIT_NOT_FOUND'
            });
            return;
        }
        await (0, recordHistory_1.recordHistory)({
            table: 'Units',
            documentId: updatedUnit._id,
            action: 'update',
            performedBy: {
                userId: user._id,
                name: user.userName?.slug || user.email,
                role: user.role,
            },
            diff,
            reason: 'User update unit',
        });
        res.json({
            success: true,
            data: updatedUnit,
            meta: {
                updatedBy: user.userName?.slug || user.email,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error updating unit:', error);
        res.status(500).json({ message: 'Failed to update unit', error });
    }
});
// ---- Special Prices Handlers ----
exports.addSpecialPrices = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = req.user;
        const unitId = req.params.id;
        if (!unitId || !mongoose_1.Types.ObjectId.isValid(unitId)) {
            res.status(400).json({ success: false, message: 'Valid Unit ID is required', code: 'INVALID_UNIT_ID' });
            return;
        }
        const payload = Array.isArray(req.body) ? req.body : req.body?.specialPrices;
        if (!Array.isArray(payload)) {
            res.status(400).json({ success: false, message: 'specialPrices array required' });
            return;
        }
        // Basic validation
        const sanitized = payload.map((sp) => ({
            type: sp.type,
            dayOfWeek: sp.dayOfWeek,
            date: sp.date ? new Date(sp.date) : undefined,
            price: sp.price,
        }));
        const unit = await unitModel_1.UnitModel.findOne({ _id: unitId, userID: user._id });
        if (!unit) {
            res.status(404).json({ success: false, message: 'Unit not found' });
            return;
        }
        // Merge logic: replace existing rules of same (once date / weekly dayOfWeek)
        sanitized.forEach((rule) => {
            if (rule.type === 'once' && rule.date) {
                const ruleDateStr = rule.date.toISOString().slice(0, 10);
                unit.specialPrices = unit.specialPrices.filter((sp) => !(sp.type === 'once' && sp.date && sp.date.toISOString().slice(0, 10) === ruleDateStr));
            }
            if (rule.type === 'weekly' && rule.dayOfWeek) {
                unit.specialPrices = unit.specialPrices.filter((sp) => !(sp.type === 'weekly' && sp.dayOfWeek === rule.dayOfWeek));
            }
            unit.specialPrices.push(rule);
        });
        await unit.save();
        res.json({ success: true, data: unit.specialPrices });
    }
    catch (err) {
        console.error('Error adding special prices', err);
        res.status(500).json({ success: false, message: 'Failed to add special prices' });
    }
});
exports.deleteSpecialPrice = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = req.user;
        const unitId = req.params.id;
        const spId = req.params.spId;
        if (!unitId || !mongoose_1.Types.ObjectId.isValid(unitId) || !spId) {
            res.status(400).json({ success: false, message: 'Valid Unit ID and special price ID are required' });
            return;
        }
        const unit = await unitModel_1.UnitModel.findOne({ _id: unitId, userID: user._id });
        if (!unit) {
            res.status(404).json({ success: false, message: 'Unit not found' });
            return;
        }
        const before = unit.specialPrices.length;
        unit.specialPrices = unit.specialPrices.filter((sp) => sp._id?.toString() !== spId);
        if (unit.specialPrices.length === before) {
            res.status(404).json({ success: false, message: 'Special price not found' });
            return;
        }
        await unit.save();
        res.json({ success: true, data: unit.specialPrices });
    }
    catch (err) {
        console.error('Error deleting special price', err);
        res.status(500).json({ success: false, message: 'Failed to delete special price' });
    }
});
exports.listSpecialPrices = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = req.user;
        const unitId = req.params.id;
        if (!unitId || !mongoose_1.Types.ObjectId.isValid(unitId)) {
            res.status(400).json({ success: false, message: 'Valid Unit ID is required' });
            return;
        }
        const unit = await unitModel_1.UnitModel.findOne({ _id: unitId, userID: user._id }).select('specialPrices');
        if (!unit) {
            res.status(404).json({ success: false, message: 'Unit not found' });
            return;
        }
        res.json({ success: true, data: unit.specialPrices || [] });
    }
    catch (err) {
        console.error('Error listing special prices', err);
        res.status(500).json({ success: false, message: 'Failed to list special prices' });
    }
});
exports.deleteUnit = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = req.user; // User from Passport authentication
        const unitId = req.params.id;
        if (!unitId || !mongoose_1.Types.ObjectId.isValid(unitId)) {
            res.status(400).json({
                success: false,
                message: 'Valid Unit ID is required',
                code: 'INVALID_UNIT_ID'
            });
            return;
        }
        // Security check: ensure user can only delete their own units (unless admin)
        const filter = { _id: unitId };
        if (user.role !== 'admin') {
            filter.userID = user._id;
        }
        const deletedUnit = await unitModel_1.UnitModel.findOneAndDelete(filter);
        if (!deletedUnit) {
            res.status(404).json({
                success: false,
                message: 'Unit not found or access denied',
                code: 'UNIT_NOT_FOUND'
            });
            return;
        }
        await (0, recordHistory_1.recordHistory)({
            table: 'Units',
            documentId: deletedUnit._id,
            action: 'delete',
            performedBy: {
                userId: user._id,
                name: user.userName?.slug || user.email,
                role: user.role,
            },
            diff: deletedUnit.toObject(),
            reason: 'User delete unit',
        });
        res.json({
            success: true,
            message: 'Unit deleted successfully',
            data: deletedUnit,
            meta: {
                deletedBy: user.userName?.slug || user.email,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error deleting unit:', error);
        res.status(500).json({ message: 'Failed to delete unit', error });
    }
});

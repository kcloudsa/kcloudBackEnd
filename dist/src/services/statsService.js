"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertStatsFor = exports.getStats = exports.computeStatsForUser = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const statsModel_1 = require("../models/statsModel");
const unitModel_1 = require("../models/unitModel");
const rentalModel_1 = require("../models/rentalModel");
const maintenanceRequestModel_1 = require("../models/maintenanceRequestModel");
const mongoose_1 = __importDefault(require("mongoose"));
// Helper: compute summary stats for a user within optional date range and scope
const computeStatsForUser = async (userId, options = {}) => {
    const { scope, scopeID, from, to } = options;
    const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
    // Build time filter helper
    const timeFilter = {};
    if (from)
        timeFilter.$gte = from;
    if (to)
        timeFilter.$lte = to;
    // Net monthly profit (example): sum of rentalAmount for active rentals in range
    const rentalMatch = { 'participats.owner.userID': userObjectId }; // owner-based
    if (scope === 'unit' && scopeID)
        rentalMatch.unitID = scopeID;
    if (from || to)
        rentalMatch.startDate = timeFilter;
    const rentals = await rentalModel_1.RentalModel.find(rentalMatch).lean();
    const totalRentalIncome = rentals.reduce((sum, r) => sum + (Number(r.rentalAmount) || 0), 0);
    // Occupancy: number of active rentals over total units
    const units = await unitModel_1.UnitModel.find({ userID: userObjectId }).lean();
    const totalUnits = units.length;
    const occupiedUnits = new Set(rentals
        .filter((r) => r.rentalStatus === 'active')
        .map((r) => String(r.unitID)));
    // Maintenance: counts
    const maintMatch = { unitID: { $in: units.map((u) => u._id) } };
    if (from || to)
        maintMatch.createdAt = timeFilter;
    const maintenanceCount = await maintenanceRequestModel_1.MaintenanceRequestModel.countDocuments(maintMatch);
    const values = {
        totalRentalIncome,
        totalUnits,
        occupiedUnits: occupiedUnits.size,
        occupancyRate: totalUnits > 0 ? (occupiedUnits.size / totalUnits) * 100 : 0,
        maintenanceCount,
    };
    return values;
};
exports.computeStatsForUser = computeStatsForUser;
exports.getStats = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Auth required' });
            return;
        }
        // Accept POST body for flexible queries
        const body = req.method === 'POST' ? req.body : req.query;
        const { scope = 'all', scopeID, from, to } = body || {};
        // parse dates
        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;
        // Try to find existing precomputed stat entry
        const existing = await statsModel_1.StatsModel.findOne({
            userID: user._id,
            scope,
            scopeID: scopeID || undefined,
            from: fromDate || undefined,
            to: toDate || undefined,
        });
        if (existing) {
            res.json({ success: true, data: existing.values, cached: true });
            return;
        }
        // compute on demand and save
        const values = await (0, exports.computeStatsForUser)(String(user._id), {
            scope,
            scopeID,
            from: fromDate,
            to: toDate,
        });
        await statsModel_1.StatsModel.create({
            userID: user._id,
            scope,
            scopeID: scopeID || undefined,
            from: fromDate || undefined,
            to: toDate || undefined,
            values,
        });
        res.json({ success: true, data: values, cached: false });
        return;
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res
            .status(500)
            .json({ success: false, message: 'Failed to fetch stats', error });
    }
});
// Recompute and upsert stats for a user and optional scope
const upsertStatsFor = async (userId, options = {}) => {
    const values = await (0, exports.computeStatsForUser)(userId, options);
    const query = { userID: userId, scope: options.scope || 'all' };
    if (options.scopeID)
        query.scopeID = options.scopeID;
    if (options.from)
        query.from = options.from;
    if (options.to)
        query.to = options.to;
    await statsModel_1.StatsModel.findOneAndUpdate(query, { $set: { values, updatedAt: new Date() } }, { upsert: true });
};
exports.upsertStatsFor = upsertStatsFor;
exports.default = {
    getStats: exports.getStats,
    upsertStatsFor: exports.upsertStatsFor,
    computeStatsForUser: exports.computeStatsForUser,
};

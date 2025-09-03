import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { StatsModel } from '../models/statsModel';
import { UnitModel } from '../models/unitModel';
import { RentalModel } from '../models/rentalModel';
import { MaintenanceRequestModel } from '../models/maintenanceRequestModel';
import mongoose from 'mongoose';

// Helper: compute summary stats for a user within optional date range and scope
export const computeStatsForUser = async (
  userId: string,
  options: { scope?: string; scopeID?: string; from?: Date; to?: Date } = {},
) => {
  const { scope, scopeID, from, to } = options;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Build time filter helper
  const timeFilter: any = {};
  if (from) timeFilter.$gte = from;
  if (to) timeFilter.$lte = to;

  // Net monthly profit (example): sum of rentalAmount for active rentals in range
  const rentalMatch: any = { 'participats.owner.userID': userObjectId }; // owner-based
  if (scope === 'unit' && scopeID) rentalMatch.unitID = scopeID;
  if (from || to) rentalMatch.startDate = timeFilter;

  const rentals = await RentalModel.find(rentalMatch).lean();

  const totalRentalIncome = rentals.reduce(
    (sum: number, r: any) => sum + (Number(r.rentalAmount) || 0),
    0,
  );

  // Occupancy: number of active rentals over total units
  const units = await UnitModel.find({ userID: userObjectId }).lean();
  const totalUnits = units.length;
  const occupiedUnits = new Set<string>(
    rentals
      .filter((r: any) => r.rentalStatus === 'active')
      .map((r: any) => String(r.unitID)),
  );

  // Maintenance: counts
  const maintMatch: any = { unitID: { $in: units.map((u) => u._id) } };
  if (from || to) maintMatch.createdAt = timeFilter;
  const maintenanceCount = await MaintenanceRequestModel.countDocuments(
    maintMatch,
  );

  const values = {
    totalRentalIncome,
    totalUnits,
    occupiedUnits: occupiedUnits.size,
    occupancyRate: totalUnits > 0 ? (occupiedUnits.size / totalUnits) * 100 : 0,
    maintenanceCount,
  };

  return values;
};

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
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
    const existing = await StatsModel.findOne({
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
    const values = await computeStatsForUser(String(user._id), {
      scope,
      scopeID,
      from: fromDate,
      to: toDate,
    });

    await StatsModel.create({
      userID: user._id,
      scope,
      scopeID: scopeID || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      values,
    });

    res.json({ success: true, data: values, cached: false });
    return;
  } catch (error) {
    console.error('Error fetching stats:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch stats', error });
  }
});

// Recompute and upsert stats for a user and optional scope
export const upsertStatsFor = async (
  userId: string,
  options: { scope?: string; scopeID?: string; from?: Date; to?: Date } = {},
) => {
  const values = await computeStatsForUser(userId, options);
  const query: any = { userID: userId, scope: options.scope || 'all' };
  if (options.scopeID) query.scopeID = options.scopeID;
  if (options.from) query.from = options.from;
  if (options.to) query.to = options.to;

  await StatsModel.findOneAndUpdate(
    query,
    { $set: { values, updatedAt: new Date() } },
    { upsert: true },
  );
};

export default {
  getStats,
  upsertStatsFor,
  computeStatsForUser,
};

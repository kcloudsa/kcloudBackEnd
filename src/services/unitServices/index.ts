// eslint-disable-next-line import/no-extraneous-dependencies
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { UnitModel } from '../../models/unitModel';
import { createUintSchema } from '../../validation/unit';
import { recordHistory } from '../../Utils/recordHistory';
import { Types } from 'mongoose';
import UserModel from '../../models/userModel';
import Iuser from '../../interfaces/Iuser';
import { deepMerge } from '../../Utils/deepMerge';
import { getDeepDiff } from '../../Utils/deepDiff';

export const nameUnit = asyncHandler(async (req: Request, res: Response) => {
  try {
    const emojis = ['yahia', '😀', '😳', '🙄'];
    res.json(emojis);
  } catch (error) {
    console.error('Error fetching emojis:', error);
    res.status(500).json({ message: 'Failed to fetch emojis', error });
  }
});

export const createUnit = asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user as any; // User from Passport authentication
    const parsed = createUintSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten(),
      });
      return;
    }
    const data = parsed.data; // Now fully typed and safe!
    // Check if unit already exists
    const existingUnit = await UnitModel.findOne({
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
    const newUnit = await UnitModel.create(unitPayload);
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
      const { updateUnitStatus } = await import('../statusUpdateServices');
      await updateUnitStatus(newUnit._id as Types.ObjectId);
    } catch (statusError) {
      console.warn('Warning: Could not update unit status:', statusError);
      // Don't fail the request if status update fails
    }

    await recordHistory({
      table: 'Unit',
      documentId: newUnit._id as Types.ObjectId,
      action: 'create',
      performedBy: {
        userId: user._id as Types.ObjectId,
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
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ message: 'Failed to create unit', error });
  }
});

export const getUnits = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { filters, pagination, sort, populate, select } = (req as any).authenticatedQuery;
    const user = req.user as any;
    const includeAnalytics = (req as any).includeAnalytics || false;
    
    // Build query
    let query: any = UnitModel.find(filters);
    
    // Apply sorting
    query = query.sort(sort);
    
    // Apply population
    if (populate && populate.length > 0) {
      populate.forEach((field: any) => {
        query = query.populate(field);
      });
    }
    
    // Apply field selection
    if (select) {
      query = query.select(select);
    }
    
    // Execute queries in parallel for better performance
    const [units, totalCount, analytics] = await Promise.all([
      query.skip(pagination.skip).limit(pagination.limit).exec(),
      UnitModel.countDocuments(filters),
      includeAnalytics ? getUnitsAnalytics(filters) : Promise.resolve(null)
    ]);

    // Auto-update unit statuses in background (don't wait for completion)
    if (units.length > 0) {
      setTimeout(async () => {
        try {
          const { updateMultipleUnitsStatus } = await import('../statusUpdateServices');
          const unitIds = units.map((unit: any) => unit._id);
          await updateMultipleUnitsStatus(unitIds);
        } catch (statusError) {
          console.warn('Warning: Could not update units status:', statusError);
        }
      }, 100); // Small delay to not block the response
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pagination.limit);
    const hasNextPage = pagination.page < totalPages;
    const hasPrevPage = pagination.page > 1;
    
    // Build response
    const response: any = {
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
        filters: Object.keys(filters).length > 1 ? filters : undefined // Exclude userID from display
      }
    };

    if (analytics) {
      response.analytics = analytics;
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch units',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Helper function for analytics (admin only)
const getUnitsAnalytics = async (baseFilters: any) => {
  try {
    const [statusDistribution, costStats, recentActivity] = await Promise.all([
      UnitModel.aggregate([
        { $match: baseFilters },
        { $group: { _id: '$unitStatus', count: { $sum: 1 } } }
      ]),
      UnitModel.aggregate([
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
      UnitModel.find(baseFilters)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('number unitStatus createdAt')
    ]);

    return {
      statusDistribution,
      costStats: costStats[0] || {},
      recentActivity
    };
  } catch (error) {
    console.error('Error generating analytics:', error);
    return null;
  }
};

export const getUnitById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const unitId = req.params.id;
    const user = req.user as any;
    
    if (!unitId || !Types.ObjectId.isValid(unitId)) {
      res.status(400).json({
        success: false,
        message: 'Valid Unit ID is required',
        code: 'INVALID_UNIT_ID'
      });
      return;
    }

    // Security check: ensure user can only access their own units (unless admin)
    const filter: any = { _id: unitId };
    if (user.role !== 'admin') {
      filter.userID = user._id;
    }

    const unit = await UnitModel.findOne(filter)
      .populate('unitTypeID')
      .populate('uniteGroupID');
      
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
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unit',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export const updateUnit = asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user as any; // User from Passport authentication
    
    const unitId = req.params.id;
    if (!unitId || !Types.ObjectId.isValid(unitId)) {
      res.status(400).json({ 
        success: false,
        message: 'Valid Unit ID is required',
        code: 'INVALID_UNIT_ID'
      });
      return;
    }
    const updateData = req.body;

    // Security check: ensure user can only update their own units (unless admin)
    const filter: any = { _id: unitId };
    if (user.role !== 'admin') {
      filter.userID = user._id;
    }

    const existingDoc = await UnitModel.findOne(filter);
    if (!existingDoc) {
      res.status(404).json({ 
        success: false,
        message: 'Unit not found or access denied',
        code: 'UNIT_NOT_FOUND'
      });
      return;
    }
    updateData.userID = user._id;
    const mergedData = deepMerge(existingDoc.toObject(), updateData);
    const original = existingDoc?.toObject();

    const diff = getDeepDiff(original, mergedData);
    if (!diff || Object.keys(diff).length === 0) {
      res.status(400).json({ 
        success: false,
        message: 'No changes detected',
        code: 'NO_CHANGES'
      });
      return;
    }
    const updatedUnit = await UnitModel.findByIdAndUpdate(unitId, mergedData, {
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

    await recordHistory({
      table: 'Units',
      documentId: updatedUnit._id as Types.ObjectId,
      action: 'update',
      performedBy: {
        userId: user._id as Types.ObjectId,
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
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ message: 'Failed to update unit', error });
  }
});
export const deleteUnit = asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user as any; // User from Passport authentication
    
    const unitId = req.params.id;
    if (!unitId || !Types.ObjectId.isValid(unitId)) {
      res.status(400).json({ 
        success: false,
        message: 'Valid Unit ID is required',
        code: 'INVALID_UNIT_ID'
      });
      return;
    }

    // Security check: ensure user can only delete their own units (unless admin)
    const filter: any = { _id: unitId };
    if (user.role !== 'admin') {
      filter.userID = user._id;
    }

    const deletedUnit = await UnitModel.findOneAndDelete(filter);
    if (!deletedUnit) {
      res.status(404).json({ 
        success: false,
        message: 'Unit not found or access denied',
        code: 'UNIT_NOT_FOUND'
      });
      return;
    }
    await recordHistory({
      table: 'Units',
      documentId: deletedUnit._id as Types.ObjectId,
      action: 'delete',
      performedBy: {
        userId: user._id as Types.ObjectId,
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
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ message: 'Failed to delete unit', error });
  }
});

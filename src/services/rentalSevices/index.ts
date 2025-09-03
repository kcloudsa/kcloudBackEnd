import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import UserModel from '../../models/userModel';
import Iuser from '../../interfaces/Iuser';
import { createRentalSchema } from '../../validation/rentals';
import { MoveTypeModel } from '../../models/moveTypeModel';
import { ImoveType } from '../../interfaces/ImoveType';
import { RentalModel } from '../../models/rentalModel';
import { IrentalSource } from '../../interfaces/IrentalSource';
import { RentalSourceModel } from '../../models/rentalSourceModel';
import { UnitModel } from '../../models/unitModel'; // Add this import
import mongoose, { Types } from 'mongoose';
import { recordHistory } from '../../Utils/recordHistory';
import statsService from '../../services/statsService';
import { deepMerge } from '../../Utils/deepMerge';
import { getDeepDiff } from '../../Utils/deepDiff';
export const nameRental = asyncHandler(async (req: Request, res: Response) => {
  try {
    const emojis = ['yahia', '😀', '😳', '🙄'];
    res.json(emojis);
  } catch (error) {
    console.error('Error fetching emojis:', error);
    res.status(500).json({ message: 'Failed to fetch emojis', error });
  }
});

export const checkContract = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // accept contractNumber from query (GET) or body (POST/GET-with-body)
      const contractNumber =
        (req.query.contractNumber as string | undefined) ||
        (req.body && req.body.contractNumber) ||
        undefined;
      if (!contractNumber) {
        res
          .status(400)
          .json({
            success: false,
            message: 'contractNumber is required (query or body)',
          });
        return;
      }

      const existing = await RentalModel.findOne({
        contractNumber: String(contractNumber),
      }).lean();
      if (existing) {
        res.json({ success: true, exists: true, rental: existing });
        return;
      }

      res.json({ success: true, exists: false });
      return;
    } catch (error) {
      console.error('Error checking contract:', error);
      res
        .status(500)
        .json({ success: false, message: 'Failed to check contract', error });
      return;
    }
  },
);
export const createRental = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any; // User from Passport authentication

      const {
        moveTypeID,
        rentalSourceID,
        contractNumber,
        startDate,
        participats,
        monthsCount,
        isMonthly,
        endDate,
        unitID,
      } = req.body;
      // Debug: log incoming parsed body to help trace cases where submitted numbers
      // differ from stored values. Only log outside production.
      try {
        if (process.env.NODE_ENV !== 'production') {
          // shallow clone to avoid logging large objects like files
          // eslint-disable-next-line no-console
          console.log(
            '[createRental] incoming body:',
            JSON.stringify(req.body),
          );
        }
      } catch (err) {
        // ignore logging errors
      }

      const parsed = createRentalSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.flatten(),
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const isMonthlyMode = isMonthly && monthsCount;
      const hasEndDate = !!endDate;

      if (!isMonthlyMode && !hasEndDate) {
        res.status(400).json({
          success: false,
          message:
            'You must set both isMonthly and monthsCount, or provide an endDate.',
          code: 'INVALID_DATE_CONFIGURATION',
        });
        return;
      }
      const rentalStart = new Date(startDate);
      rentalStart.setHours(0, 0, 0, 0);

      // Normalize rentalEnd consistently
      let rentalEnd: Date | null = null;
      if (endDate) {
        rentalEnd = new Date(endDate);
        rentalEnd.setHours(0, 0, 0, 0);
      } else if (isMonthly && monthsCount) {
        rentalEnd = new Date(rentalStart);
        rentalEnd.setMonth(rentalEnd.getMonth() + monthsCount);
        rentalEnd.setHours(0, 0, 0, 0);
      } else {
        res.status(400).json({ message: 'Cannot determine rental end date.' });
        return;
      }

      if (rentalEnd <= rentalStart) {
        res.status(400).json({
          message: 'endDate must be after startDate',
        });
        return;
      }

      // Check for overlapping rentals for the same unit.
      // Use strict inequalities so that touching endpoints are allowed
      // (e.g., new.endDate === existing.startDate is OK).
      const overlappingRental = await RentalModel.findOne({
        unitID,
        $and: [
          { startDate: { $lt: rentalEnd } },
          { endDate: { $gt: rentalStart } },
        ],
      });

      if (overlappingRental) {
        console.log('Overlapping rental found:', overlappingRental);
        res.status(400).json({
          message:
            'This unit already has a rental during the specified period.',
        });
        return;
      }
      const data = parsed.data; // Now fully typed and safe!

      // Normalize owner user id: prefer provided participats.owner.userID but fall back to authenticated user
      const bodyOwnerUserId =
        (participats && participats.owner && participats.owner.userID) ||
        undefined;
      let ownerUserId: any =
        bodyOwnerUserId && String(bodyOwnerUserId).trim() !== ''
          ? bodyOwnerUserId
          : user && user._id
          ? user._id
          : undefined;
      // If it's a valid hex string, cast to ObjectId for queries/creation
      if (ownerUserId && mongoose.Types.ObjectId.isValid(ownerUserId)) {
        ownerUserId = new mongoose.Types.ObjectId(String(ownerUserId));
      }

      // Ensure participats structure exists on the payload and set owner.userID
      data.participats =
        data.participats || ({ owner: {}, tentant: {} } as any);
      data.participats.owner = data.participats.owner || {};
      data.participats.owner.userID = ownerUserId;

      // Ensure top-level rental userID is set to authenticated user if missing
      if (!(data as any).userID && user && user._id) {
        (data as any).userID = user._id;
      }

      // Validate move type
      const moveType: ImoveType | null = await MoveTypeModel.findById(
        moveTypeID,
      );
      if (!moveType) {
        res.status(404).json({
          success: false,
          message: 'Move type not found',
          code: 'MOVE_TYPE_NOT_FOUND',
        });
        return;
      }

      // Validate rental source
      const RentalSource: IrentalSource | null =
        await RentalSourceModel.findById(rentalSourceID);
      if (!RentalSource) {
        res.status(404).json({
          success: false,
          message: 'Rental source not found',
          code: 'RENTAL_SOURCE_NOT_FOUND',
        });
        return;
      }

      // Check if rental already exists - only include owner condition when we have a valid id
      const existingFilter: any = {
        moveTypeID,
        unitID,
        startDate,
      };
      if (ownerUserId) {
        existingFilter['participats.owner.userID'] = ownerUserId;
      }
      const existingRental = await RentalModel.findOne(existingFilter);
      if (existingRental) {
        res.status(400).json({
          message: 'A rental with this configuration already exists',
        });

        return;
      }
      const newRental = await RentalModel.create(data);
      if (!newRental) {
        res.status(400).json({ message: 'Failed to create rental ' });
        return;
      }

      // Auto-update rental status and related unit status
      try {
        const { updateRentalStatus, updateUnitStatus } = await import('../statusUpdateServices');
        await updateRentalStatus(newRental._id as Types.ObjectId);
        await updateUnitStatus(new Types.ObjectId(newRental.unitID.toString()));
      } catch (statusError) {
        console.warn('Warning: Could not update rental/unit status:', statusError);
        // Don't fail the request if status update fails
      }

      // Build a safe performedBy object for history. req.user may be undefined
      // (for example when middleware injects only userID into the body), so
      // fall back to ownerUserId and avoid dereferencing nested properties.
      const performedByUserId =
        (user && (user._id as Types.ObjectId)) || ownerUserId;
      const performedByName =
        (user && user.userName && user.userName.slug) ||
        (user && user.email) ||
        (performedByUserId ? String(performedByUserId) : 'unknown');
      const performedByRole = (user && user.role) || 'user';

      await recordHistory({
        table: 'rental',
        documentId: newRental._id as Types.ObjectId,
        action: 'create',
        performedBy: {
          userId: performedByUserId as Types.ObjectId,
          name: performedByName,
          role: performedByRole,
        },
        diff: newRental.toObject(),
        reason: 'User create new rental',
      });
      res.status(201).json({
        message: 'rental created successfully',
        rental: newRental,
      });
      // update stats for the user asynchronously
      try {
        void statsService.upsertStatsFor(String(user._id), { scope: 'all' });
      } catch (err) {
        console.warn('Failed to upsert stats after rental create', err);
      }
    } catch (error) {
      console.error('Error creating rental:', error);
      res.status(500).json({ message: 'Failed to create rental', error });
    }
  },
);
export const getAllRentals = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { filters, pagination, sort, populate, select } = (req as any)
        .authenticatedQuery;
      // Allow direct contractNumber query (e.g., ?contractNumber=REN-1234-...)
      // This supports frontend uniqueness checks which call the list endpoint with this query param.
      const contractNumberQuery = req.query.contractNumber;
      if (contractNumberQuery) {
        // ensure filters object exists and add exact-match filter
        (filters as any).contractNumber = String(contractNumberQuery);
      }

      // Build query with user isolation already applied by middleware
      let query = RentalModel.find(filters);

      // Apply sorting
      query = query.sort(sort);

      // Apply population
      if (populate && populate.length > 0) {
        populate.forEach((field: string) => {
          query = query.populate(field);
        });
      }

      // Apply field selection
      if (select) {
        query = query.select(select);
      }

      // Execute queries in parallel
      const [rentals, totalCount] = await Promise.all([
        query.skip(pagination.skip).limit(pagination.limit).exec(),
        RentalModel.countDocuments(filters),
      ]);

      // Auto-update rental statuses in background (don't wait for completion)
      if (rentals.length > 0) {
        setTimeout(async () => {
          try {
            const { updateRentalStatus } = await import('../statusUpdateServices');
            await Promise.all(
              rentals.map((rental: any) => updateRentalStatus(rental._id))
            );
          } catch (statusError) {
            console.warn('Warning: Could not update rentals status:', statusError);
          }
        }, 100); // Small delay to not block the response
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / pagination.limit);
      const hasNextPage = pagination.page < totalPages;
      const hasPrevPage = pagination.page > 1;

      res.json({
        success: true,
        data: rentals,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        meta: {
          requestedBy: user.userName?.slug || user.email,
          timestamp: new Date().toISOString(),
          filters: Object.keys(filters).length > 1 ? filters : undefined,
        },
      });
    } catch (error) {
      console.error('Error fetching rentals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch rentals',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      });
    }
  },
);
export const getRentalByID = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const rentalId = req.params.id;

      if (!rentalId) {
        res.status(400).json({ message: 'Rental ID is required' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(rentalId)) {
        res.status(400).json({ message: 'Invalid rental ID format' });
        return;
      }

      // Find rental with user ownership check
      const rental = await RentalModel.findOne({
        _id: rentalId,
        $or: [
          { userID: user._id }, // Primary owner
          { 'participats.owner.userID': user._id }, // Owner participant
          { 'participats.tentant.userID': user._id }, // Tenant participant
        ],
      })
        .populate('Unit', 'RentalSource', 'MoveType');

      if (!rental) {
        res.status(404).json({
          success: false,
          message: 'Rental not found or access denied',
        });
        return;
      }

      res.json({
        success: true,
        data: rental,
        meta: {
          requestedBy: user.userName?.slug || user.email,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error fetching rental:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch rental',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      });
    }
  },
);
export const deleteRental = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.body.userID;
      // Assuming you have a way to fetch the user by ID
      const user: Iuser | null = await UserModel.findOne({ userID: userId });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      const rentalId = req.params.id;
      if (!rentalId) {
        res.status(400).json({ message: 'Rental ID is required' });
        return;
      }
      if (!mongoose.Types.ObjectId.isValid(rentalId)) {
        res.status(400).json({ message: 'Invalid rental ID format' });
        return;
      }
      const deletedrental = await RentalModel.findByIdAndDelete(rentalId);
      if (!deletedrental) {
        res.status(404).json({ message: 'rental not found' });
        return;
      }
      await recordHistory({
        table: 'rental',
        documentId: deletedrental._id as Types.ObjectId,
        action: 'delete', // or 'update' based on your logic
        performedBy: {
          userId: user._id as Types.ObjectId,
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
      // update stats for the user asynchronously
      try {
        const ownerUserId =
          deletedrental.participats?.owner?.userID || undefined;
        if (ownerUserId) {
          void statsService.upsertStatsFor(String(ownerUserId), {
            scope: 'all',
          });
        }
      } catch (err) {
        console.warn('Failed to upsert stats after rental delete', err);
      }
      return;
    } catch (error) {
      console.error('Error fetching rental :', error);
      res.status(500).json({ message: 'Failed to fetch rental ', error });
      return;
    }
  },
);
export const updateRental = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.body.userID;
      // Assuming you have a way to fetch the user by ID
      const user: Iuser | null = await UserModel.findOne({
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
      if (!mongoose.Types.ObjectId.isValid(rentalId)) {
        res.status(400).json({ message: 'Invalid rental ID format' });
        return;
      }
      const existingDoc = await RentalModel.findById(rentalId);
      if (!existingDoc) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }
      const updateData = req.body;
      const mergedData = deepMerge(existingDoc.toObject(), updateData);

      const diff = getDeepDiff(existingDoc.toObject(), mergedData);
      // Find and update the notification
      if (!diff || Object.keys(diff).length === 0) {
        res.status(400).json({ message: 'No changes detected' });
        return;
      }
      const rental = await RentalModel.findByIdAndUpdate(rentalId, req.body, {
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
      await recordHistory({
        table: 'rental',
        documentId: rental._id as Types.ObjectId,
        action: 'update', // or 'update' based on your logic
        performedBy: {
          userId: user._id as Types.ObjectId,
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
      // update stats for the user asynchronously
      try {
        void statsService.upsertStatsFor(String(user._id), { scope: 'all' });
      } catch (err) {
        console.warn('Failed to upsert stats after rental update', err);
      }
      return;
    } catch (error) {
      console.error('Error updating rental:', error);
      res.status(500).json({ message: 'Failed to update rental', error });
      return;
    }
  },
);
export const getRentalsByUnitID = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const unitID = req.params.id;
      if (!unitID) {
        res.status(400).json({ message: 'Unit ID is required' });
        return;
      }
      if (!mongoose.Types.ObjectId.isValid(unitID)) {
        res.status(400).json({ message: 'Invalid unit ID format' });
        return;
      }
      const rentals = await RentalModel.find({ unitID })
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
    } catch (error) {
      console.error('Error fetching rentals by unit ID:', error);
      res.status(500).json({ message: 'Failed to fetch rentals', error });
      return;
    }
  },
);
export const getRentalsByUserID = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userID = req.body.userID;
      if (!userID) {
        res.status(400).json({ message: 'User ID is required' });
        return;
      }

      const rentals = await RentalModel.find({
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
    } catch (error) {
      console.error('Error fetching rentals by user ID:', error);
      res.status(500).json({ message: 'Failed to fetch rentals', error });
      return;
    }
  },
);

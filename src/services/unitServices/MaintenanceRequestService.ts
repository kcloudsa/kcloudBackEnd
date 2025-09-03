import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { MaintenanceRequestModel } from '../../models/maintenanceRequestModel';
import { UnitModel } from '../../models/unitModel';
import mongoose, { Types } from 'mongoose';
import { recordHistory } from '../../Utils/recordHistory';
import statsService from '../../services/statsService';
import { notifyMaintenanceCompleted } from '../autoNotificationServices';

// Helper: ensure the current user owns the unit or is admin
async function userOwnsUnitOrAdmin(req: Request) {
  const user = req.user as any;
  if (!user)
    return { ok: false, code: 401, message: 'Authentication required' };
  if (user.role === 'admin' || user.role === 'superadmin') return { ok: true };
  return { ok: false };
}

export const getAllMaintenanceRequests = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const unitId = req.query.unitID as string | undefined;

      // If unitID supplied, validate and enforce ownership unless admin
      if (unitId) {
        if (!mongoose.Types.ObjectId.isValid(unitId)) {
          return void res
            .status(400)
            .json({ success: false, message: 'Invalid unit ID' });
        }
        const unit = await UnitModel.findById(unitId);
        if (!unit)
          return void res
            .status(404)
            .json({ success: false, message: 'Unit not found' });
        if (user.role !== 'admin' && String(unit.userID) !== String(user._id)) {
          return void res
            .status(403)
            .json({ success: false, message: 'Access denied' });
        }
        const requests = await MaintenanceRequestModel.find({
          unitID: unitId,
        }).sort({ createdAt: -1 });
        // Debug: log how many requests were found for this unit
        console.debug(`getAllMaintenanceRequests: found ${requests.length} requests for unit ${unitId}`);
        if (requests.length > 0) console.debug('sample request ids:', requests.slice(0, 5).map(r => String(r._id)));
        return void res.json({ success: true, data: requests });
      }

      // No unit filter: admins can list all; normal users get requests for their units
      if (user.role === 'admin' || user.role === 'superadmin') {
        const requests = await MaintenanceRequestModel.find({}).sort({
          createdAt: -1,
        });
        console.debug(`getAllMaintenanceRequests: admin listing, total requests ${requests.length}`);
        if (requests.length > 0) console.debug('sample request ids:', requests.slice(0, 5).map(r => String(r._id)));
        return void res.json({ success: true, data: requests });
      }

      // Find units owned by this user
      const units = await UnitModel.find({ userID: user._id }).select('_id');
      const unitIds = units.map((u) => u._id);
      const requests = await MaintenanceRequestModel.find({
        unitID: { $in: unitIds },
      }).sort({ createdAt: -1 });
      console.debug(`getAllMaintenanceRequests: user-owned units listing, found ${requests.length} requests for user ${user._id}`);
      if (requests.length > 0) console.debug('sample request ids:', requests.slice(0, 5).map(r => String(r._id)));
      return void res.json({ success: true, data: requests });
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch maintenance requests',
        error,
      });
    }
  },
);

export const createMaintenanceRequest = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user) return void res.status(401).json({ success: false, message: 'Authentication required' });

      // Accept multiple possible field names that the frontend might send
      const body = req.body || {};
      const unitId =
        (body.unitId as string) ||
        (body.unitID as string) ||
        (body.unit && (body.unit.id || body.unit._id || body.unit.unitId)) ||
        undefined;

      const userIdFromBody = (body.userId as string) || (body.userID as string) || undefined;
      const { title, description, priority } = body as {
        title?: string;
        description?: string;
        priority?: string;
      };

      const errors: string[] = [];
      if (!unitId || !mongoose.Types.ObjectId.isValid(unitId)) {
        errors.push('unitId');
      }
      if (!title || typeof title !== 'string' || title.trim() === '') {
        errors.push('title');
      }
      if (!description || typeof description !== 'string' || description.trim() === '') {
        errors.push('description');
      }

      if (errors.length) {
        // Log received body for debugging
        console.warn('createMaintenanceRequest validation failed, missing/invalid:', errors.join(', '));
        console.debug('Received body:', JSON.stringify(req.body));
        return void res.status(400).json({
          success: false,
          message: `Missing or invalid fields: ${errors.join(', ')}`,
          received: Object.keys(req.body || {}),
        });
      }

      const allowedPriorities = ['low', 'medium', 'high'];
      const prio = priority && allowedPriorities.includes(priority) ? priority : 'medium';

      const unit = await UnitModel.findById(unitId);
      if (!unit) return void res.status(404).json({ success: false, message: 'Unit not found' });

      // Determine the reporter: allow admins to specify userId (accept variants), otherwise use authenticated user
      let reporterId: any = user._id;
      if ((user.role === 'admin' || user.role === 'superadmin') && userIdFromBody) {
        if (mongoose.Types.ObjectId.isValid(userIdFromBody)) reporterId = userIdFromBody;
      }

      const titleClean = (title as string).trim();
      const descriptionClean = (description as string).trim();

      const newRequest = await MaintenanceRequestModel.create({
        unitID: unitId,
        reportedBy: reporterId,
        title: titleClean,
        description: descriptionClean,
        priority: prio,
      });

      // Auto-update unit status when maintenance request is created
      try {
        const { updateUnitStatus } = await import('../statusUpdateServices');
        await updateUnitStatus(unitId);
      } catch (statusError) {
        console.warn('Warning: Could not update unit status:', statusError);
        // Don't fail the request if status update fails
      }

      // record history
      try {
        await recordHistory({
          table: 'maintenanceRequest',
          documentId: newRequest._id as Types.ObjectId,
          action: 'create',
          performedBy: {
            userId: user._id as Types.ObjectId,
            name: user.userName?.slug || user.email || String(user._id),
            role: user.role,
          },
          diff: newRequest.toObject(),
          reason: 'User created maintenance request',
        });
      } catch (err) {
        console.warn('Failed to record history for maintenance create', err);
      }

      // update stats for the unit owner asynchronously
      try {
        const ownerId = (unit.userID && String(unit.userID)) || undefined;
        if (ownerId) {
          void statsService.upsertStatsFor(ownerId, { scope: 'all' });
        }
      } catch (err) {
        console.warn('Failed to upsert stats after maintenance create', err);
      }

      return void res.status(201).json({ success: true, data: newRequest });
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      res.status(500).json({ success: false, message: 'Failed to create maintenance request', error });
    }
  },
);

export const getMaintenanceRequestByID = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id))
        return void res
          .status(400)
          .json({ success: false, message: 'Invalid id' });

      const request = await MaintenanceRequestModel.findById(id);
      if (!request)
        return void res
          .status(404)
          .json({ success: false, message: 'Maintenance request not found' });

      const user = req.user as any;
      // Owners of the unit, reporter, or admins can view
      const unit = await UnitModel.findById(request.unitID);
      if (!unit)
        return void res
          .status(404)
          .json({ success: false, message: 'Unit not found' });
      const isOwner = String(unit.userID) === String(user._id);
      const isReporter =
        String(request.reportedBy) === String(user._id) ||
        String(request.reportedBy) === user.userID;
      if (!(user.role === 'admin' || isOwner || isReporter)) {
        return void res
          .status(403)
          .json({ success: false, message: 'Access denied' });
      }

      return void res.json({ success: true, data: request });
    } catch (error) {
      console.error('Error fetching maintenance request by id:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch maintenance request',
        error,
      });
    }
  },
);

export const deleteMaintenanceRequestByID = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id))
        return void res
          .status(400)
          .json({ success: false, message: 'Invalid id' });

      const request = await MaintenanceRequestModel.findById(id);
      if (!request)
        return void res
          .status(404)
          .json({ success: false, message: 'Maintenance request not found' });

      const user = req.user as any;
      const unit = await UnitModel.findById(request.unitID);
      if (!unit)
        return void res
          .status(404)
          .json({ success: false, message: 'Unit not found' });

      const isOwner = String(unit.userID) === String(user._id);
      const isReporter =
        String(request.reportedBy) === String(user._id) ||
        String(request.reportedBy) === user.userID;
      if (!(user.role === 'admin' || isOwner || isReporter)) {
        return void res
          .status(403)
          .json({ success: false, message: 'Access denied' });
      }

      const deleted = await MaintenanceRequestModel.findByIdAndDelete(id);
      if (!deleted)
        return void res
          .status(404)
          .json({ success: false, message: 'Failed to delete' });

      // record history if available
      try {
        await recordHistory({
          table: 'maintenanceRequest',
          documentId: deleted._id as Types.ObjectId,
          action: 'delete',
          performedBy: {
            userId: user._id as Types.ObjectId,
            name: user.userName?.slug || user.email || String(user._id),
            role: user.role,
          },
          diff: deleted.toObject(),
          reason: 'User deleted maintenance request',
        });
      } catch (err) {
        // non-fatal
        console.warn('Failed to record history for maintenance delete', err);
      }

      // update stats for the unit owner asynchronously
      try {
        const ownerId = (unit.userID && String(unit.userID)) || undefined;
        if (ownerId) {
          void statsService.upsertStatsFor(ownerId, { scope: 'all' });
        }
      } catch (err) {
        console.warn('Failed to upsert stats after maintenance delete', err);
      }
      return void res.json({
        success: true,
        message: 'Deleted',
        data: deleted,
      });
    } catch (error) {
      console.error('Error deleting maintenance request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete maintenance request',
        error,
      });
    }
  },
);

export const deleteMaintenanceRequestsByUnitID = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const unitId = req.params.unitId;
      if (!unitId || !mongoose.Types.ObjectId.isValid(unitId))
        return void res
          .status(400)
          .json({ success: false, message: 'Invalid unit id' });

      const unit = await UnitModel.findById(unitId);
      if (!unit)
        return void res
          .status(404)
          .json({ success: false, message: 'Unit not found' });

      const user = req.user as any;
      if (
        !(user.role === 'admin' || String(unit.userID) === String(user._id))
      ) {
        return void res
          .status(403)
          .json({ success: false, message: 'Access denied' });
      }

      const result = await MaintenanceRequestModel.deleteMany({
        unitID: unitId,
      });

      return void res.json({
        success: true,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error('Error deleting maintenance requests for unit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete maintenance requests',
        error,
      });
    }
  },
);

// Accept bulk delete via request body on DELETE /api/v1/maintenance with { unitId, bulk: true }
export const deleteMaintenanceRequestsBulk = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { unitId, bulk } = req.body as { unitId?: string; bulk?: boolean };
      if (!bulk || !unitId)
        return void res
          .status(400)
          .json({ success: false, message: 'Missing unitId or bulk flag' });

      if (!mongoose.Types.ObjectId.isValid(unitId)) {
        return void res
          .status(400)
          .json({ success: false, message: 'Invalid unit id' });
      }

      const unit = await UnitModel.findById(unitId);
      if (!unit)
        return void res
          .status(404)
          .json({ success: false, message: 'Unit not found' });

      const user = req.user as any;
      if (!(user.role === 'admin' || String(unit.userID) === String(user._id))) {
        return void res
          .status(403)
          .json({ success: false, message: 'Access denied' });
      }

      const result = await MaintenanceRequestModel.deleteMany({ unitID: unitId });

      return void res.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
      console.error('Error deleting maintenance requests (bulk):', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete maintenance requests',
        error,
      });
    }
  },
);

export const patchMaintenanceRequest = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!id || !mongoose.Types.ObjectId.isValid(id))
        return void res
          .status(400)
          .json({ success: false, message: 'Invalid id' });

      const allowed: any = {};
      if (req.body.status) allowed.status = req.body.status;
      if (req.body.priority) allowed.priority = req.body.priority;

      if (Object.keys(allowed).length === 0) {
        return void res
          .status(400)
          .json({ success: false, message: 'No editable fields provided' });
      }

      const request = await MaintenanceRequestModel.findById(id);
      if (!request)
        return void res
          .status(404)
          .json({ success: false, message: 'Maintenance request not found' });

      const user = req.user as any;
      const unit = await UnitModel.findById(request.unitID);
      if (!unit)
        return void res
          .status(404)
          .json({ success: false, message: 'Unit not found' });

      const isOwner = String(unit.userID) === String(user._id);
      const isReporter =
        String(request.reportedBy) === String(user._id) ||
        String(request.reportedBy) === user.userID;
      if (!(user.role === 'admin' || isOwner || isReporter)) {
        return void res
          .status(403)
          .json({ success: false, message: 'Access denied' });
      }

      const original = request.toObject();
      const updated = await MaintenanceRequestModel.findByIdAndUpdate(
        id,
        { $set: allowed },
        { new: true, runValidators: true },
      );

      // Auto-update unit status when maintenance request status changes
      try {
        const { updateUnitStatus } = await import('../statusUpdateServices');
        await updateUnitStatus(request.unitID);
      } catch (statusError) {
        console.warn('Warning: Could not update unit status:', statusError);
        // Don't fail the request if status update fails
      }

      // Send notification if maintenance request is completed
      if (updated && (updated.status === 'completed' || updated.status === 'closed')) {
        notifyMaintenanceCompleted(updated._id).catch(error => 
          console.error('Error sending maintenance completion notification:', error)
        );
      }

      try {
        await recordHistory({
          table: 'maintenanceRequest',
          documentId: updated!._id as Types.ObjectId,
          action: 'update',
          performedBy: {
            userId: user._id as Types.ObjectId,
            name: user.userName?.slug || user.email || String(user._id),
            role: user.role,
          },
          diff: { before: original, after: updated!.toObject() },
          reason: 'User updated maintenance request',
        });
      } catch (err) {
        console.warn('Failed to record history for maintenance update', err);
      }

      // update stats for the unit owner asynchronously
      try {
        const ownerId = (unit.userID && String(unit.userID)) || undefined;
        if (ownerId) {
          void statsService.upsertStatsFor(ownerId, { scope: 'all' });
        }
      } catch (err) {
        console.warn('Failed to upsert stats after maintenance update', err);
      }

      return void res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error patching maintenance request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update maintenance request',
        error,
      });
    }
  },
);

export default {
  getAllMaintenanceRequests,
  getMaintenanceRequestByID,
  deleteMaintenanceRequestByID,
  deleteMaintenanceRequestsByUnitID,
  deleteMaintenanceRequestsBulk,
  createMaintenanceRequest,
  patchMaintenanceRequest,
};

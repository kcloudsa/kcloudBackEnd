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
exports.patchMaintenanceRequest = exports.deleteMaintenanceRequestsBulk = exports.deleteMaintenanceRequestsByUnitID = exports.deleteMaintenanceRequestByID = exports.getMaintenanceRequestByID = exports.createMaintenanceRequest = exports.getAllMaintenanceRequests = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const maintenanceRequestModel_1 = require("../../models/maintenanceRequestModel");
const unitModel_1 = require("../../models/unitModel");
const mongoose_1 = __importDefault(require("mongoose"));
const recordHistory_1 = require("../../Utils/recordHistory");
const statsService_1 = __importDefault(require("../../services/statsService"));
const autoNotificationServices_1 = require("../autoNotificationServices");
// Helper: ensure the current user owns the unit or is admin
async function userOwnsUnitOrAdmin(req) {
    const user = req.user;
    if (!user)
        return { ok: false, code: 401, message: 'Authentication required' };
    if (user.role === 'admin' || user.role === 'superadmin')
        return { ok: true };
    return { ok: false };
}
exports.getAllMaintenanceRequests = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = req.user;
        const unitId = req.query.unitID;
        // If unitID supplied, validate and enforce ownership unless admin
        if (unitId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(unitId)) {
                return void res
                    .status(400)
                    .json({ success: false, message: 'Invalid unit ID' });
            }
            const unit = await unitModel_1.UnitModel.findById(unitId);
            if (!unit)
                return void res
                    .status(404)
                    .json({ success: false, message: 'Unit not found' });
            if (user.role !== 'admin' && String(unit.userID) !== String(user._id)) {
                return void res
                    .status(403)
                    .json({ success: false, message: 'Access denied' });
            }
            const requests = await maintenanceRequestModel_1.MaintenanceRequestModel.find({
                unitID: unitId,
            }).sort({ createdAt: -1 });
            // Debug: log how many requests were found for this unit
            console.debug(`getAllMaintenanceRequests: found ${requests.length} requests for unit ${unitId}`);
            if (requests.length > 0)
                console.debug('sample request ids:', requests.slice(0, 5).map((r) => String(r._id)));
            return void res.json({ success: true, data: requests });
        }
        // No unit filter: admins can list all; normal users get requests for their units
        if (user.role === 'admin' || user.role === 'superadmin') {
            const requests = await maintenanceRequestModel_1.MaintenanceRequestModel.find({}).sort({
                createdAt: -1,
            });
            console.debug(`getAllMaintenanceRequests: admin listing, total requests ${requests.length}`);
            if (requests.length > 0)
                console.debug('sample request ids:', requests.slice(0, 5).map((r) => String(r._id)));
            return void res.json({ success: true, data: requests });
        }
        // Find units owned by this user
        const units = await unitModel_1.UnitModel.find({ userID: user._id }).select('_id');
        const unitIds = units.map((u) => u._id);
        const requests = await maintenanceRequestModel_1.MaintenanceRequestModel.find({
            unitID: { $in: unitIds },
        }).sort({ createdAt: -1 });
        console.debug(`getAllMaintenanceRequests: user-owned units listing, found ${requests.length} requests for user ${user._id}`);
        if (requests.length > 0)
            console.debug('sample request ids:', requests.slice(0, 5).map((r) => String(r._id)));
        return void res.json({ success: true, data: requests });
    }
    catch (error) {
        console.error('Error fetching maintenance requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance requests',
            error,
        });
    }
});
exports.createMaintenanceRequest = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return void res
                .status(401)
                .json({ success: false, message: 'Authentication required' });
        // Accept multiple possible field names that the frontend might send
        const body = req.body || {};
        const unitId = body.unitId ||
            body.unitID ||
            (body.unit && (body.unit.id || body.unit._id || body.unit.unitId)) ||
            undefined;
        const userIdFromBody = body.userId || body.userID || undefined;
        const { title, description, priority, credit } = body;
        const errors = [];
        if (!unitId || !mongoose_1.default.Types.ObjectId.isValid(unitId)) {
            errors.push('unitId');
        }
        if (!title || typeof title !== 'string' || title.trim() === '') {
            errors.push('title');
        }
        if (!description ||
            typeof description !== 'string' ||
            description.trim() === '') {
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
        const unit = await unitModel_1.UnitModel.findById(unitId);
        if (!unit)
            return void res
                .status(404)
                .json({ success: false, message: 'Unit not found' });
        // Determine the reporter: allow admins to specify userId (accept variants), otherwise use authenticated user
        let reporterId = user._id;
        if ((user.role === 'admin' || user.role === 'superadmin') &&
            userIdFromBody) {
            if (mongoose_1.default.Types.ObjectId.isValid(userIdFromBody))
                reporterId = userIdFromBody;
        }
        const titleClean = title.trim();
        const descriptionClean = description.trim();
        const newRequest = await maintenanceRequestModel_1.MaintenanceRequestModel.create({
            unitID: unitId,
            reportedBy: reporterId,
            title: titleClean,
            description: descriptionClean,
            priority: prio,
            credit: credit,
        });
        // Auto-update unit status when maintenance request is created
        try {
            const { updateUnitStatus } = await Promise.resolve().then(() => __importStar(require('../statusUpdateServices')));
            await updateUnitStatus(unitId);
        }
        catch (statusError) {
            console.warn('Warning: Could not update unit status:', statusError);
            // Don't fail the request if status update fails
        }
        // record history
        try {
            await (0, recordHistory_1.recordHistory)({
                table: 'maintenanceRequest',
                documentId: newRequest._id,
                action: 'create',
                performedBy: {
                    userId: user._id,
                    name: user.userName?.slug || user.email || String(user._id),
                    role: user.role,
                },
                diff: newRequest.toObject(),
                reason: 'User created maintenance request',
            });
        }
        catch (err) {
            console.warn('Failed to record history for maintenance create', err);
        }
        // update stats for the unit owner asynchronously
        try {
            const ownerId = (unit.userID && String(unit.userID)) || undefined;
            if (ownerId) {
                void statsService_1.default.upsertStatsFor(ownerId, { scope: 'all' });
            }
        }
        catch (err) {
            console.warn('Failed to upsert stats after maintenance create', err);
        }
        return void res.status(201).json({ success: true, data: newRequest });
    }
    catch (error) {
        console.error('Error creating maintenance request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create maintenance request',
            error,
        });
    }
});
exports.getMaintenanceRequestByID = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const id = req.params.id;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id))
            return void res
                .status(400)
                .json({ success: false, message: 'Invalid id' });
        const request = await maintenanceRequestModel_1.MaintenanceRequestModel.findById(id);
        if (!request)
            return void res
                .status(404)
                .json({ success: false, message: 'Maintenance request not found' });
        const user = req.user;
        // Owners of the unit, reporter, or admins can view
        const unit = await unitModel_1.UnitModel.findById(request.unitID);
        if (!unit)
            return void res
                .status(404)
                .json({ success: false, message: 'Unit not found' });
        const isOwner = String(unit.userID) === String(user._id);
        const isReporter = String(request.reportedBy) === String(user._id) ||
            String(request.reportedBy) === user.userID;
        if (!(user.role === 'admin' || isOwner || isReporter)) {
            return void res
                .status(403)
                .json({ success: false, message: 'Access denied' });
        }
        return void res.json({ success: true, data: request });
    }
    catch (error) {
        console.error('Error fetching maintenance request by id:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance request',
            error,
        });
    }
});
exports.deleteMaintenanceRequestByID = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const id = req.params.id;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id))
            return void res
                .status(400)
                .json({ success: false, message: 'Invalid id' });
        const request = await maintenanceRequestModel_1.MaintenanceRequestModel.findById(id);
        if (!request)
            return void res
                .status(404)
                .json({ success: false, message: 'Maintenance request not found' });
        const user = req.user;
        const unit = await unitModel_1.UnitModel.findById(request.unitID);
        if (!unit)
            return void res
                .status(404)
                .json({ success: false, message: 'Unit not found' });
        const isOwner = String(unit.userID) === String(user._id);
        const isReporter = String(request.reportedBy) === String(user._id) ||
            String(request.reportedBy) === user.userID;
        if (!(user.role === 'admin' || isOwner || isReporter)) {
            return void res
                .status(403)
                .json({ success: false, message: 'Access denied' });
        }
        const deleted = await maintenanceRequestModel_1.MaintenanceRequestModel.findByIdAndDelete(id);
        if (!deleted)
            return void res
                .status(404)
                .json({ success: false, message: 'Failed to delete' });
        // record history if available
        try {
            await (0, recordHistory_1.recordHistory)({
                table: 'maintenanceRequest',
                documentId: deleted._id,
                action: 'delete',
                performedBy: {
                    userId: user._id,
                    name: user.userName?.slug || user.email || String(user._id),
                    role: user.role,
                },
                diff: deleted.toObject(),
                reason: 'User deleted maintenance request',
            });
        }
        catch (err) {
            // non-fatal
            console.warn('Failed to record history for maintenance delete', err);
        }
        // update stats for the unit owner asynchronously
        try {
            const ownerId = (unit.userID && String(unit.userID)) || undefined;
            if (ownerId) {
                void statsService_1.default.upsertStatsFor(ownerId, { scope: 'all' });
            }
        }
        catch (err) {
            console.warn('Failed to upsert stats after maintenance delete', err);
        }
        return void res.json({
            success: true,
            message: 'Deleted',
            data: deleted,
        });
    }
    catch (error) {
        console.error('Error deleting maintenance request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete maintenance request',
            error,
        });
    }
});
exports.deleteMaintenanceRequestsByUnitID = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const unitId = req.params.unitId;
        if (!unitId || !mongoose_1.default.Types.ObjectId.isValid(unitId))
            return void res
                .status(400)
                .json({ success: false, message: 'Invalid unit id' });
        const unit = await unitModel_1.UnitModel.findById(unitId);
        if (!unit)
            return void res
                .status(404)
                .json({ success: false, message: 'Unit not found' });
        const user = req.user;
        if (!(user.role === 'admin' || String(unit.userID) === String(user._id))) {
            return void res
                .status(403)
                .json({ success: false, message: 'Access denied' });
        }
        const result = await maintenanceRequestModel_1.MaintenanceRequestModel.deleteMany({
            unitID: unitId,
        });
        return void res.json({
            success: true,
            deletedCount: result.deletedCount,
        });
    }
    catch (error) {
        console.error('Error deleting maintenance requests for unit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete maintenance requests',
            error,
        });
    }
});
// Accept bulk delete via request body on DELETE /api/v1/maintenance with { unitId, bulk: true }
exports.deleteMaintenanceRequestsBulk = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { unitId, bulk } = req.body;
        if (!bulk || !unitId)
            return void res
                .status(400)
                .json({ success: false, message: 'Missing unitId or bulk flag' });
        if (!mongoose_1.default.Types.ObjectId.isValid(unitId)) {
            return void res
                .status(400)
                .json({ success: false, message: 'Invalid unit id' });
        }
        const unit = await unitModel_1.UnitModel.findById(unitId);
        if (!unit)
            return void res
                .status(404)
                .json({ success: false, message: 'Unit not found' });
        const user = req.user;
        if (!(user.role === 'admin' || String(unit.userID) === String(user._id))) {
            return void res
                .status(403)
                .json({ success: false, message: 'Access denied' });
        }
        const result = await maintenanceRequestModel_1.MaintenanceRequestModel.deleteMany({
            unitID: unitId,
        });
        return void res.json({
            success: true,
            deletedCount: result.deletedCount,
        });
    }
    catch (error) {
        console.error('Error deleting maintenance requests (bulk):', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete maintenance requests',
            error,
        });
    }
});
exports.patchMaintenanceRequest = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const id = req.params.id;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id))
            return void res
                .status(400)
                .json({ success: false, message: 'Invalid id' });
        const allowed = {};
        if (req.body.status)
            allowed.status = req.body.status;
        if (req.body.priority)
            allowed.priority = req.body.priority;
        if (Object.keys(allowed).length === 0) {
            return void res
                .status(400)
                .json({ success: false, message: 'No editable fields provided' });
        }
        const request = await maintenanceRequestModel_1.MaintenanceRequestModel.findById(id);
        if (!request)
            return void res
                .status(404)
                .json({ success: false, message: 'Maintenance request not found' });
        const user = req.user;
        const unit = await unitModel_1.UnitModel.findById(request.unitID);
        if (!unit)
            return void res
                .status(404)
                .json({ success: false, message: 'Unit not found' });
        const isOwner = String(unit.userID) === String(user._id);
        const isReporter = String(request.reportedBy) === String(user._id) ||
            String(request.reportedBy) === user.userID;
        if (!(user.role === 'admin' || isOwner || isReporter)) {
            return void res
                .status(403)
                .json({ success: false, message: 'Access denied' });
        }
        const original = request.toObject();
        const updated = await maintenanceRequestModel_1.MaintenanceRequestModel.findByIdAndUpdate(id, { $set: allowed }, { new: true, runValidators: true });
        // Auto-update unit status when maintenance request status changes
        try {
            const { updateUnitStatus } = await Promise.resolve().then(() => __importStar(require('../statusUpdateServices')));
            await updateUnitStatus(request.unitID);
        }
        catch (statusError) {
            console.warn('Warning: Could not update unit status:', statusError);
            // Don't fail the request if status update fails
        }
        // Send notification if maintenance request is completed
        if (updated &&
            (updated.status === 'completed' || updated.status === 'closed')) {
            (0, autoNotificationServices_1.notifyMaintenanceCompleted)(updated._id).catch((error) => console.error('Error sending maintenance completion notification:', error));
        }
        try {
            await (0, recordHistory_1.recordHistory)({
                table: 'maintenanceRequest',
                documentId: updated._id,
                action: 'update',
                performedBy: {
                    userId: user._id,
                    name: user.userName?.slug || user.email || String(user._id),
                    role: user.role,
                },
                diff: { before: original, after: updated.toObject() },
                reason: 'User updated maintenance request',
            });
        }
        catch (err) {
            console.warn('Failed to record history for maintenance update', err);
        }
        // update stats for the unit owner asynchronously
        try {
            const ownerId = (unit.userID && String(unit.userID)) || undefined;
            if (ownerId) {
                void statsService_1.default.upsertStatsFor(ownerId, { scope: 'all' });
            }
        }
        catch (err) {
            console.warn('Failed to upsert stats after maintenance update', err);
        }
        return void res.json({ success: true, data: updated });
    }
    catch (error) {
        console.error('Error patching maintenance request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update maintenance request',
            error,
        });
    }
});
exports.default = {
    getAllMaintenanceRequests: exports.getAllMaintenanceRequests,
    getMaintenanceRequestByID: exports.getMaintenanceRequestByID,
    deleteMaintenanceRequestByID: exports.deleteMaintenanceRequestByID,
    deleteMaintenanceRequestsByUnitID: exports.deleteMaintenanceRequestsByUnitID,
    deleteMaintenanceRequestsBulk: exports.deleteMaintenanceRequestsBulk,
    createMaintenanceRequest: exports.createMaintenanceRequest,
    patchMaintenanceRequest: exports.patchMaintenanceRequest,
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAuthQueryWithUserIsolation = exports.injectUserID = exports.addUserFilter = exports.enforceUserOwnership = void 0;
const mongoose_1 = require("mongoose");
const unitModel_1 = require("../models/unitModel");
const rentalModel_1 = require("../models/rentalModel");
const notificationModel_1 = require("../models/notificationModel");
/**
 * Middleware to ensure users can only access their own data
 */
const enforceUserOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const resourceId = req.params.id;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'UNAUTHORIZED'
                });
            }
            // Admin users can access all data
            if (user.role === 'admin' || user.role === 'superadmin') {
                return next();
            }
            // Normalize authenticated user ids (object and string) to avoid calling toString on undefined
            const authUserIdObj = user._id ?? undefined;
            const authUserIdStr = user._id ? user._id.toString() : (user.id || undefined);
            // For resource creation, we don't need to check ownership
            if (req.method === 'POST' && !resourceId) {
                return next();
            }
            // For operations that require resource ID, check ownership
            if (resourceId) {
                let resource;
                switch (resourceType) {
                    case 'unit': {
                        resource = await unitModel_1.UnitModel.findById(resourceId);
                        if (!resource) {
                            return res.status(404).json({
                                success: false,
                                message: 'Unit not found',
                                code: 'RESOURCE_NOT_FOUND'
                            });
                        }
                        // Normalize IDs to strings for safe comparison (covers ObjectId and string cases)
                        const resourceUserIdStr = resource.userID ? resource.userID.toString() : undefined;
                        if (resourceUserIdStr !== authUserIdStr &&
                            resourceUserIdStr !== user.id) {
                            return res.status(403).json({
                                success: false,
                                message: 'Access denied: You can only access your own units',
                                code: 'ACCESS_DENIED'
                            });
                        }
                        break;
                    }
                    case 'rental':
                        resource = await rentalModel_1.RentalModel.findById(resourceId);
                        if (!resource) {
                            return res.status(404).json({
                                success: false,
                                message: 'Rental not found',
                                code: 'RESOURCE_NOT_FOUND'
                            });
                        }
                        // Check if user is either owner or tenant
                        const ownerId = resource.participats?.owner?.userID ? resource.participats.owner.userID.toString() : undefined;
                        const tenantId = resource.participats?.tentant?.userID ? resource.participats.tentant.userID.toString() : undefined;
                        const isOwner = ownerId === user.id || ownerId === authUserIdStr;
                        const isTenant = tenantId === user.id || tenantId === authUserIdStr;
                        if (!isOwner && !isTenant) {
                            return res.status(403).json({
                                success: false,
                                message: 'Access denied: You can only access rentals you are involved in',
                                code: 'ACCESS_DENIED'
                            });
                        }
                        break;
                    case 'notification':
                        {
                            resource = await notificationModel_1.NotificationModel.findById(resourceId);
                            if (!resource) {
                                return res.status(404).json({
                                    success: false,
                                    message: 'Notification not found',
                                    code: 'RESOURCE_NOT_FOUND'
                                });
                            }
                            // Normalize IDs to strings for safe comparison (covers ObjectId and string cases)
                            const resourceUserIdStr = resource.userID ? resource.userID.toString() : undefined;
                            if (resourceUserIdStr !== user.id &&
                                resourceUserIdStr !== authUserIdStr) {
                                return res.status(403).json({
                                    success: false,
                                    message: 'Access denied: You can only access your own notifications',
                                    code: 'ACCESS_DENIED'
                                });
                            }
                            break;
                        }
                        break;
                    case 'user':
                        // Users can only access/modify their own profile unless admin
                        if (resourceId !== user.id && resourceId !== authUserIdStr) {
                            return res.status(403).json({
                                success: false,
                                message: 'Access denied: You can only access your own profile',
                                code: 'ACCESS_DENIED'
                            });
                        }
                        break;
                }
            }
            next();
        }
        catch (error) {
            console.error('Error in enforceUserOwnership middleware:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authorization check',
                code: 'AUTHORIZATION_ERROR'
            });
        }
    };
};
exports.enforceUserOwnership = enforceUserOwnership;
/**
 * Middleware to automatically add user filters to GET requests
 */
const addUserFilter = (userField = 'userID') => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        // Admin users can see all data if explicitly requested
        if ((user.role === 'admin' || user.role === 'superadmin') && req.query.allUsers === 'true') {
            return next();
        }
        // Add user filter to the authenticated query
        if (!req.authenticatedQuery) {
            req.authenticatedQuery = {
                filters: {},
                pagination: { page: 1, limit: 10, skip: 0 },
                sort: { createdAt: -1 }
            };
        }
        // Set the user filter based on the specified field
        if (userField === 'userID') {
            req.authenticatedQuery.filters.userID = user._id;
        }
        else if (userField === 'participantID') {
            // Special case for rentals where user can be owner or tenant
            req.authenticatedQuery.filters.$or = [
                { 'participats.owner.userID': user.id },
                { 'participats.owner.userID': user._id.toString() },
                { 'participats.tentant.userID': user.id },
                { 'participats.tentant.userID': user._id.toString() }
            ];
        }
        else {
            req.authenticatedQuery.filters[userField] = user._id;
        }
        next();
    };
};
exports.addUserFilter = addUserFilter;
/**
 * Middleware to inject user ID into request body for POST/PUT operations
 */
const injectUserID = (userField = 'userID') => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'UNAUTHORIZED'
            });
        }
        // Inject user ID into request body
        if (userField === 'userID') {
            req.body.userID = user.id || user._id.toString();
        }
        else {
            req.body[userField] = user._id;
        }
        // For rentals, set the owner participant
        if (req.path.includes('/rental') && req.method === 'POST') {
            if (!req.body.participats) {
                req.body.participats = {};
            }
            if (!req.body.participats.owner) {
                req.body.participats.owner = {};
            }
            req.body.participats.owner.userID = user.id || user._id.toString();
            req.body.participats.owner.role = 'owner';
        }
        next();
    };
};
exports.injectUserID = injectUserID;
/**
 * Enhanced version of validateAuthQuery that enforces user isolation
 */
const validateAuthQueryWithUserIsolation = (options) => {
    const { allowedSortFields = ['createdAt', 'updatedAt'], allowedPopulateFields = [], maxLimit = 100, defaultLimit = 10, allowCrossUserAccess = false, userField = 'userID' } = options || {};
    return async (req, res, next) => {
        try {
            const query = req.query;
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'UNAUTHORIZED'
                });
            }
            // Initialize filters with authenticated user's data constraint
            const filters = {};
            // Enforce user isolation unless admin with explicit cross-user access
            if (user.role === 'admin' || user.role === 'superadmin') {
                if (allowCrossUserAccess && query.targetUserID) {
                    if (!mongoose_1.Types.ObjectId.isValid(query.targetUserID)) {
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid target user ID format',
                            code: 'INVALID_TARGET_USER_ID'
                        });
                    }
                    filters[userField] = new mongoose_1.Types.ObjectId(query.targetUserID);
                }
                else if (!query.allUsers) {
                    // Admin still sees only their data unless explicitly requesting all
                    filters[userField] = user._id;
                }
            }
            else {
                // Non-admin users can only see their own data
                if (userField === 'participantID') {
                    // Special handling for rentals
                    filters.$or = [
                        { 'participats.owner.userID': user.id },
                        { 'participats.owner.userID': user._id.toString() },
                        { 'participats.tentant.userID': user.id },
                        { 'participats.tentant.userID': user._id.toString() }
                    ];
                }
                else {
                    filters[userField] = user._id;
                }
            }
            // Pagination
            const page = Math.max(1, parseInt(query.page) || 1);
            const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
            const skip = (page - 1) * limit;
            // Sorting
            const sort = {};
            if (query.sortBy) {
                const sortField = query.sortBy;
                if (allowedSortFields.includes(sortField)) {
                    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
                    sort[sortField] = sortOrder;
                }
            }
            else {
                sort.createdAt = -1; // Default sort
            }
            // Population
            const populate = [];
            if (query.populate) {
                const requestedPopulate = Array.isArray(query.populate)
                    ? query.populate
                    : [query.populate];
                for (const field of requestedPopulate) {
                    if (allowedPopulateFields.includes(field)) {
                        populate.push(field);
                    }
                }
            }
            // Field selection
            const select = query.select ? query.select.split(',').join(' ') : undefined;
            // Attach to request
            req.authenticatedQuery = {
                filters,
                pagination: { page, limit, skip },
                sort,
                populate: populate.length > 0 ? populate : undefined,
                select
            };
            next();
        }
        catch (error) {
            console.error('Error in validateAuthQueryWithUserIsolation:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during query validation',
                code: 'QUERY_VALIDATION_ERROR'
            });
        }
    };
};
exports.validateAuthQueryWithUserIsolation = validateAuthQueryWithUserIsolation;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimit = exports.addAnalytics = exports.validateAuthQuery = exports.requireAuth = void 0;
const mongoose_1 = require("mongoose");
const requireAuth = (req, res, next) => {
    // Check if user is authenticated via Passport session
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        return next();
    }
    // If not authenticated via session, try JWT
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        // Let passport JWT strategy handle this
        const passport = require('passport');
        return passport.authenticate('jwt', { session: false }, (err, user) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Authentication error',
                    code: 'AUTH_ERROR'
                });
            }
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'UNAUTHORIZED'
                });
            }
            req.user = user;
            next();
        })(req, res, next);
    }
    // No valid authentication found
    return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
    });
};
exports.requireAuth = requireAuth;
const validateAuthQuery = (options) => {
    const { allowedSortFields = ['createdAt', 'updatedAt', 'number', 'processingCost', 'unitStatus', 'favorite'], allowedPopulateFields = ['unitTypeID', 'uniteGroupID', 'userID'], maxLimit = 100, defaultLimit = 10, allowCrossUserAccess = false } = options || {};
    return async (req, res, next) => {
        try {
            const query = req.query;
            const user = req.user; // Your user type from Passport
            // Require authentication for query validation (user must exist)
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'UNAUTHORIZED'
                });
            }
            // Initialize filters with authenticated user's ID
            const filters = {
                userID: user._id
            };
            // Allow admin users to query other users' data
            if (allowCrossUserAccess && user.role === 'admin' && query.targetUserID) {
                if (!mongoose_1.Types.ObjectId.isValid(query.targetUserID)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid target user ID format',
                        code: 'INVALID_TARGET_USER_ID'
                    });
                }
                filters.userID = new mongoose_1.Types.ObjectId(query.targetUserID);
            }
            // ObjectId validations
            const objectIdFields = ['unitTypeID', 'uniteGroupID'];
            for (const field of objectIdFields) {
                if (query[field]) {
                    if (!mongoose_1.Types.ObjectId.isValid(query[field])) {
                        return res.status(400).json({
                            success: false,
                            message: `Invalid ${field} format`,
                            code: `INVALID_${field.toUpperCase()}`
                        });
                    }
                    filters[field] = new mongoose_1.Types.ObjectId(query[field]);
                }
            }
            // Enum validations
            if (query.unitStatus) {
                // Align with Unit model enum: ['available', 'reserved', 'under_maintenance']
                const validStatuses = ['available', 'reserved', 'under_maintenance'];
                if (!validStatuses.includes(query.unitStatus)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid unitStatus. Must be one of: ${validStatuses.join(', ')}`,
                        code: 'INVALID_UNIT_STATUS'
                    });
                }
                filters.unitStatus = query.unitStatus;
            }
            // Boolean filters
            if (query.favorite !== undefined) {
                filters.favorite = query.favorite === 'true';
            }
            // Number filters
            if (query.number) {
                if (query.exactNumber === 'true') {
                    filters.number = isNaN(Number(query.number)) ? query.number : Number(query.number);
                }
                else {
                    filters.number = { $regex: query.number, $options: 'i' };
                }
            }
            // String filters with regex
            if (query.location) {
                filters.location = { $regex: query.location, $options: 'i' };
            }
            // Range filters for processing cost
            const minCost = query.minProcessingCost ? Number(query.minProcessingCost) : undefined;
            const maxCost = query.maxProcessingCost ? Number(query.maxProcessingCost) : undefined;
            if (minCost !== undefined || maxCost !== undefined) {
                filters.processingCost = {};
                if (minCost !== undefined) {
                    if (isNaN(minCost) || minCost < 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid minProcessingCost format',
                            code: 'INVALID_MIN_COST'
                        });
                    }
                    filters.processingCost.$gte = minCost;
                }
                if (maxCost !== undefined) {
                    if (isNaN(maxCost) || maxCost < 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid maxProcessingCost format',
                            code: 'INVALID_MAX_COST'
                        });
                    }
                    filters.processingCost.$lte = maxCost;
                }
            }
            // Date range filters
            const startDate = query.startDate ? new Date(query.startDate) : undefined;
            const endDate = query.endDate ? new Date(query.endDate) : undefined;
            if (startDate || endDate) {
                const dateField = query.dateField || 'createdAt';
                if (!['createdAt', 'updatedAt'].includes(dateField)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid dateField. Must be createdAt or updatedAt',
                        code: 'INVALID_DATE_FIELD'
                    });
                }
                filters[dateField] = {};
                if (startDate && !isNaN(startDate.getTime())) {
                    filters[dateField].$gte = startDate;
                }
                if (endDate && !isNaN(endDate.getTime())) {
                    filters[dateField].$lte = endDate;
                }
            }
            // Global search
            if (query.search) {
                const searchTerm = query.search;
                const searchFields = ['description', 'notes', 'location', 'number'];
                filters.$or = searchFields.map(field => ({
                    [field]: { $regex: searchTerm, $options: 'i' }
                }));
            }
            // Pagination with user-specific limits
            const userMaxLimit = user.role === 'admin' ? maxLimit : Math.min(maxLimit, 50);
            const page = Math.max(1, parseInt(query.page) || 1);
            const limit = Math.min(userMaxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
            const skip = (page - 1) * limit;
            const pagination = { page, limit, skip };
            // Sorting with validation
            const sort = {};
            if (query.sortBy) {
                const sortBy = query.sortBy;
                const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
                if (allowedSortFields.includes(sortBy)) {
                    sort[sortBy] = sortOrder;
                }
                else {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid sortBy field. Allowed fields: ${allowedSortFields.join(', ')}`,
                        code: 'INVALID_SORT_FIELD'
                    });
                }
            }
            else {
                sort.createdAt = -1; // Default sort
            }
            // Population with validation
            let populate = [];
            if (query.populate) {
                const requestedPopulate = query.populate.split(',');
                populate = requestedPopulate
                    .map(field => field.trim())
                    .filter(field => allowedPopulateFields.includes(field));
            }
            // Field selection
            const select = query.select;
            // Attach to request
            req.authenticatedQuery = {
                filters,
                pagination,
                sort,
                populate,
                select
            };
            next();
        }
        catch (error) {
            console.error('Error in validateAuthQuery:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during query validation',
                code: 'VALIDATION_ERROR',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    };
};
exports.validateAuthQuery = validateAuthQuery;
// Analytics helper for admin users
const addAnalytics = (req, res, next) => {
    const user = req.user;
    if (user && user.role === 'admin') {
        req.includeAnalytics = true;
    }
    next();
};
exports.addAnalytics = addAnalytics;
// Rate limiting helper
const createRateLimit = (requestsPerMinute = 60) => {
    const userRequests = new Map();
    return (req, res, next) => {
        const user = req.user;
        if (!user)
            return next();
        // Support multiple possible id fields from session or JWT payloads
        const rawId = user._id ?? user.id ?? user.userID ?? user.userId;
        if (!rawId)
            return next();
        const userId = typeof rawId === 'string' ? rawId : (rawId.toString ? rawId.toString() : String(rawId));
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute
        const userLimit = userRequests.get(userId);
        if (!userLimit || now > userLimit.resetTime) {
            userRequests.set(userId, { count: 1, resetTime: now + windowMs });
            return next();
        }
        if (userLimit.count >= requestsPerMinute) {
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
            });
        }
        userLimit.count++;
        next();
    };
};
exports.createRateLimit = createRateLimit;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeErrorHandler = exports.validateObjectId = exports.middlewareSets = exports.createSecureDeleteRoute = exports.createSecurePatchRoute = exports.createSecurePostRoute = exports.createSecureGetRoute = exports.createAuthenticatedRoute = void 0;
const authQuery_1 = require("./authQuery");
/**
 * Enhanced route setup utility for applying consistent authentication and validation
 * across all API routes that require user context
 */
const createAuthenticatedRoute = (router) => {
    // Apply authentication to all routes in this router
    router.use(authQuery_1.requireAuth);
    return router;
};
exports.createAuthenticatedRoute = createAuthenticatedRoute;
const createSecureGetRoute = (options) => {
    const { rateLimit = 2000, // Increased from 1000 to 2000 for development
    allowCrossUserAccess = false, maxLimit = 100, allowedSortFields = ['createdAt', 'updatedAt'], allowedPopulateFields = [], includeAnalytics = false } = options || {};
    const middleware = [
        (0, authQuery_1.createRateLimit)(rateLimit),
        (0, authQuery_1.validateAuthQuery)({
            allowCrossUserAccess,
            maxLimit,
            allowedSortFields,
            allowedPopulateFields
        })
    ];
    if (includeAnalytics) {
        middleware.push(authQuery_1.addAnalytics);
    }
    return middleware;
};
exports.createSecureGetRoute = createSecureGetRoute;
const createSecurePostRoute = (rateLimit = 100) => {
    return [(0, authQuery_1.createRateLimit)(rateLimit)];
};
exports.createSecurePostRoute = createSecurePostRoute;
const createSecurePatchRoute = (rateLimit = 150) => {
    return [(0, authQuery_1.createRateLimit)(rateLimit)];
};
exports.createSecurePatchRoute = createSecurePatchRoute;
const createSecureDeleteRoute = (rateLimit = 50) => {
    return [(0, authQuery_1.createRateLimit)(rateLimit)];
};
exports.createSecureDeleteRoute = createSecureDeleteRoute;
/**
 * Pre-configured middleware sets for common use cases
 */
exports.middlewareSets = {
    // For listing resources with full query capabilities
    listWithQuery: (0, exports.createSecureGetRoute)({
        rateLimit: 1000,
        allowCrossUserAccess: true,
        maxLimit: 200,
        includeAnalytics: true
    }),
    // For simple GET requests without complex querying
    simpleGet: [(0, authQuery_1.createRateLimit)(1200)],
    // For creating new resources
    create: (0, exports.createSecurePostRoute)(20),
    // For updating existing resources
    update: (0, exports.createSecurePatchRoute)(30),
    // For deleting resources
    delete: (0, exports.createSecureDeleteRoute)(5),
    // For admin-only routes with higher limits
    adminList: (0, exports.createSecureGetRoute)({
        rateLimit: 2000,
        allowCrossUserAccess: true,
        maxLimit: 500,
        includeAnalytics: true
    }),
    // For public-like routes (still authenticated but higher limits)
    publicList: (0, exports.createSecureGetRoute)({
        rateLimit: 2000,
        maxLimit: 100,
        includeAnalytics: false
    })
};
/**
 * Route validation helpers
 */
const validateObjectId = (req, res, next, id) => {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            code: 'INVALID_ID'
        });
    }
    next();
};
exports.validateObjectId = validateObjectId;
/**
 * Error handling middleware for routes
 */
const routeErrorHandler = (err, req, res, next) => {
    console.error('Route error:', err);
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.errors,
            code: 'VALIDATION_ERROR'
        });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            code: 'INVALID_ID'
        });
    }
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate entry',
            code: 'DUPLICATE_ENTRY'
        });
    }
    // Default error response
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};
exports.routeErrorHandler = routeErrorHandler;

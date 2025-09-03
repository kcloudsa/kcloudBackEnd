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
const express_1 = __importDefault(require("express"));
const rentalSevices_1 = require("../../services/rentalSevices");
const moveTypeServices_1 = require("../../services/rentalSevices/moveTypeServices");
const rentalSource_1 = require("../../services/rentalSevices/rentalSource");
const authQuery_1 = require("../../middlewares/authQuery");
const userIsolation_1 = require("../../middlewares/userIsolation");
const router = express_1.default.Router();
// Apply authentication to all routes
router.use(authQuery_1.requireAuth);
// Rental routes with user isolation
router
    .route('/')
    .get((0, userIsolation_1.validateAuthQueryWithUserIsolation)({
    allowCrossUserAccess: true, // Admins can see all rentals
    maxLimit: 150,
    allowedSortFields: [
        'createdAt',
        'updatedAt',
        'startDate',
        'endDate',
        'contractNumber',
    ],
    allowedPopulateFields: [
        'userID',
        'unitID',
        'moveTypeID',
        'rentalSourceID',
    ],
    userField: 'userID', // Filter by primary userID field
}), rentalSevices_1.getAllRentals)
    .post((0, userIsolation_1.injectUserID)('userID'), // Automatically inject user ID
(0, userIsolation_1.enforceUserOwnership)('rental'), // Check unit ownership
rentalSevices_1.createRental);
router.route('/check').post((req, res, next) => {
    // keep auth; reuse getAllRentals middleware chain not needed
    next();
}, (async (req, res, next) => {
    // lazy import to avoid circular deps
    const { checkContract } = await Promise.resolve().then(() => __importStar(require('../../services/rentalSevices')));
    return checkContract(req, res, next);
}));
// User-specific rentals (redundant with main route but kept for compatibility)
router.route('/user').get((0, userIsolation_1.validateAuthQueryWithUserIsolation)({
    allowCrossUserAccess: false,
    maxLimit: 100,
    allowedSortFields: ['createdAt', 'updatedAt', 'startDate', 'endDate'],
    allowedPopulateFields: ['unitID', 'moveTypeID', 'rentalSourceID'],
    userField: 'userID',
}), rentalSevices_1.getRentalsByUserID);
// Move type routes (these are typically shared data)
router.route('/movetype').get(moveTypeServices_1.getmoveTypes).post(moveTypeServices_1.createMoveType);
// Rental source routes (these are typically shared data)
router.route('/rentalsource').get(rentalSource_1.getRentalSources).post(rentalSource_1.createRentalSource);
// Single rental source by id
router.route('/rentalsource/:id').get(rentalSource_1.getRentalSourceById);
// Individual rental routes with ownership enforcement
router
    .route('/:id')
    .get((0, userIsolation_1.enforceUserOwnership)('rental'), rentalSevices_1.getRentalByID)
    .patch((0, userIsolation_1.enforceUserOwnership)('rental'), rentalSevices_1.updateRental)
    .delete((0, userIsolation_1.enforceUserOwnership)('rental'), rentalSevices_1.deleteRental);
// Unit-specific rentals
router.route('/unit/:id').get((0, userIsolation_1.validateAuthQueryWithUserIsolation)({
    allowCrossUserAccess: false,
    maxLimit: 50,
    allowedSortFields: ['createdAt', 'startDate', 'endDate'],
    allowedPopulateFields: ['moveTypeID', 'rentalSourceID'],
    userField: 'userID',
}), rentalSevices_1.getRentalsByUnitID);
exports.default = router;

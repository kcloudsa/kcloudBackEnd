"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const unitServices_1 = require("../../services/unitServices");
const unitTypeServices_1 = require("../../services/unitServices/unitTypeServices");
const unitGroupServices_1 = require("../../services/unitServices/unitGroupServices");
const unitMoveServices_1 = require("../../services/unitServices/unitMoveServices");
const authQuery_1 = require("../../middlewares/authQuery");
const userIsolation_1 = require("../../middlewares/userIsolation");
const router = express_1.default.Router();
// Apply authentication to all routes
router.use(authQuery_1.requireAuth);
// Units routes with user isolation
router
    .route('/')
    .get((0, userIsolation_1.validateAuthQueryWithUserIsolation)({
    allowCrossUserAccess: true, // Admins can see all units
    maxLimit: 200,
    allowedSortFields: [
        'createdAt',
        'updatedAt',
        'number',
        'processingCost',
        'unitStatus',
        'favorite',
    ],
    allowedPopulateFields: ['unitTypeID', 'uniteGroupID', 'userID'],
    userField: 'userID',
}), unitServices_1.getUnits)
    .post((0, userIsolation_1.injectUserID)('userID'), // Automatically inject user ID
unitServices_1.createUnit);
// Unit types routes (these are typically shared data)
router.route('/types').get(unitTypeServices_1.getUnitTypes).post(unitTypeServices_1.createUnitType);
// Unit groups routes with user isolation
router
    .route('/groups')
    .get((0, userIsolation_1.validateAuthQueryWithUserIsolation)({
    allowCrossUserAccess: true,
    maxLimit: 100,
    allowedSortFields: ['createdAt', 'updatedAt', 'name'],
    allowedPopulateFields: ['userID'],
    userField: 'userID',
}), unitGroupServices_1.getAllUnitGroups)
    .post((0, userIsolation_1.injectUserID)('userID'), unitGroupServices_1.createUnitGroup);
// Unit moves routes with user isolation
router
    .route('/moves')
    .get((0, userIsolation_1.validateAuthQueryWithUserIsolation)({
    allowCrossUserAccess: true,
    maxLimit: 200,
    allowedSortFields: ['moveDate', 'createdAt', 'updatedAt', 'debit', 'credit'],
    allowedPopulateFields: ['unitID', 'moveTypeID', 'maintenanceID', 'rentalID', 'userID'],
    userField: 'userID',
}), unitMoveServices_1.getUnitMoves)
    .post((0, userIsolation_1.injectUserID)('userID'), unitMoveServices_1.createUnitMove);
// Individual unit routes with ownership enforcement
router
    .route('/:id')
    .get((0, userIsolation_1.enforceUserOwnership)('unit'), unitServices_1.getUnitById)
    .patch((0, userIsolation_1.enforceUserOwnership)('unit'), unitServices_1.updateUnit)
    .delete((0, userIsolation_1.enforceUserOwnership)('unit'), unitServices_1.deleteUnit);
// Unit-specific moves routes (moves for a specific unit)
router
    .route('/:id/moves')
    .get((0, userIsolation_1.enforceUserOwnership)('unit'), unitMoveServices_1.getUnitMovesByUnitId);
// Unit type specific routes (shared data, no ownership enforcement needed)
router
    .route('/type/:id')
    .get(unitTypeServices_1.getUnitTypeById)
    .patch(unitTypeServices_1.updateUnitType)
    .delete(unitTypeServices_1.deleteUnitType);
// Unit group specific routes with ownership enforcement
router
    .route('/group/:id')
    .get(
// Unit groups should be owned by users
unitGroupServices_1.getUnitGroupById)
    .patch(
// Add ownership check for unit groups
unitGroupServices_1.updateUnitGroup)
    .delete(
// Add ownership check for unit groups
unitGroupServices_1.deleteUnitGroup);
// Individual unit move routes with ownership enforcement
router
    .route('/move/:id')
    .get(unitMoveServices_1.getUnitMoveById)
    .patch(unitMoveServices_1.updateUnitMove)
    .delete(unitMoveServices_1.deleteUnitMove);
exports.default = router;

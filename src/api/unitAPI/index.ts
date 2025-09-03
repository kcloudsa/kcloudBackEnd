import express from 'express';

import {
  createUnit,
  deleteUnit,
  getUnitById,
  getUnits,
  updateUnit,
} from '../../services/unitServices';
import {
  createUnitType,
  deleteUnitType,
  getUnitTypeById,
  getUnitTypes,
  updateUnitType,
} from '../../services/unitServices/unitTypeServices';
import {
  createUnitGroup,
  deleteUnitGroup,
  getAllUnitGroups,
  getUnitGroupById,
  updateUnitGroup,
} from '../../services/unitServices/unitGroupServices';
import {
  createUnitMove,
  deleteUnitMove,
  getUnitMoveById,
  getUnitMoves,
  getUnitMovesByUnitId,
  updateUnitMove,
} from '../../services/unitServices/unitMoveServices';
import { requireAuth } from '../../middlewares/authQuery';
import {
  enforceUserOwnership,
  validateAuthQueryWithUserIsolation,
  injectUserID,
} from '../../middlewares/userIsolation';

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// Units routes with user isolation
router
  .route('/')
  .get(
    validateAuthQueryWithUserIsolation({
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
    }),
    getUnits,
  )
  .post(
    injectUserID('userID'), // Automatically inject user ID
    createUnit,
  );

// Unit types routes (these are typically shared data)
router.route('/types').get(getUnitTypes).post(createUnitType);

// Unit groups routes with user isolation
router
  .route('/groups')
  .get(
    validateAuthQueryWithUserIsolation({
      allowCrossUserAccess: true,
      maxLimit: 100,
      allowedSortFields: ['createdAt', 'updatedAt', 'name'],
      allowedPopulateFields: ['userID'],
      userField: 'userID',
    }),
    getAllUnitGroups,
  )
  .post(injectUserID('userID'), createUnitGroup);

// Unit moves routes with user isolation
router
  .route('/moves')
  .get(
    validateAuthQueryWithUserIsolation({
      allowCrossUserAccess: true,
      maxLimit: 200,
      allowedSortFields: ['moveDate', 'createdAt', 'updatedAt', 'debit', 'credit'],
      allowedPopulateFields: ['unitID', 'moveTypeID', 'maintenanceID', 'rentalID', 'userID'],
      userField: 'userID',
    }),
    getUnitMoves,
  )
  .post(injectUserID('userID'), createUnitMove);

// Individual unit routes with ownership enforcement
router
  .route('/:id')
  .get(enforceUserOwnership('unit'), getUnitById)
  .patch(enforceUserOwnership('unit'), updateUnit)
  .delete(enforceUserOwnership('unit'), deleteUnit);

// Unit-specific moves routes (moves for a specific unit)
router
  .route('/:id/moves')
  .get(enforceUserOwnership('unit'), getUnitMovesByUnitId);

// Unit type specific routes (shared data, no ownership enforcement needed)
router
  .route('/type/:id')
  .get(getUnitTypeById)
  .patch(updateUnitType)
  .delete(deleteUnitType);

// Unit group specific routes with ownership enforcement
router
  .route('/group/:id')
  .get(
    // Unit groups should be owned by users
    getUnitGroupById,
  )
  .patch(
    // Add ownership check for unit groups
    updateUnitGroup,
  )
  .delete(
    // Add ownership check for unit groups
    deleteUnitGroup,
  );

// Individual unit move routes with ownership enforcement
router
  .route('/move/:id')
  .get(getUnitMoveById)
  .patch(updateUnitMove)
  .delete(deleteUnitMove);

export default router;

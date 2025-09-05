import express from 'express';
import {
  createRental,
  deleteRental,
  getAllRentals,
  getRentalByID,
  getRentalsByUnitID,
  getRentalsByUserID,
  updateRental, // Add the correct update function
} from '../../services/rentalSevices';
import {
  createMoveType,
  getmoveTypes,
  updateMoveType,
  deleteMoveType,
} from '../../services/rentalSevices/moveTypeServices';
import {
  createRentalSource,
  getRentalSources,
  getRentalSourceById,
  updateRentalSource,
  deleteRentalSource,
} from '../../services/rentalSevices/rentalSource';
import { requireAuth } from '../../middlewares/authQuery';
import {
  enforceUserOwnership,
  validateAuthQueryWithUserIsolation,
  injectUserID,
} from '../../middlewares/userIsolation';

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// Rental routes with user isolation
router
  .route('/')
  .get(
    validateAuthQueryWithUserIsolation({
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
    }),
    getAllRentals,
  )
  .post(
    injectUserID('userID'), // Automatically inject user ID
    enforceUserOwnership('rental'), // Check unit ownership
    createRental,
  );

// Contract existence check
interface RouteHandler {
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): void | Promise<void>;
}

router.route('/check').post(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // keep auth; reuse getAllRentals middleware chain not needed
    next();
  },
  (async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    // lazy import to avoid circular deps
    const { checkContract } = await import('../../services/rentalSevices');
    return checkContract(req, res, next as any);
  }) as RouteHandler,
);

// User-specific rentals (redundant with main route but kept for compatibility)
router.route('/user').get(
  validateAuthQueryWithUserIsolation({
    allowCrossUserAccess: false,
    maxLimit: 100,
    allowedSortFields: ['createdAt', 'updatedAt', 'startDate', 'endDate'],
    allowedPopulateFields: ['unitID', 'moveTypeID', 'rentalSourceID'],
    userField: 'userID',
  }),
  getRentalsByUserID,
);

// Move type routes (these are typically shared data)
router.route('/movetype').get(getmoveTypes).post(createMoveType);
router.route('/movetype/:id').patch(updateMoveType).delete(deleteMoveType);

// Rental source routes (these are typically shared data)
router.route('/rentalsource').get(getRentalSources).post(createRentalSource);
router.route('/rentalsource/:id').get(getRentalSourceById).patch(updateRentalSource).delete(deleteRentalSource);


// Individual rental routes with ownership enforcement
router
  .route('/:id')
  .get(enforceUserOwnership('rental'), getRentalByID)
  .patch(enforceUserOwnership('rental'), updateRental)
  .delete(enforceUserOwnership('rental'), deleteRental);

// Unit-specific rentals
router.route('/unit/:id').get(
  validateAuthQueryWithUserIsolation({
    allowCrossUserAccess: false,
    maxLimit: 50,
    allowedSortFields: ['createdAt', 'startDate', 'endDate'],
    allowedPopulateFields: ['moveTypeID', 'rentalSourceID'],
    userField: 'userID',
  }),
  getRentalsByUnitID,
);

export default router;

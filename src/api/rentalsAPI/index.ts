import express from 'express';
import {
  deleteUser,
  getUserById,
  updateUser,
} from '../../services/userServices';
import {
  createRental,
  deleteRental,
  getAllRentals,
  getRentalByID,
  nameRental,
} from '../../services/rentalSevices';
import {
  createMoveType,
  getmoveTypes,
} from '../../services/rentalSevices/moveTypeServices';
import {
  createRentalSource,
  getRentalSources,
} from '../../services/rentalSevices/rentalSource';

const router = express.Router();

router.route('/').get(getAllRentals).post(createRental);
router.route('/movetype').get(getmoveTypes).post(createMoveType);
router.route('/rentalsource').get(getRentalSources).post(createRentalSource);
router.route('/:id').get(getRentalByID).patch(updateUser).delete(deleteRental);

export default router;

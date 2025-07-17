import express from 'express';
import {
  createUser,
  deleteUser,
  getUserById,
  updateUser,
} from '../../services/userServices';
import { nameRental } from '../../services/rentalSevices';

const router = express.Router();

router.route('/').get(nameRental).post(createUser);
router.route('/:id').get(getUserById).patch(updateUser).delete(deleteUser);

export default router;

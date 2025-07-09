import express from 'express';
import {
  allUsers,
  createUser,
  deleteUser,
  getUserById,
  updateUser,
} from '../../services/userServices';

const router = express.Router();

router.route('/').get(allUsers).post(createUser);
router.route('/:id').get(getUserById).patch(updateUser).delete(deleteUser);

export default router;

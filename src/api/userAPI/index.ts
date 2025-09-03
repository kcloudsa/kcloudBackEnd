import express from 'express';
import {
  allUsers,
  createUser,
  deleteUser,
  getUserById,
  updateUser,
} from '../../services/userServices';
import { requireAuth } from '../../middlewares/authQuery';
import {
  enforceUserOwnership,
  validateAuthQueryWithUserIsolation,
} from '../../middlewares/userIsolation';

const router = express.Router();

// User listing (admin only or for user management)
router
  .route('/')
  .get(
    requireAuth,
    validateAuthQueryWithUserIsolation({
      allowCrossUserAccess: true, // Only admins should access all users
      maxLimit: 100,
      allowedSortFields: [
        'createdAt',
        'updatedAt',
        'userName.firstName',
        'userName.lastName',
      ],
      allowedPopulateFields: [],
      userField: '_id',
    }),
    allUsers,
  )
  .post(createUser); // No auth required for signup, very low rate limit

// Individual user operations with strict ownership enforcement
router
  .route('/:id')
  .get(
    requireAuth,
    enforceUserOwnership('user'), // Users can only access their own profile
    getUserById,
  )
  .patch(
    requireAuth,
    enforceUserOwnership('user'), // Users can only update their own profile
    updateUser,
  )
  .delete(
    requireAuth,
    enforceUserOwnership('user'), // Users can only delete their own profile
    deleteUser,
  );

export default router;

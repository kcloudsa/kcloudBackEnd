import express from 'express';
import {
  createNotification,
  deleteNotification,
  getNotification,
  getNotificationsByUserId,
  getNotificationsById,
  updateNotification,
} from '../../services/notification';
import { requireAuth } from '../../middlewares/authQuery';
import {
  enforceUserOwnership,
  validateAuthQueryWithUserIsolation,
  injectUserID,
} from '../../middlewares/userIsolation';

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// Notification routes with user isolation
router
  .route('/')
  .get(
    validateAuthQueryWithUserIsolation({
      allowCrossUserAccess: true, // Admins can see all notifications
      maxLimit: 200,
      allowedSortFields: ['createdAt', 'updatedAt', 'type', 'read'],
      allowedPopulateFields: ['userID'],
      userField: 'userID',
    }),
    getNotification,
  )
  .post(
    injectUserID('userID'), // Automatically inject user ID
    createNotification,
  );

// User-specific notifications (for compatibility)
router.route('/user').get(
  validateAuthQueryWithUserIsolation({
    allowCrossUserAccess: false, // Users can only see their own notifications
    maxLimit: 100,
    allowedSortFields: ['createdAt', 'updatedAt', 'type', 'read'],
    allowedPopulateFields: [],
    userField: 'userID',
  }),
  getNotificationsByUserId,
);

// Individual notification routes with ownership enforcement
router
  .route('/:id')
  .get(enforceUserOwnership('notification'), getNotificationsById)
  .patch(enforceUserOwnership('notification'), updateNotification)
  .delete(enforceUserOwnership('notification'), deleteNotification);

export default router;

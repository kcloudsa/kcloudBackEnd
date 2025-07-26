import express from 'express';
import {
  createNotification,
  deleteNotification,
  getNotification,
  getNotificationsById,
  getNotificationsByUserId,
  updateNotification,
} from '../../services/notification';

const router = express.Router();

router.route('/').get(getNotification).post(createNotification);
router.route('/userNotifications').get(getNotificationsByUserId);

router
  .route('/:id')
  .get(getNotificationsById)
  .patch(updateNotification)
  .delete(deleteNotification);

export default router;

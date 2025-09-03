import express from 'express';
import MessageResponse from '../interfaces/MessageResponse';
import emojis from './emojis';
import userAPI from './userAPI';
import unitAPI from './unitAPI';
import rentalsAPI from './rentalsAPI';
import maintenanceAPI from './maintenanceAPI';
import statsAPI from './statsAPI';
import apiKey from './apiKey';
import notification from './notificationAPI';
import { routeErrorHandler } from '../middlewares/routeSetup';
import { updateAllStatuses } from '../services/statusUpdateServices';
import { runNotificationChecks } from '../services/autoNotificationServices';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

// Manual status update endpoint
router.post('/update-statuses', async (req, res) => {
  try {
    await updateAllStatuses();
    res.json({
      message: 'Status updates completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual status update error:', error);
    res.status(500).json({
      error: 'Failed to update statuses',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manual notification check endpoint
router.post('/check-notifications', async (req, res) => {
  try {
    await runNotificationChecks();
    res.json({
      message: 'Notification checks completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual notification check error:', error);
    res.status(500).json({
      error: 'Failed to run notification checks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API routes
router.use('/users', userAPI);
router.use('/units', unitAPI);
router.use('/rentals', rentalsAPI);
router.use('/maintenance', maintenanceAPI);
router.use('/stats', statsAPI);
router.use('/notifications', notification);
router.use('/apikeys', apiKey);
router.use('/emojis', emojis);

// Global error handler for all API routes
router.use(routeErrorHandler);

export default router;

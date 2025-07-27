import express from 'express';
import MessageResponse from '../interfaces/MessageResponse';
import emojis from './emojis';
import userAPI from './userAPI';
import unitAPI from './unitAPI';
import rentalsAPI from './rentalsAPI';
import apiKey from './apiKey';
import notification from './notification';
import { validateBody } from '../middlewares/validationBody';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

//user route
router.use('/users', userAPI);
router.use('/units', validateBody(), unitAPI);
router.use('/rentals', validateBody(), rentalsAPI);
router.use('/notification', validateBody(), notification);
router.use('/apikeys', apiKey);
router.use('/emojis', emojis);

export default router;

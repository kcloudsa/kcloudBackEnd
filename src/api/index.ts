import express from 'express';
import MessageResponse from '../interfaces/MessageResponse';
import emojis from './emojis';
import userAPI from './userAPI';
import unitAPI from './unitAPI';
import apiKey from './apiKey';
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
router.use('/emojis', emojis);
router.use('/apikeys', apiKey);
export default router;

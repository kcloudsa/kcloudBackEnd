import express from 'express';
import { getStats } from '../../services/statsService';
import { requireAuth } from '../../middlewares/authQuery';
// import { createRateLimit } from '../../middlewares/authQuery';

const router = express.Router();

// Require auth
router.use(requireAuth);

// Use POST for flexible, secure queries with body (supports date ranges and multiple scopes)
router.post('/', getStats);

// Also allow GET for simple queries via query params
router.get('/', getStats as any);

export default router;

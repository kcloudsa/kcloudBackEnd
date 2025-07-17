import { Request, Response, NextFunction } from 'express';
import { generateHashedAccessKey } from '../Utils/hashingKeys';

const DB_KEY = process.env.MASTER_DB_KEY || ''; // securely stored
const ROUTE_KEYS: Record<string, string> = {
  '/api/v1/unit': process.env.UNIT_ROUTE_KEY || '',
};

export const validateAccessKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.headers['x-user-id'] as string;
  const accessKey = req.headers['x-access-key'] as string;
  const timestamp = req.headers['x-access-ts'] as string;

  if (!userId || !accessKey || !timestamp) {
    return res
      .status(401)
      .json({ message: 'Missing headers: userId, accessKey or timestamp' });
  }

  const route = req.baseUrl;
  const routeKey = ROUTE_KEYS[route];
  if (!routeKey) {
    return res
      .status(403)
      .json({ message: 'Route not secured or unknown route key' });
  }

  const expectedHash = generateHashedAccessKey(
    DB_KEY,
    userId,
    routeKey,
    timestamp,
  );

  if (expectedHash !== accessKey) {
    return res.status(403).json({ message: 'Invalid or expired access key' });
  }

  // Optional: check if timestamp is not too old
  const delta = Math.abs(Date.now() - Number(timestamp));
  const ALLOWED_WINDOW_MS = 5 * 60 * 1000; // 5 min
  if (isNaN(delta) || delta > ALLOWED_WINDOW_MS) {
    return res
      .status(408)
      .json({ message: 'Access key expired or invalid timestamp' });
  }

  next();
};

import { Request, Response, NextFunction } from 'express';

import { compareKey } from '../Utils/hashingKeys';
import { ROUTE_KEYS_HASH } from '../config/secureKeys';

export const checkRouteKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const route = req.baseUrl; // or req.originalUrl
  const key = req.headers['x-route-key'];
  const expectedHash = ROUTE_KEYS_HASH[route as keyof typeof ROUTE_KEYS_HASH];

  if (
    !expectedHash ||
    !key ||
    typeof key !== 'string' ||
    !compareKey(key, expectedHash)
  ) {
    return res.status(403).json({ message: 'Invalid route key' });
  }
  next();
};

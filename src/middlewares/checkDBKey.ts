import { Request, Response, NextFunction } from 'express';
import { MASTER_DB_KEY_HASH } from '../config/secureKeys';
import { compareKey } from '../Utils/hashingKeys';

export const checkDBKey = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-db-key'];
  if (!key || typeof key !== 'string' || !compareKey(key, MASTER_DB_KEY_HASH)) {
    return res.status(401).json({ message: 'Invalid or missing DB API key' });
  }
  next();
};

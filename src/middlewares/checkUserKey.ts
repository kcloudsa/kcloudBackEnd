import { Request, Response, NextFunction } from 'express';
import { hashKey } from '../Utils/hashingKeys';
import apiKeyModel from '../models/apiKeyModel';

export const checkUserKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const key = req.headers['x-user-key'];
  if (!key || typeof key !== 'string') {
    return res.status(401).json({ message: 'Missing user API key' });
  }

  const hashed = hashKey(key);
  const found = await apiKeyModel.findOne({
    key: hashed,
    active: true,
  });

  if (!found) {
    return res.status(401).json({ message: 'Invalid or expired user API key' });
  }

  // optionally attach user to req
  req.body.user = found?.userID;
  next();
};

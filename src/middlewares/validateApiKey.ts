// middlewares/validateApiKey.ts
import { Request, Response, NextFunction } from 'express';
import apiKeyModel from '../models/apiKeyModel';

declare module 'express-serve-static-core' {
  interface Request {
    clientInfo?: { label: string; key: string };
  }
}

export const validateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const clientKey = req.headers['x-api-key'];

  if (!clientKey || typeof clientKey !== 'string') {
    return res
      .status(400)
      .json({ message: 'Missing or invalid API key header' });
  }

  const apiKey = await apiKeyModel.findOne({ key: clientKey, active: true });
  if (!apiKey) {
    return res
      .status(401)
      .json({ message: 'Unauthorized: Invalid or inactive API key' });
  }

  // Optionally attach info to request for later use (e.g., logging)
  req.clientInfo = { label: apiKey.label, key: apiKey.key };

  next();
};

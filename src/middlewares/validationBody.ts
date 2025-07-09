import UserModel from '../models/userModel';
import { Request, Response, NextFunction } from 'express';

export const validateBody = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res
          .status(400)
          .json({ message: 'Invalid or missing request body' });
      }

      const { userID } = req.body;

      if (!userID) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const user = await UserModel.findOne({ userID });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      (req as any).user = user;
      return next();
    } catch (error) {
      console.error('Error in validateBody:', error);
      return res.status(500).json({ message: 'Internal server error', error });
    }
  };
};

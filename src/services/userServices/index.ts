import { createUserSchema } from '../../validation/user/schema';
import Iuser, {
  IContactInfo,
  IPassword,
  IUserName,
  IUserTInfo,
} from '../../interfaces/Iuser';
import UserModel from '../../models/userModel';
// eslint-disable-next-line import/no-extraneous-dependencies
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { recordHistory } from '../../Utils/recordHistory';
import { Types } from 'mongoose';
import { getDeepDiff } from '../../Utils/deepDiff';
import { deepMerge } from '../../Utils/deepMerge';

export const nameUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    const emojis = ['yahia', '😀', '😳', '🙄'];
    res.json(emojis);
  } catch (error) {
    console.error('Error fetching emojis:', error);
    res.status(500).json({ message: 'Failed to fetch emojis', error });
  }
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten(),
      });
      return;
    }
    const data = parsed.data; // Now fully typed and safe!
    // Check if user already exists
    const existingUser = await UserModel.findOne({
      'contactInfo.email.email': data.contactInfo.email.email,
      'contactInfo.phone.phoneNumber': data.contactInfo.phone.phoneNumber,
    });
    if (existingUser) {
      // if (existingUser.active === false) {
      //   res.status(400).json({
      //     message: 'User already exists  but is inactive',
      //   });
      //   return;
      // }
      res.status(400).json({
        message: 'User with this  email or phone number already exists ',
      });
      return;
    }

    // Create user payload

    const userPayload = {
      userName: {
        firstName: data.userName.firstName,
        lastName: data.userName.lastName,
        displayName: data.userName.displayName,
      } as IUserName,
      contactInfo: {
        email: {
          email: data.contactInfo.email.email,
          verified: data.contactInfo.email.verified,
          verifiedAt: data.contactInfo.email.verifiedAt,
          verificationCode: data.contactInfo.email.verificationCode,
        },
        phone: {
          countryCode: data.contactInfo.phone.countryCode,
          phoneNumber: data.contactInfo.phone.phoneNumber,
          verified: data.contactInfo.phone.verified,
          verifiedAt: data.contactInfo.phone.verifiedAt,
          verificationCode: data.contactInfo.phone.verificationCode,
        },
      } as IContactInfo,
      password: {
        hashed: data.password.hashed,
        expirationDate: data.password.expirationDate,
      } as IPassword,
      historyID: data.historyID,
      userInfo: {
        gender: data.userInfo.gender,
        nationality: data.userInfo.nationality,
        address: {
          city: data.userInfo.address.city,
          country: data.userInfo.address.country,
        },
        profilePicture: data.userInfo.profilePicture || '',
      } as IUserTInfo,
      active: data.active ?? true,
      role: data.role,
      subUsersIDs: data.subUsersIDs || [],
      subscriptionID: data.subscriptionID,
      notes: data.notes || '',
    };

    const createdUser = await UserModel.create(userPayload);
    if (createdUser) {
      console.log('User created successfully:', createdUser);

      await recordHistory({
        table: 'User',
        documentId: createdUser._id as Types.ObjectId,
        action: 'create', // or 'update' based on your logic
        performedBy: {
          userId: createdUser._id as Types.ObjectId,
          name: createdUser.userName.slug,
          role: createdUser.role,
        },
        diff: createdUser.toObject(), // Assuming you want to log the entire user object
        reason: 'User Sign In', // optional
      });
      res.status(201).json(createdUser);
      return;
    } else {
      console.error('User creation failed: No user created');
      res.status(500).json({ message: 'User creation failed' });
      return;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user', error });
    return;
  }
});
export const allUsers = asyncHandler(async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find({});
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
});
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.findOne({ userID: userId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Failed to fetch user', error });
  }
});
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    const existingDoc = await UserModel.findOne({ userID: userId });
    if (!existingDoc) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const mergedData = deepMerge(existingDoc.toObject(), updateData);
    // Validate merged data against the schema
    // const parsed = createUserSchema.safeParse(mergedData);
    // if (!parsed.success) {
    //   res.status(400).json({
    //     message: 'Validation failed',
    //     errors: parsed.error.flatten(),
    //   });
    //   return;
    // }

    console.log(mergedData);

    const updatedUser = await UserModel.findOneAndUpdate(
      { userID: userId },
      mergedData,
      { new: true, runValidators: true },
    );
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found after update' });
      return;
    }
    const original = existingDoc?.toObject();
    const updated = updatedUser.toObject();

    const diff = getDeepDiff(original, updated);
    console.log(diff);
    await recordHistory({
      table: 'User',
      documentId: updatedUser._id as Types.ObjectId,
      action: 'update',
      performedBy: {
        userId: updatedUser._id as Types.ObjectId,
        name: updatedUser.userName.slug,
        role: updatedUser.role,
      },
      diff,
      reason: 'User updated the item',
    });
    res.status(200).json(updatedUser);
    return;
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error });
    return;
  }
});
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.findOne({ userID: userId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    await UserModel.deleteOne({ userID: userId });
    await recordHistory({
      table: 'User',
      documentId: user._id as Types.ObjectId,
      action: 'delete',
      performedBy: {
        userId: user._id as Types.ObjectId,
        name: user.userName.slug,
        role: user.role,
      },
      diff: user.toObject(),
      reason: 'User deleted the item',
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Failed to fetch user', error });
  }
});

export const getUserByEmail = async (email: string): Promise<Iuser | null> => {
  try {
    const user = await UserModel.findOne({
      'contactInfo.email.email': email,
    });
    return user; // null if not found
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error; // let caller handle errors
  }
};

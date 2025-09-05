"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getUserByEmail = exports.deleteUser = exports.updateUser = exports.getUserById = exports.allUsers = exports.createUser = exports.nameUser = void 0;
const schema_1 = require("../../validation/user/schema");
const userModel_1 = __importDefault(require("../../models/userModel"));
// eslint-disable-next-line import/no-extraneous-dependencies
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const recordHistory_1 = require("../../Utils/recordHistory");
const deepDiff_1 = require("../../Utils/deepDiff");
const deepMerge_1 = require("../../Utils/deepMerge");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.nameUser = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const emojis = ['yahia', '😀', '😳', '🙄'];
        res.json(emojis);
    }
    catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ message: 'Failed to fetch emojis', error });
    }
});
exports.createUser = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const parsed = schema_1.createUserSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: 'Validation failed',
                errors: parsed.error.flatten(),
            });
            return;
        }
        const data = parsed.data; // Now fully typed and safe!
        // Check if user already exists
        const existingUser = await userModel_1.default.findOne({
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
            },
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
            },
            password: {
                hashed: data.password.hashed,
                expirationDate: data.password.expirationDate,
            },
            historyID: data.historyID,
            userInfo: {
                gender: data.userInfo.gender,
                nationality: data.userInfo.nationality,
                address: {
                    city: data.userInfo.address.city,
                    country: data.userInfo.address.country,
                },
                profilePicture: data.userInfo.profilePicture || '',
            },
            active: data.active ?? true,
            role: data.role,
            subUsersIDs: data.subUsersIDs || [],
            subscriptionID: data.subscriptionID,
            notes: data.notes || '',
        };
        const createdUser = await userModel_1.default.create(userPayload);
        if (createdUser) {
            console.log('User created successfully:', createdUser);
            await (0, recordHistory_1.recordHistory)({
                table: 'User',
                documentId: createdUser._id,
                action: 'create', // or 'update' based on your logic
                performedBy: {
                    userId: createdUser._id,
                    name: createdUser.userName.slug,
                    role: createdUser.role,
                },
                diff: createdUser.toObject(), // Assuming you want to log the entire user object
                reason: 'User Sign In', // optional
            });
            res.status(201).json(createdUser);
            return;
        }
        else {
            console.error('User creation failed: No user created');
            res.status(500).json({ message: 'User creation failed' });
            return;
        }
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Failed to create user', error });
        return;
    }
});
exports.allUsers = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const users = await userModel_1.default.find({});
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Failed to fetch users', error });
    }
});
exports.getUserById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userModel_1.default.findOne({ userID: userId });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ message: 'Failed to fetch user', error });
    }
});
exports.updateUser = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;
        console.log("🔍 Backend received userId:", userId);
        console.log("🔍 Backend received updateData:", updateData);
        console.log("🔍 Backend req.body type:", typeof updateData);
        console.log("🔍 Backend req.body keys:", Object.keys(updateData));
        const existingDoc = await userModel_1.default.findOne({ userID: userId });
        if (!existingDoc) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const mergedData = (0, deepMerge_1.deepMerge)(existingDoc.toObject(), updateData);
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
        const updatedUser = await userModel_1.default.findOneAndUpdate({ userID: userId }, mergedData, { new: true, runValidators: true });
        if (!updatedUser) {
            res.status(404).json({ message: 'User not found after update' });
            return;
        }
        const original = existingDoc?.toObject();
        const updated = updatedUser.toObject();
        const diff = (0, deepDiff_1.getDeepDiff)(original, updated);
        console.log(diff);
        await (0, recordHistory_1.recordHistory)({
            table: 'User',
            documentId: updatedUser._id,
            action: 'update',
            performedBy: {
                userId: updatedUser._id,
                name: updatedUser.userName.slug,
                role: updatedUser.role,
            },
            diff,
            reason: 'User updated the item',
        });
        res.status(200).json(updatedUser);
        return;
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user', error });
        return;
    }
});
exports.deleteUser = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userModel_1.default.findOne({ userID: userId });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        await userModel_1.default.deleteOne({ userID: userId });
        await (0, recordHistory_1.recordHistory)({
            table: 'User',
            documentId: user._id,
            action: 'delete',
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff: user.toObject(),
            reason: 'User deleted the item',
        });
        res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ message: 'Failed to fetch user', error });
    }
});
const getUserByEmail = async (email) => {
    try {
        const user = await userModel_1.default.findOne({
            'contactInfo.email.email': email,
        });
        return user; // null if not found
    }
    catch (error) {
        console.error('Error fetching user by email:', error);
        throw error; // let caller handle errors
    }
};
exports.getUserByEmail = getUserByEmail;
// Change user password with optional old password verification
exports.changePassword = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const userId = req.params.id;
        const { oldPassword, newPassword, allowWithoutOld } = req.body;
        if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
            res.status(400).json({ message: 'New password must be at least 8 characters' });
            return;
        }
        const user = await userModel_1.default.findOne({ userID: userId });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const storedHash = user.password?.hashed || '';
        // Require old password unless explicitly allowed (e.g., OAuth user setting password first time)
        if (!allowWithoutOld) {
            if (!oldPassword) {
                res.status(400).json({ message: 'Current password is required' });
                return;
            }
            if (storedHash) {
                const isMatch = await bcryptjs_1.default.compare(oldPassword, storedHash);
                if (!isMatch) {
                    res.status(401).json({ message: 'Current password is incorrect' });
                    return;
                }
            }
        }
        const hashedPassword = newPassword.startsWith('$2')
            ? newPassword
            : await bcryptjs_1.default.hash(newPassword, 12);
        // Use save() to trigger any model hooks
        user.password = {
            ...(user.password || {}),
            hashed: hashedPassword,
            expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        };
        await user.save();
        await (0, recordHistory_1.recordHistory)({
            table: 'User',
            documentId: user._id,
            action: 'update',
            performedBy: {
                userId: user._id,
                name: user.userName.slug,
                role: user.role,
            },
            diff: { password: 'updated' },
            reason: 'User changed password',
        });
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Failed to change password', error });
    }
});

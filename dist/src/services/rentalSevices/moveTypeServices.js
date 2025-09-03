"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMoveType = exports.getmoveTypes = exports.nameMoveType = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const moveType_1 = require("../../validation/moveType");
const moveTypeModel_1 = require("../../models/moveTypeModel");
const recordHistory_1 = require("../../Utils/recordHistory");
exports.nameMoveType = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const emojis = ['yahia', '😀', '😳', '🙄'];
        res.json(emojis);
    }
    catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ message: 'Failed to fetch emojis', error });
    }
});
exports.getmoveTypes = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const filter = {};
        const user = req.user;
        const queryUserId = (req.query && (req.query.userID || req.query.userId));
        if (queryUserId)
            filter.userId = queryUserId;
        else if (user && user._id)
            filter.userId = user._id;
        const moveTypes = await moveTypeModel_1.MoveTypeModel.find(filter);
        res.json({ success: true, data: moveTypes });
        return;
    }
    catch (error) {
        console.error('Error fetching unit types:', error);
        res.status(500).json({ message: 'Failed to fetch move types', error });
        return;
    }
});
exports.createMoveType = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        // Use authenticated user from Passport (req.user) per migration guide
        const user = req.user;
        if (!user) {
            // Unauthenticated
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            return;
        }
        // Derive a stable user id from `req.user` which might be a string, ObjectId, or object
        const rawReqUser = req.user;
        let rawAuthId = null;
        if (typeof rawReqUser === 'string' && rawReqUser.trim()) {
            rawAuthId = rawReqUser;
        }
        else if (rawReqUser && rawReqUser._id) {
            rawAuthId = rawReqUser._id;
        }
        else if (rawReqUser && rawReqUser.id) {
            rawAuthId = rawReqUser.id;
        }
        else if (rawReqUser && rawReqUser.userID) {
            rawAuthId = rawReqUser.userID;
        }
        else if (rawReqUser && rawReqUser.userId) {
            rawAuthId = rawReqUser.userId;
        }
        if (!rawAuthId) {
            // Log minimal debug info to help diagnose the shape of req.user without dumping secrets
            console.error('createMoveType: authenticated user present but no id field. userType=', typeof rawReqUser, 'userKeys=', typeof rawReqUser === 'object' ? Object.keys(rawReqUser) : undefined);
            res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authenticated user has no id' });
            return;
        }
        const authUserId = rawAuthId;
        const type = req.body.type;
        if (!type) {
            res.status(404).json({ message: 'type not found' });
            return;
        }
        // Check uniqueness per user (type + userId)
        const existingUnitType = await moveTypeModel_1.MoveTypeModel.findOne({
            type: type,
            userId: authUserId,
        });
        if (existingUnitType) {
            res.status(409).json({ message: 'Move type already exists for this user' });
            return;
        }
        const parsed = moveType_1.createMoveTypeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: 'Validation failed',
                errors: parsed.error.flatten(),
            });
            return;
        }
        // Debug: log the derived auth user id (small, non-sensitive) to help diagnose validation issues
        console.debug('createMoveType: creating MoveType with userId=', typeof authUserId, authUserId ? String(authUserId).slice(0, 40) : authUserId);
        let newMoveType;
        try {
            newMoveType = await moveTypeModel_1.MoveTypeModel.create({
                type: type,
                // model requires `userId` (camelCase) — populate from authenticated user (accept ObjectId or string)
                userId: authUserId,
            });
        }
        catch (err) {
            // Convert duplicate key errors into a 409 with a helpful message
            if (err && err.code === 11000) {
                console.warn('Duplicate MoveType insert detected for user:', String(authUserId).slice(0, 24));
                res.status(409).json({ message: 'Move type already exists for this user' });
                return;
            }
            throw err;
        }
        await (0, recordHistory_1.recordHistory)({
            table: 'MoveType',
            documentId: newMoveType._id,
            action: 'create',
            performedBy: {
                userId: authUserId,
                name: ((user.userName && (user.userName.slug || user.userName.displayName)) || user.contactInfo.email),
                role: user.role,
            },
            diff: newMoveType.toObject(),
            reason: 'User create new Move type',
        });
        res.status(201).json({ success: true, message: 'Move type created successfully', data: newMoveType });
        return;
    }
    catch (error) {
        console.error('Error fetching Move type :', error);
        res.status(500).json({ message: 'Failed to fetch Move type ', error });
        return;
    }
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserSchema = void 0;
// eslint-disable-next-line import/no-extraneous-dependencies
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    userName: zod_1.z.object({
        firstName: zod_1.z.string().min(1, 'First name is required'),
        lastName: zod_1.z.string().min(1, 'Last name is required'),
        displayName: zod_1.z.string().min(1, 'Display name is required'),
    }),
    contactInfo: zod_1.z.object({
        email: zod_1.z.object({
            email: zod_1.z.string().email(),
            verified: zod_1.z.boolean(),
            verifiedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.string(), zod_1.z.null()]),
            verificationCode: zod_1.z.string(),
        }),
        phone: zod_1.z.object({
            countryCode: zod_1.z.string(),
            phoneNumber: zod_1.z.string(),
            verified: zod_1.z.boolean(),
            verifiedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.string(), zod_1.z.null()]),
            verificationCode: zod_1.z.string(),
        }),
    }),
    password: zod_1.z.object({
        hashed: zod_1.z.string(),
        expirationDate: zod_1.z.union([zod_1.z.date(), zod_1.z.string()]),
    }),
    historyID: zod_1.z.string().nullable().optional(),
    userInfo: zod_1.z.object({
        gender: zod_1.z.string(),
        nationality: zod_1.z.string(),
        address: zod_1.z.object({
            city: zod_1.z.string(),
            country: zod_1.z.string(),
        }),
        profilePicture: zod_1.z.string().optional(),
    }),
    active: zod_1.z.boolean().optional(),
    role: zod_1.z.enum(['user', 'owner', 'admin', 'demo', 'tenant']),
    subUsersIDs: zod_1.z.array(zod_1.z.string()).optional(),
    subscriptionID: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});

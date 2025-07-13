"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubUserModel = void 0;
const mongoose_1 = require("mongoose");
const slugify_1 = require("../Utils/slugify");
const subUserSchema = new mongoose_1.Schema({
    id: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    superAdminID: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    name: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        displayName: { type: String, required: true },
        slug: {
            type: String,
            required: true,
            unique: true,
            set: slugify_1.slugify,
            lowercase: true,
        },
    },
    contactInfo: {
        email: {
            email: { type: String, required: true },
            verified: { type: Boolean, default: false },
            verifiedAt: { type: Date },
            verificationCode: { type: String },
        },
        phone: {
            countryCode: { type: String, required: true },
            phoneNumber: { type: String, required: true },
            verified: { type: Boolean, default: false },
            verifiedAt: { type: Date },
            verificationCode: { type: String },
        },
    },
    premissions: { type: [String], required: true },
    status: { type: String, required: true },
    password: {
        hashed: { type: String, required: true },
        expirationDate: { type: Date, required: true },
    },
    avatar: { type: String },
});
exports.SubUserModel = (0, mongoose_1.model)('SubUser', subUserSchema);

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// eslint-disable-next-line import/no-extraneous-dependencies
const ulid_1 = require("ulid");
const slugify_1 = require("../Utils/slugify");
const userSchema = new mongoose_1.Schema({
    userID: {
        type: String,
        unique: true,
        default: ulid_1.ulid,
    },
    userName: {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        displayName: { type: String, required: true, trim: true },
        slug: {
            type: String,
            required: false,
            lowercase: true,
        },
    },
    active: { type: Boolean, default: true },
    notes: { type: String },
    userInfo: {
        gender: { type: String, required: true, trim: true },
        nationality: {
            type: String,
            required: true,
            trim: true,
            default: 'Saudi',
        },
        address: {
            city: { type: String, required: true, trim: true },
            country: { type: String, required: true, trim: true },
        },
        profilePicture: { type: String },
    },
    role: {
        type: String,
        required: true,
        trim: true,
        default: 'user',
        enum: ['user', 'owner', 'admin', 'demo', 'tenant'],
    },
    historyID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'History',
        required: false,
        default: null,
    },
    contactInfo: {
        email: {
            email: { type: String, required: true, trim: true, unique: true },
            verified: { type: Boolean, default: false },
            verifiedAt: { type: Date },
            verificationCode: { type: String, required: true, trim: true },
        },
        phone: {
            countryCode: { type: String, required: true, trim: true },
            phoneNumber: { type: String, required: true, trim: true, unique: true },
            verified: { type: Boolean, default: false },
            verifiedAt: { type: Date },
            verificationCode: { type: String, required: true, trim: true },
        },
    },
    subscriptionID: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Subscription' },
    subUsersIDs: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'SubUser' }],
        default: [],
        validate: {
            validator: (v) => Array.isArray(v) &&
                v.every((id) => mongoose_1.default.Types.ObjectId.isValid(id)),
            message: 'Each sub user ID must be a valid ObjectId',
        },
    },
    password: {
        hashed: { type: String, required: true, trim: true },
        expirationDate: { type: Date, required: true },
    },
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password?.hashed)
        return next();
    this.userName.slug = (0, slugify_1.slugify)(`${this.userName.firstName} ${this.userName.lastName}`);
    this.password.hashed = await bcryptjs_1.default.hash(this.password.hashed, 12);
    next();
});
const UserModel = mongoose_1.default.model('User', userSchema);
exports.default = UserModel;

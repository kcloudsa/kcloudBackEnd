"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllUserRefreshTokens = exports.deleteRefreshToken = exports.verifyRefreshToken = exports.storeRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const refreshTokenModel_1 = __importDefault(require("../models/refreshTokenModel"));
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret';
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = () => {
    return crypto_1.default.randomBytes(64).toString('hex');
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, ACCESS_TOKEN_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
const storeRefreshToken = async (userId, refreshToken) => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    // Remove any existing refresh tokens for this user
    await refreshTokenModel_1.default.deleteMany({ userId });
    // Store new refresh token
    await refreshTokenModel_1.default.create({
        userId,
        token: refreshToken,
        expiresAt,
    });
};
exports.storeRefreshToken = storeRefreshToken;
const verifyRefreshToken = async (token) => {
    const tokenDoc = await refreshTokenModel_1.default.findOne({
        token,
        expiresAt: { $gt: new Date() },
    });
    return tokenDoc ? tokenDoc.userId : null;
};
exports.verifyRefreshToken = verifyRefreshToken;
const deleteRefreshToken = async (token) => {
    await refreshTokenModel_1.default.deleteOne({ token });
};
exports.deleteRefreshToken = deleteRefreshToken;
const deleteAllUserRefreshTokens = async (userId) => {
    await refreshTokenModel_1.default.deleteMany({ userId });
};
exports.deleteAllUserRefreshTokens = deleteAllUserRefreshTokens;

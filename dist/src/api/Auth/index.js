"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthAPI = void 0;
const express_1 = require("@auth/express");
const google_1 = __importDefault(require("@auth/express/providers/google"));
const credentials_1 = __importDefault(require("@auth/express/providers/credentials"));
const email_1 = __importDefault(require("@auth/express/providers/email"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userServices_1 = require("../../services/userServices");
const AuthAPI = (req, res, next) => {
    // Validate required environment variables
    const requiredEnvVars = [
        'AUTH_SECRET'
    ];
    const optionalEnvVars = [
        'AUTH_GOOGLE_ID',
        'AUTH_GOOGLE_SECRET',
        'EMAIL_SERVER_HOST',
        'EMAIL_SERVER_PORT',
        'EMAIL_FROM',
        'EMAIL_PASS'
    ];
    const missingRequiredVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingRequiredVars.length > 0) {
        console.error('Missing REQUIRED environment variables:', missingRequiredVars);
        return res.status(500).json({ error: 'Server configuration error' });
    }
    const missingOptionalVars = optionalEnvVars.filter(envVar => !process.env[envVar]);
    if (missingOptionalVars.length > 0) {
        console.warn('Missing optional environment variables (some providers may not work):', missingOptionalVars);
    }
    // Build providers array based on available environment variables
    const providers = [
        (0, credentials_1.default)({
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }
                const user = (await (0, userServices_1.getUserByEmail)(credentials.email));
                if (user &&
                    user.password?.hashed &&
                    bcryptjs_1.default.compareSync(credentials.password, user.password.hashed)) {
                    return {
                        id: user.userID,
                        email: user.contactInfo?.email?.email,
                    };
                }
                return null;
            },
        })
    ];
    // Add Google provider only if credentials are available
    if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
        providers.push((0, google_1.default)({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }));
    }
    // Add Email provider only if email credentials are available
    if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_PORT && process.env.EMAIL_FROM && process.env.EMAIL_PASS) {
        providers.push((0, email_1.default)({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: parseInt(process.env.EMAIL_SERVER_PORT, 10),
                auth: {
                    user: process.env.EMAIL_FROM,
                    pass: process.env.EMAIL_PASS,
                },
            },
            from: process.env.EMAIL_FROM,
        }));
    }
    return (0, express_1.ExpressAuth)({
        providers,
        callbacks: {
            async session({ session, token }) {
                session.user.id = token.sub;
                return session;
            },
        },
        secret: process.env.AUTH_SECRET,
        trustHost: true,
    })(req, res, next);
};
exports.AuthAPI = AuthAPI;

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
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
// import xssClean from 'xss-clean';
const middlewares = __importStar(require("./middlewares"));
const api_1 = __importDefault(require("./api"));
const DBConnection_1 = __importDefault(require("./Utils/DBConnection"));
require('dotenv').config();
const app = (0, express_1.default)();
// Connect to DB
(0, DBConnection_1.default)();
// Set basic middleware
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.set('trust proxy', true); // for HTTPS and rate limiting behind proxy
// Helmet for security headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Adjust based on frontend
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
// Rate Limiter
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Data sanitization against NoSQL injection and XSS
app.use((0, express_mongo_sanitize_1.default)());
// app.use(xssClean()); // Prevents XSS attacks
// CORS configuration
const allowedOrigins = [
    'https://k-cloud-frontend.vercel.app',
    'https://www.kcloud.com.sa',
    'http://localhost:8000',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
// Force HTTPS in production (after setting trust proxy)
// if (process.env.NODE_ENV === 'production') {
// app.use((req, res, next) => {
//   if (req.headers['x-forwarded-proto'] !== 'https') {
//     return res.redirect(`https://${req.headers.host}${req.url}`);
//   }
//   next();
// });
// }
// Health check
app.get('/', (req, res) => {
    res.json({
        message: '✨🌎👋 Hello From Kcloud 👋 🌏✨',
    });
});
// API routes
// app.use('/auth', AuthAPI);
app.use('/api/v1', api_1.default);
// 404 and error handler
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);
exports.default = app;

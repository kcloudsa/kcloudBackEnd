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
// import xssClean from 'xss-clean';
const middlewares = __importStar(require("./middlewares"));
const api_1 = __importDefault(require("./api"));
const DBConnection_1 = __importDefault(require("./Utils/DBConnection"));
const Auth_1 = require("./api/Auth");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const DBConnection_2 = require("./Utils/DBConnection");
const passport_1 = __importDefault(require("passport"));
const node_cron_1 = __importDefault(require("node-cron"));
const statusUpdateServices_1 = require("./services/statusUpdateServices");
const autoNotificationServices_1 = require("./services/autoNotificationServices");
require('dotenv').config();
const app = (0, express_1.default)();
// Connect to DB
(0, DBConnection_1.default)();
// Schedule status update jobs
// Run every hour to update unit and rental statuses
node_cron_1.default.schedule('0 * * * *', async () => {
    try {
        console.log('Running scheduled status updates...');
        await (0, statusUpdateServices_1.updateAllStatuses)();
        console.log('Scheduled status updates completed successfully');
    }
    catch (error) {
        console.error('Error in scheduled status updates:', error);
    }
});
// Schedule notification checks
// Run every 3 minutes to check for notification triggers
node_cron_1.default.schedule('*/3 * * * *', async () => {
    try {
        console.log('Running scheduled notification checks...');
        await (0, autoNotificationServices_1.runNotificationChecks)();
        console.log('Scheduled notification checks completed successfully');
    }
    catch (error) {
        console.error('Error in scheduled notification checks:', error);
    }
});
// Run once at startup to ensure statuses are current
setTimeout(async () => {
    try {
        console.log('Running startup status updates...');
        await (0, statusUpdateServices_1.updateAllStatuses)();
        console.log('Startup status updates completed successfully');
    }
    catch (error) {
        console.error('Error in startup status updates:', error);
    }
}, 5000); // Wait 5 seconds after startup to ensure DB is ready
// Set basic middleware
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.set('case sensitive routing', true);
app.set('strict routing', true);
app.use((0, cookie_parser_1.default)());
// app.set('trust proxy', true); // for HTTPS and rate limiting behind proxy
// Explicitly handle preflight for all routes
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, Cache-Control, Cookie');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Expose-Headers', 'Set-Cookie, X-CSRF-Token');
        return res.status(200).end();
    }
    next();
});
// Helmet for security headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Adjust based on frontend
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
// Rate Limiter
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Increased from 100 to 2000 for development
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        code: 'GLOBAL_RATE_LIMIT_EXCEEDED'
    }
});
app.use(limiter);
// Data sanitization against NoSQL injection and XSS
// app.use(mongoSanitize());
// app.use(xssClean()); // Prevents XSS attacks
// CORS configuration
const allowedOrigins = [
    'https://k-cloud-frontend.vercel.app',
    'https://www.kcloud.com.sa',
    'http://localhost:5173',
    'http://localhost:4173',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS Get; the hell out of here'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-CSRF-Token',
        'X-Requested-With',
        'Cache-Control',
        'Cookie'
    ],
    exposedHeaders: ['Set-Cookie', 'X-CSRF-Token'],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));
// Add session middleware for OAuth state management
// Configure session store backed by MongoDB so sessions survive server restarts
const sessionTtlSeconds = Number(process.env.SESSION_TTL_SECONDS || 24 * 60 * 60 * 15); // default 24h
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: connect_mongo_1.default.create({
        clientPromise: (0, DBConnection_2.mongoClientPromise)(),
        ttl: sessionTtlSeconds,
        stringify: false,
        autoRemove: 'native'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: sessionTtlSeconds * 1000
    }
}));
// Initialize Passport and restore authentication state from session
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
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
app.use('/auth', Auth_1.AuthAPI);
app.use('/api/v1', api_1.default);
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found or incorrect casing.' });
});
// app.use('/api/v1', validateApiKey, (req, res, next) => {
//   res.json({
//     message: `Hello ${
//       req.clientInfo && req.clientInfo.label ? req.clientInfo.label : 'Guest'
//     }`,
//   });
//   next();
// });
// 404 and error handler
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);
exports.default = app;

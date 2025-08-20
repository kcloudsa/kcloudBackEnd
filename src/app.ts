import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
// import xssClean from 'xss-clean';
import * as middlewares from './middlewares';
import api from './api';
import MessageResponse from './interfaces/MessageResponse';
import DBConnection from './Utils/DBConnection';
import { validateApiKey } from './middlewares/validateApiKey';
import { AuthAPI } from './api/Auth';
import cookieParser from 'cookie-parser';
import session from 'express-session';
require('dotenv').config();

const app = express();

// Connect to DB
DBConnection();

// Set basic middleware
app.use(morgan('dev'));
app.use(express.json());
app.set('case sensitive routing', true);
app.set('strict routing', true);
app.use(cookieParser());
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
app.use(
  helmet({
    contentSecurityPolicy: false, // Adjust based on frontend
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
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
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
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
  }),
);

// Add session middleware for OAuth state management
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 10 * 60 * 1000 // 10 minutes
  }
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
app.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: '✨🌎👋 Hello From Kcloud 👋 🌏✨',
  });
});

// API routes
app.use('/auth', AuthAPI);

app.use('/api/v1', api);
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

export default app;

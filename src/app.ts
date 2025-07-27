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
require('dotenv').config();

const app = express();

// Connect to DB
DBConnection();

// Set basic middleware
app.use(morgan('dev'));
app.use(express.json());
app.set('case sensitive routing', true);
app.set('strict routing', true);
// app.set('trust proxy', true); // for HTTPS and rate limiting behind proxy

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
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

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
// app.use('/auth', AuthAPI);

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

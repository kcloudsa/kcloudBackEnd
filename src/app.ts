import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import * as middlewares from './middlewares';
import api from './api';
import MessageResponse from './interfaces/MessageResponse';
import DBConnection from './Utils/DBConnection';
require('dotenv').config();
import { AuthAPI } from './api/Auth';

const app = express();
DBConnection();
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.set('trust proxy', true);
// Attach the AuthAPI to handle all /auth/* routes
app.use('/auth', AuthAPI);

app.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄',
  });
});

//auth route

app.use('/api/v1', api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;

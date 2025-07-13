// import app from '../src/app';

// const port = process.env.PORT || 8000;

// // For local development
// if (process.env.NODE_ENV !== 'production') {
//   app.listen(port, () => {
//     /* eslint-disable no-console */
//     console.log(`Listening: http://localhost:${port}`);
//     /* eslint-enable no-console */
//   });
// }

// // Export for Vercel
// export default app;
import express, { Request, Response } from 'express';
const serverless = require('serverless-http');

const app = express();

// Define a route (must be relative to /api/express)
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Express on Vercel!' });
});
app.get('/ping', (req: Request, res: Response) => {
  res.json({ message: 'pong', timestamp: Date.now() });
});

// This exposes the Express app as a serverless handler
module.exports = app;
module.exports.handler = serverless(app);

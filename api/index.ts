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
import serverless from 'serverless-http';

const app = express();

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from Express on Vercel!' });
});

app.get('/ping', (_req: Request, res: Response) => {
  res.json({ message: 'pong', timestamp: Date.now() });
});
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Local server running at http://localhost:${PORT}`);
  });
}
export default serverless(app);

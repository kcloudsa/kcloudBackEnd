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
  return;
});

app.get('/ping', (_req: Request, res: Response) => {
  res.json({ message: 'pong', timestamp: Date.now() });
  return;
});
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Local server running at http://localhost:${PORT}`);
    return;
  });
}
export default serverless(app);

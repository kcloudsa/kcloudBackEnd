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

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (_req: Request, res: Response) => {
  return res.send('Express Typescript on Vercel');
});

app.get('/ping', (_req: Request, res: Response) => {
  return res.send('pong 🏓');
});

app.listen(port, () => {
  return console.log(`Server is listening on ${port}`);
});

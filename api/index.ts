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
import app from '../src/app';
import { createServer } from 'http';
import { NowRequest, NowResponse } from '@vercel/node';

export default (req: NowRequest, res: NowResponse) => {
  const server = createServer(app);
  server.emit('request', req, res);
};

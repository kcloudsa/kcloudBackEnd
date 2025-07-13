import app from '../src/app';
import serverless from 'serverless-http';
const port = process.env.PORT || 8000;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    /* eslint-disable no-console */
    console.log(`Listening: http://localhost:${port}`);
    /* eslint-enable no-console */
  });
}
export default serverless(app);

import app from '../src/app';
const port = Number(process.env.PORT) || 8000;
const hostname = "0.0.0.0";

// For local development
// if (process.env.NODE_ENV !== 'production') {
app.listen(port, hostname, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});
// }
export default app;

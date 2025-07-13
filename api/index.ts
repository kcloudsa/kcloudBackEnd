import app from '../src/app';
const port = process.env.PORT || 8000;

// For local development
// if (process.env.NODE_ENV !== 'production') {
app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});
// }
export default app;

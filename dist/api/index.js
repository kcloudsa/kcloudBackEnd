"use strict";
// import app from '../src/app';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const express_1 = __importDefault(require("express"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const app = (0, express_1.default)();
app.get('/', (_req, res) => {
    res.json({ message: 'Hello from Express on Vercel!' });
});
app.get('/ping', (_req, res) => {
    res.json({ message: 'pong', timestamp: Date.now() });
});
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Local server running at http://localhost:${PORT}`);
    });
}
exports.default = (0, serverless_http_1.default)(app);

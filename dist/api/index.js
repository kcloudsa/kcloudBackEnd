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
const app_1 = __importDefault(require("../src/app"));
const http_1 = require("http");
exports.default = (req, res) => {
    const server = (0, http_1.createServer)(app_1.default);
    server.emit('request', req, res);
};

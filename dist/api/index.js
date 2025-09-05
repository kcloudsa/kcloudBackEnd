"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../src/app"));
const port = Number(process.env.PORT) || 8000;
const hostname = "0.0.0.0";
// For local development
// if (process.env.NODE_ENV !== 'production') {
app_1.default.listen(port, hostname, () => {
    /* eslint-disable no-console */
    console.log(`Listening: http://localhost:${port}`);
    /* eslint-enable no-console */
});
// }
exports.default = app_1.default;

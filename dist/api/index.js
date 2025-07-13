"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../src/app"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const port = process.env.PORT || 8000;
// For local development
if (process.env.NODE_ENV !== 'production') {
    app_1.default.listen(port, () => {
        /* eslint-disable no-console */
        console.log(`Listening: http://localhost:${port}`);
        /* eslint-enable no-console */
    });
}
exports.default = (0, serverless_http_1.default)(app_1.default);

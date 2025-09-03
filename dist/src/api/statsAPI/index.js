"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const statsService_1 = require("../../services/statsService");
const authQuery_1 = require("../../middlewares/authQuery");
// import { createRateLimit } from '../../middlewares/authQuery';
const router = express_1.default.Router();
// Require auth
router.use(authQuery_1.requireAuth);
// Use POST for flexible, secure queries with body (supports date ranges and multiple scopes)
router.post('/', statsService_1.getStats);
// Also allow GET for simple queries via query params
router.get('/', statsService_1.getStats);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApiKey = void 0;
const apiKeyModel_1 = __importDefault(require("../models/apiKeyModel"));
const validateApiKey = async (req, res, next) => {
    const clientKey = req.headers['x-api-key'];
    if (!clientKey || typeof clientKey !== 'string') {
        return res
            .status(400)
            .json({ message: 'Missing or invalid API key header' });
    }
    const apiKey = await apiKeyModel_1.default.findOne({ key: clientKey, active: true });
    if (!apiKey) {
        return res
            .status(401)
            .json({ message: 'Unauthorized: Invalid or inactive API key' });
    }
    // Optionally attach info to request for later use (e.g., logging)
    req.clientInfo = { label: apiKey.label, key: apiKey.key };
    next();
};
exports.validateApiKey = validateApiKey;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccessKey = void 0;
const hashingKeys_1 = require("../Utils/hashingKeys");
const DB_KEY = process.env.MASTER_DB_KEY || ''; // securely stored
const ROUTE_KEYS = {
    '/api/v1/unit': process.env.UNIT_ROUTE_KEY || '',
};
const validateAccessKey = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const accessKey = req.headers['x-access-key'];
    const timestamp = req.headers['x-access-ts'];
    if (!userId || !accessKey || !timestamp) {
        return res
            .status(401)
            .json({ message: 'Missing headers: userId, accessKey or timestamp' });
    }
    const route = req.baseUrl;
    const routeKey = ROUTE_KEYS[route];
    if (!routeKey) {
        return res
            .status(403)
            .json({ message: 'Route not secured or unknown route key' });
    }
    const expectedHash = (0, hashingKeys_1.generateHashedAccessKey)(DB_KEY, userId, routeKey, timestamp);
    if (expectedHash !== accessKey) {
        return res.status(403).json({ message: 'Invalid or expired access key' });
    }
    // Optional: check if timestamp is not too old
    const delta = Math.abs(Date.now() - Number(timestamp));
    const ALLOWED_WINDOW_MS = 5 * 60 * 1000; // 5 min
    if (isNaN(delta) || delta > ALLOWED_WINDOW_MS) {
        return res
            .status(408)
            .json({ message: 'Access key expired or invalid timestamp' });
    }
    next();
};
exports.validateAccessKey = validateAccessKey;

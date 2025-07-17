"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRouteKey = void 0;
const hashingKeys_1 = require("../Utils/hashingKeys");
const secureKeys_1 = require("../config/secureKeys");
const checkRouteKey = (req, res, next) => {
    const route = req.baseUrl; // or req.originalUrl
    const key = req.headers['x-route-key'];
    const expectedHash = secureKeys_1.ROUTE_KEYS_HASH[route];
    if (!expectedHash ||
        !key ||
        typeof key !== 'string' ||
        !(0, hashingKeys_1.compareKey)(key, expectedHash)) {
        return res.status(403).json({ message: 'Invalid route key' });
    }
    next();
};
exports.checkRouteKey = checkRouteKey;

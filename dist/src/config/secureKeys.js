"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROUTE_KEYS_HASH = exports.MASTER_DB_KEY_HASH = void 0;
exports.MASTER_DB_KEY_HASH = process.env.MASTER_DB_KEY_HASH || '';
exports.ROUTE_KEYS_HASH = {
    '/api/v1/unit': process.env.UNIT_ROUTE_KEY_HASH || '',
    // Add more route-specific keys
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDBKey = void 0;
const secureKeys_1 = require("../config/secureKeys");
const hashingKeys_1 = require("../Utils/hashingKeys");
const checkDBKey = (req, res, next) => {
    const key = req.headers['x-db-key'];
    if (!key || typeof key !== 'string' || !(0, hashingKeys_1.compareKey)(key, secureKeys_1.MASTER_DB_KEY_HASH)) {
        return res.status(401).json({ message: 'Invalid or missing DB API key' });
    }
    next();
};
exports.checkDBKey = checkDBKey;

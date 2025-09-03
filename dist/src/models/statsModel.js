"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsModel = void 0;
const mongoose_1 = require("mongoose");
const statsSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scope: {
        // 'all', 'unit', 'rental', 'maintenance'
        type: String,
        required: true,
    },
    scopeID: { type: mongoose_1.Schema.Types.ObjectId, required: false, refPath: 'scopeRef' },
    scopeRef: { type: String, required: false },
    // Date range this stat covers (optional)
    from: { type: Date, required: false },
    to: { type: Date, required: false },
    // Precomputed values stored as a freeform object
    values: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    // Version or TTL can be added later
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });
exports.StatsModel = mongoose_1.models.Stats || (0, mongoose_1.model)('Stats', statsSchema);

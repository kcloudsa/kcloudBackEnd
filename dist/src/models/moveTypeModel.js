"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveTypeModel = void 0;
const mongoose_1 = require("mongoose");
const moveTypeSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: [true, 'Move type name is required'],
        lowercase: true,
        trim: true,
    },
    // Accept either ObjectId or string-based user ids (some auth systems use custom ids)
    userId: {
        type: mongoose_1.Schema.Types.Mixed,
        // keep the same validation message
        required: [true, 'UserID is Required'],
    },
}, {
    timestamps: true,
});
exports.MoveTypeModel = (0, mongoose_1.model)('MoveType', moveTypeSchema);

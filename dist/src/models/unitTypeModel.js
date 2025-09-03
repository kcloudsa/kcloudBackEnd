"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitTypeModel = void 0;
const mongoose_1 = require("mongoose");
const unitTypeSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'UserId is required'],
    },
}, {
    timestamps: true,
});
exports.UnitTypeModel = (0, mongoose_1.model)('UnitType', unitTypeSchema);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveTypeModel = void 0;
const mongoose_1 = require("mongoose");
const moveTypeSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Move type name is required'],
        enum: ['debit', 'credit'],
        // This ensures that the name can only be 'debit' or 'credit'
        // and is not case-sensitive.
        lowercase: true,
        trim: true,
        // unique: true,
    },
}, {
    timestamps: true,
});
exports.MoveTypeModel = (0, mongoose_1.model)('MoveType', moveTypeSchema);

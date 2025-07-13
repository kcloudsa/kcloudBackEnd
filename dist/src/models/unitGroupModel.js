"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitGroupModel = void 0;
const mongoose_1 = require("mongoose");
const unitGroupSchema = new mongoose_1.Schema({
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    name: {
        type: String,
        required: [true, 'Unit group name is required'],
        unique: true,
    },
    description: {
        type: String,
        default: '',
    },
    unitGroupStatus: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, {
    timestamps: true,
});
exports.UnitGroupModel = (0, mongoose_1.model)('UnitGroup', unitGroupSchema);

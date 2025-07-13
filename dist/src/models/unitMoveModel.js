"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitMoveModel = void 0;
const mongoose_1 = require("mongoose");
const unitMoveSchema = new mongoose_1.Schema({
    unitID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'unit id is required'],
        ref: 'Unit',
    },
    moveTypeID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'moveType is required'],
        ref: 'MoveType',
    },
    maintenanceID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false,
        ref: 'Maintenance',
    },
    rentalID: { type: mongoose_1.Schema.Types.ObjectId, required: false, ref: 'Rental' },
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'userID is required'],
        ref: 'User',
    },
    moveDate: { type: Date, required: true },
    writeDate: { type: Date, default: Date.now },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    description: { type: String, required: false },
}, {
    timestamps: true,
});
exports.UnitMoveModel = (0, mongoose_1.model)('UnitMove', unitMoveSchema);

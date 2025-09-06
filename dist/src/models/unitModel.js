"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitModel = exports.unitSchema = void 0;
const mongoose_1 = require("mongoose");
const locationSchema = new mongoose_1.Schema({
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    geo: {
        latitude: { type: Number, required: false },
        longitude: { type: Number, required: false },
    },
}, { _id: false });
const specialPriceSchema = new mongoose_1.Schema({
    type: { type: String, enum: ['weekly', 'once', 'monthly'], required: true },
    dayOfWeek: {
        type: String,
        enum: [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
        ],
    },
    date: { type: Date },
    price: { type: Number, min: 0, required: true },
}, { _id: true, timestamps: false });
exports.unitSchema = new mongoose_1.Schema({
    uniteGroupID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'UnitGroup',
    },
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    unitTypeID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'UnitType',
        required: true,
    },
    number: { type: String, required: true },
    description: { type: String, default: '' },
    notes: { type: String, default: '' },
    processingCost: { type: Number, required: true, default: 0 },
    location: locationSchema,
    baseUnit: { type: String, required: true, default: 'meter' }, // e.g., 'meter' for length
    unitMedia: [{ type: String }], // Array of media URLs or identifiers
    favorite: { type: Boolean, default: false },
    unitStatus: {
        type: String,
        enum: ['available', 'reserved', 'under_maintenance'],
        default: 'available',
    },
    specialPrices: { type: [specialPriceSchema], default: [] },
}, {
    timestamps: true,
});
exports.UnitModel = (0, mongoose_1.model)('Unit', exports.unitSchema);

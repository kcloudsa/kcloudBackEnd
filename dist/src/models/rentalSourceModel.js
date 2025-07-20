"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalSourceModel = void 0;
const mongoose_1 = require("mongoose");
const rentalSourceSchema = new mongoose_1.Schema({
    SourceName: {
        type: String,
        required: true,
        unique: true,
        enum: [
            'Booking',
            'Gather Inn',
            'Overnight stay',
            'Real estate',
            'Auction',
            'Airbnb',
            'Rent',
            'WhatsApp',
        ],
    },
    description: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});
exports.RentalSourceModel = (0, mongoose_1.model)('RentalSource', rentalSourceSchema);

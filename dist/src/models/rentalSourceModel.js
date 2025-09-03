"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalSourceModel = void 0;
// filepath: c:\Coding\KCloud\kcloudBackEnd\src\models\rentalSourceModel.ts
const mongoose_1 = require("mongoose");
const rentalSourceSchema = new mongoose_1.Schema({
    SourceName: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    // Accept either ObjectId or string-based user ids
    userId: {
        type: mongoose_1.Schema.Types.Mixed,
        required: [true, 'UserId is Required'],
    },
}, {
    timestamps: true,
});
// ensure uniqueness per user
rentalSourceSchema.index({ SourceName: 1, userId: 1 }, { unique: true });
exports.RentalSourceModel = (0, mongoose_1.model)('RentalSource', rentalSourceSchema);

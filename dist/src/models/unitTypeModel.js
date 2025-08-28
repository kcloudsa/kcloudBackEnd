"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitTypeModel = void 0;
const mongoose_1 = require("mongoose");
const unitTypeSchema = new mongoose_1.Schema({
    _id: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: () => new mongoose_1.Types.ObjectId(), // Auto-generate if not provided
    },
    type: {
        type: String,
        required: true,
        unique: true,
    },
}, {
    timestamps: true,
});
exports.UnitTypeModel = (0, mongoose_1.model)('UnitType', unitTypeSchema);
// Initialize default unit types
const initializeUnitTypes = async () => {
    try {
        const existingCount = await exports.UnitTypeModel.countDocuments();
        if (existingCount === 0) {
            const defaultTypes = [
                { _id: new mongoose_1.Types.ObjectId('000000000000000000000001'), type: 'room' },
                { _id: new mongoose_1.Types.ObjectId('000000000000000000000002'), type: 'apartment' },
                { _id: new mongoose_1.Types.ObjectId('000000000000000000000003'), type: 'studio' },
                { _id: new mongoose_1.Types.ObjectId('000000000000000000000004'), type: 'Restroom' },
                { _id: new mongoose_1.Types.ObjectId('000000000000000000000005'), type: 'Villa' },
                { _id: new mongoose_1.Types.ObjectId('000000000000000000000006'), type: 'farm' },
            ];
            await exports.UnitTypeModel.insertMany(defaultTypes);
            console.log('Default unit types initialized');
        }
    }
    catch (error) {
        console.error('Error initializing unit types:', error);
    }
};
// Call this function when your application starts
initializeUnitTypes();

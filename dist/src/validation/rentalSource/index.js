"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRentalSourceSchema = void 0;
const zod_1 = require("zod");
exports.createRentalSourceSchema = zod_1.z.object({
    SourceName: zod_1.z.string().min(1, { message: 'Rental SourceName is required' }),
    description: zod_1.z.string().optional(),
});

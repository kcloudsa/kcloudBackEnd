"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUintTypeSchema = void 0;
const zod_1 = require("zod");
exports.createUintTypeSchema = zod_1.z.object({
    type: zod_1.z.string().min(1, { message: 'Unit type is required' }),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMoveTypeSchema = void 0;
const zod_1 = require("zod");
exports.createMoveTypeSchema = zod_1.z.object({
    type: zod_1.z.string().min(1, { message: 'move type is required' }),
});

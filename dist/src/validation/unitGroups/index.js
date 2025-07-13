"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUintGroupsSchema = void 0;
const zod_1 = require("zod");
exports.createUintGroupsSchema = zod_1.z.object({
    userID: zod_1.z.string().min(1, { message: 'User ID is required' }),
    name: zod_1.z.string().min(1, { message: 'Unit group name is required' }),
    description: zod_1.z.string().optional(),
    unitGroupStatus: zod_1.z.enum(['active', 'inactive']).default('active'),
});

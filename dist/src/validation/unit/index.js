"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUintSchema = void 0;
const zod_1 = require("zod");
exports.createUintSchema = zod_1.z.object({
    uniteGroupID: zod_1.z.string().min(1, 'Unit group ID is required'),
    userID: zod_1.z.string().min(1, 'User ID is required'),
    unitTypeId: zod_1.z.string().min(1, 'Unit type ID is required'),
    number: zod_1.z.string().min(1, 'Unit number is required'),
    description: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    processingCost: zod_1.z
        .number()
        .min(0, 'Processing cost must be a non-negative number')
        .default(0),
    location: zod_1.z.object({
        address: zod_1.z.string().min(1, 'Address is required'),
        city: zod_1.z.string().min(1, 'City is required'),
        country: zod_1.z.string().min(1, 'Country is required'),
        geo: zod_1.z
            .object({
            latitude: zod_1.z.number().optional(),
            longitude: zod_1.z.number().optional(),
        })
            .optional(), // Optional, for geolocation
    }),
    baseUnit: zod_1.z.string().min(1, 'Base unit is required').default('meter'), // e.g., 'meter' for length
    unitMedia: zod_1.z.array(zod_1.z.string()).optional(), // Array of media URLs or identifiers
    favorite: zod_1.z.boolean().default(false),
    unitStatus: zod_1.z
        .enum(['available', 'reserved', 'under_maintenance'])
        .default('available'),
    createdAt: zod_1.z.date().default(new Date()),
    updatedAt: zod_1.z.date().default(new Date()),
});
// export const updateUnitSchema = createUintSchema.partial().extend({
//   unitId: z.string().min(1, 'Unit ID is required'),
// });
// export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
// export const getUnitByIdSchema = z.object({
//   unitId: z.string().min(1, 'Unit ID is required'),
// });
// export type GetUnitByIdInput = z.infer<typeof getUnitByIdSchema>;
// export const deleteUnitSchema = z.object({
//   unitId: z.string().min(1, 'Unit ID is required'),
// });
// export type DeleteUnitInput = z.infer<typeof deleteUnitSchema>;
// export const listUnitsSchema = z.object({
//   page: z.number().min(1).default(1),
//   limit: z.number().min(1).max(100).default(10),
// });
// export type ListUnitsInput = z.infer<typeof listUnitsSchema>;
// export const unitIdParamSchema = z.object({
//   unitId: z.string().min(1, 'Unit ID is required'),
// });
// export type UnitIdParamInput = z.infer<typeof unitIdParamSchema>;
// export const unitNameParamSchema = z.object({
//   unitName: z.string().min(1, 'Unit name is required'),
// });
// export type UnitNameParamInput = z.infer<typeof unitNameParamSchema>;
// export const unitLocationSchema = z.object({
//   latitude: z.number().optional(),
//   longitude: z.number().optional(),
// });
// export type UnitLocationInput = z.infer<typeof unitLocationSchema>;
// export const unitStatusSchema = z.object({
//   active: z.boolean().default(true),
// });
// export type UnitStatusInput = z.infer<typeof unitStatusSchema>;
// export const unitPaginationSchema = z.object({
//   page: z.number().min(1).default(1),
//   limit: z.number().min(1).max(100).default(10),
// });
// export type UnitPaginationInput = z.infer<typeof unitPaginationSchema>;
// export const unitSortSchema = z.object({
//   sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
//   sortOrder: z.enum(['asc', 'desc']).default('asc'),
// });
// export type UnitSortInput = z.infer<typeof unitSortSchema>;
// export const unitFilterSchema = z.object({
//   active: z.boolean().optional(),
//   location: z
//     .object({
//       latitude: z.number().optional(),
//       longitude: z.number().optional(),
//     })
//     .optional(),
// });
// export type UnitFilterInput = z.infer<typeof unitFilterSchema>;
// export const unitSearchSchema = z.object({
//   query: z.string().min(1, 'Search query is required'),
//   page: z.number().min(1).default(1),
//   limit: z.number().min(1).max(100).default(10),
// });
// export type UnitSearchInput = z.infer<typeof unitSearchSchema>;
// export const unitCreateSchema = z.object({
//   unitName: z.string().min(1, 'Unit name is required'),
//   description: z.string().optional(),
//   location: z
//     .object({
//       latitude: z.number().optional(),
//       longitude: z.number().optional(),
//     })
//     .optional(),
//   active: z.boolean().default(true),
// });
// export type UnitCreateInput = z.infer<typeof unitCreateSchema>;
// export const unitUpdateSchema = z.object({
//   unitId: z.string().min(1, 'Unit ID is required'),
//   unitName: z.string().min(1, 'Unit name is required').optional(),
//   description: z.string().optional(),
//   location: z
//     .object({
//       latitude: z.number().optional(),
//       longitude: z.number().optional(),
//     })
//     .optional(),
//   active: z.boolean().default(true).optional(),
// });
// export type UnitUpdateInput = z.infer<typeof unitUpdateSchema>;
// export const unitDeleteSchema = z.object({
//   unitId: z.string().min(1, 'Unit ID is required'),
// });
// export type UnitDeleteInput = z.infer<typeof unitDeleteSchema>;
// export const unitListSchema = z.object({
//   page: z.number().min(1).default(1),
//   limit: z.number().min(1).max(100).default(10),
// });
// export type UnitListInput = z.infer<typeof unitListSchema>;

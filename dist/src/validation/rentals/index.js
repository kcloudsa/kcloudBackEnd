"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRentalSchema = void 0;
const zod_1 = require("zod");
exports.createRentalSchema = zod_1.z
    .object({
    unitID: zod_1.z.string().min(1, 'Unit ID is required'),
    contractNumber: zod_1.z.string().min(1, 'Contract Number is required'),
    moveTypeID: zod_1.z.string().min(1, 'moveTypeID  is required'),
    rentalSourceID: zod_1.z.string().min(1, 'rentalSourceID  is required'),
    startDate: zod_1.z.coerce.date(),
    endDate: zod_1.z.coerce.date().optional(),
    startPrice: zod_1.z.number().min(0),
    currentPrice: zod_1.z.number().min(0).optional(),
    rentalAmount: zod_1.z.number().min(0),
    rentalStatus: zod_1.z.enum([
        'active',
        'completed',
        'cancelled',
        'scheduled',
        'confirmed',
        'checked_in',
        'terminated',
        'inactive',
        'pending',
        'on_hold',
    ]),
    securityDeposit: zod_1.z.number().min(0),
    isMonthly: zod_1.z.boolean().optional(),
    monthsCount: zod_1.z.number().min(0).optional(),
    roommates: zod_1.z.number().min(0).optional(),
    notes: zod_1.z.string().optional(),
    periodicIncrease: zod_1.z
        .object({
        increaseValue: zod_1.z.number(),
        periodicDuration: zod_1.z.number(),
        isPercentage: zod_1.z.boolean(),
    })
        .optional(),
    specialPrices: zod_1.z
        .array(zod_1.z.object({
        type: zod_1.z.enum(['weekly', 'once', 'monthly']),
        dayOfWeek: zod_1.z
            .enum([
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
        ])
            .optional(),
        date: zod_1.z.coerce.date().optional(),
        price: zod_1.z.number().min(0),
    }))
        .optional(),
    participats: zod_1.z.object({
        owner: zod_1.z.object({
            userID: zod_1.z.string(),
            role: zod_1.z.literal('owner').optional(),
        }),
        tentant: zod_1.z.object({
            userID: zod_1.z.string(),
            role: zod_1.z.literal('tentant').optional(),
        }),
    }),
    createdAt: zod_1.z.date().default(new Date()),
    updatedAt: zod_1.z.date().default(new Date()),
})
    .refine((data) => {
    // Case 1: If endDate exists, it must be after startDate
    if (data.endDate && data.endDate <= data.startDate) {
        return false;
    }
    // Case 2: If endDate is not given, must provide valid monthly info
    if (!data.endDate &&
        (!data.isMonthly || data.monthsCount === undefined)) {
        return false;
    }
    return true;
}, {
    message: 'Either provide a valid endDate after startDate, or set isMonthly with monthsCount > 0',
    path: ['endDate'], // Optional: could also use 'monthsCount' or general
});

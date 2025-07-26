"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRentalPriceOnDate = getRentalPriceOnDate;
function getRentalPriceOnDate(rental, date) {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const once = rental.specialPrices.find((sp) => sp.type === 'once' &&
        new Date(sp.date).toDateString() === date.toDateString());
    if (once)
        return once.price;
    const weekly = rental.specialPrices.find((sp) => sp.type === 'weekly' && sp.dayOfWeek === dayOfWeek);
    if (weekly)
        return weekly.price;
    return rental.basePrice;
}

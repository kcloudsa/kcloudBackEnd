"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTotalRentInPercentage = calculateTotalRentInPercentage;
exports.calcFixedIncreaseRent = calcFixedIncreaseRent;
function calculateTotalRentInPercentage(startAmount, increaseRatePercentage, years) {
    let total = 0;
    for (let year = 0; year < years; year++) {
        const yearlyAmount = startAmount * Math.pow(1 + increaseRatePercentage, year);
        total += yearlyAmount;
    }
    return parseFloat(total.toFixed(5));
}
function calcFixedIncreaseRent(startAmount, increaseAmount, years) {
    let total = 0;
    for (let i = 0; i < years; i++) {
        const yearlyRent = startAmount + increaseAmount * i;
        total += yearlyRent;
    }
    return total;
}

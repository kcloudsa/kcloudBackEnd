export function calculateTotalRentInPercentage(
  startAmount: number,
  increaseRatePercentage: number,
  years: number,
): number {
  let total = 0;
  for (let year = 0; year < years; year++) {
    const yearlyAmount =
      startAmount * Math.pow(1 + increaseRatePercentage, year);
    total += yearlyAmount;
  }
  return parseFloat(total.toFixed(5));
}
export function calcFixedIncreaseRent(
  startAmount: number,
  increaseAmount: number,
  years: number,
): number {
  let total = 0;
  for (let i = 0; i < years; i++) {
    const yearlyRent = startAmount + increaseAmount * i;
    total += yearlyRent;
  }
  return total;
}

export function getRentalPriceOnDate(rental: any, date: Date): number {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

  const once = rental.specialPrices.find(
    (sp: any) =>
      sp.type === 'once' &&
      new Date(sp.date).toDateString() === date.toDateString(),
  );

  if (once) return once.price;

  const weekly = rental.specialPrices.find(
    (sp: any) => sp.type === 'weekly' && sp.dayOfWeek === dayOfWeek,
  );

  if (weekly) return weekly.price;

  return rental.basePrice;
}

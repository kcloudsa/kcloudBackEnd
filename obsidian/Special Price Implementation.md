Thanks for the clear description! You're looking to implement **dynamic pricing** for rentals based on **specific days of the week**, with flexibility for one-time or recurring changes. Here's a well-structured and scalable way to implement this in your **Express (TypeScript) + MongoDB backend**, while keeping it easy to work with in your **React + Vite + Axios + TanStack Query frontend**.

---

## ✅ Backend (Express + TypeScript + MongoDB)

### 🔹 1. **MongoDB Rental Schema**

Extend your rental schema to support:

- `basePrice`
- `specialPrices` for certain weekdays or date ranges

```ts
import { Schema, model, Types } from 'mongoose';

const rentalSchema = new Schema({
  name: { type: String, required: true },
  basePrice: { type: Number, required: true },

  specialPrices: [
    {
      type: {
        type: String,
        enum: ['weekly', 'once', 'monthly'],
        required: true,
      },
      // For `weekly` type
      dayOfWeek: {
        type: String,
        enum: [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
      },

      // For `once` type
      date: Date,

      // Special price
      price: { type: Number, required: true },
    },
  ],
});

export const Rental = model('Rental', rentalSchema);
```

### 🔹 2. **Calculate Price on Specific Date (utility function)**

```ts
function getRentalPriceOnDate(rental: any, date: Date): number {
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
```

### 🔹 3. **Sample API Route**

```ts
app.get('/api/rentals/:id/price', async (req, res) => {
  const { id } = req.params;
  const { date } = req.query; // Expects ISO string

  const rental = await Rental.findById(id);
  if (!rental) return res.status(404).send('Rental not found');

  const selectedDate = new Date(date as string);
  const price = getRentalPriceOnDate(rental, selectedDate);

  res.json({ price });
});
```

---

## ✅ Frontend (React + Vite + Axios + TanStack)

### 🔹 1. **Axios Call**

```ts
import axios from 'axios';

export const getRentalPrice = async (id: string, date: string) => {
  const res = await axios.get(`/api/rentals/${id}/price`, { params: { date } });
  return res.data;
};
```

### 🔹 2. **TanStack Query Hook**

```ts
import { useQuery } from '@tanstack/react-query';

const useRentalPrice = (id: string, date: string) => {
  return useQuery({
    queryKey: ['rentalPrice', id, date],
    queryFn: () => getRentalPrice(id, date),
    enabled: !!id && !!date,
  });
};
```

---

## ✅ Example Usage

```tsx
const { data, isLoading } = useRentalPrice(
  rentalId,
  selectedDate.toISOString(),
);

return (
  <div>
    {isLoading ? 'Loading...' : `Price for selected date: $${data.price}`}
  </div>
);
```

---

## 🔧 Future Enhancements

- Add **date range pricing** (`startDate`, `endDate`)
- Admin dashboard to **set special prices**
- UI calendar that **highlights special price days**
- Add **time-based** pricing for hours or time slots

---

Would you like a full working sample (with MongoDB data + Express routes + React UI) to test this out, or a way to input these special prices from the dashboard (admin side)?

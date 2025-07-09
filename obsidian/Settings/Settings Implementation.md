Great! Below is a **step-by-step implementation** with **code blocks** for both backend and frontend using:

- **Backend**: Express, Mongoose, TypeScript
- **Frontend**: React, Axios, TanStack Query, TypeScript

---

## 🛠️ Backend Setup (Express + Mongoose)

### 1. **Mongoose Model (`models/Settings.ts`)**

```ts
import { Schema, model, Document } from 'mongoose';

export interface ISettings extends Document {
  userId: string;
  general: {
    currency: string;
    timezone: string;
    dateFormat: string;
    landingPage: string;
  };
  appearance: {
    language: string;
    theme: string;
    color: string;
    fontSize: string;
  };
  notifications: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
  dataManagement: {
    autoBackup: boolean;
  };
  branding: {
    logoUrl?: string;
    subdomain?: string;
  };
  legal: {
    termsAccepted: boolean;
    cookiePrefs: boolean;
  };
  dangerZone: {
    subscriptionStatus: string;
  };
}

const SettingsSchema = new Schema<ISettings>({
  userId: { type: String, required: true, unique: true },
  general: {
    currency: String,
    timezone: String,
    dateFormat: String,
    landingPage: String,
  },
  appearance: {
    language: String,
    theme: String,
    color: String,
    fontSize: String,
  },
  notifications: {
    email: Boolean,
    inApp: Boolean,
    sms: Boolean,
  },
  dataManagement: {
    autoBackup: Boolean,
  },
  branding: {
    logoUrl: String,
    subdomain: String,
  },
  legal: {
    termsAccepted: Boolean,
    cookiePrefs: Boolean,
  },
  dangerZone: {
    subscriptionStatus: String,
  },
});

export const Settings = model<ISettings>('Settings', SettingsSchema);
```

---

### 2. **Express Routes (`routes/settings.ts`)**

```ts
import express from 'express';
import { Settings } from '../models/Settings';

const router = express.Router();

// Get user settings
router.get('/:userId', async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.params.userId });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

// Update/create user settings
router.post('/:userId', async (req, res) => {
  try {
    const updated = await Settings.findOneAndUpdate(
      { userId: req.params.userId },
      req.body,
      { new: true, upsert: true },
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error saving settings' });
  }
});

export default router;
```

---

### 3. **Register the Route in `app.ts` or `index.ts`**

```ts
import express from 'express';
import mongoose from 'mongoose';
import settingsRoutes from './routes/settings';

const app = express();
app.use(express.json());
app.use('/api/settings', settingsRoutes);

mongoose.connect('mongodb://localhost:27017/your-db-name').then(() => {
  app.listen(3000, () => console.log('Server running on port 3000'));
});
```

---

## 💻 Frontend Setup (React + TanStack Query + Axios)

### 1. **Axios Setup (`lib/axios.ts`)**

```ts
import axios from 'axios';
export const api = axios.create({ baseURL: '/api' });
```

---

### 2. **TanStack Query Hooks (`hooks/useSettings.ts`)**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

export function useSettings(userId: string) {
  return useQuery({
    queryKey: ['settings', userId],
    queryFn: async () => (await api.get(`/settings/${userId}`)).data,
  });
}

export function useUpdateSettings(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) =>
      (await api.post(`/settings/${userId}`, data)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['settings', userId] }),
  });
}
```

---

### 3. **Settings Form Component (`components/SettingsForm.tsx`)**

```tsx
import { useSettings, useUpdateSettings } from '../hooks/useSettings';

export function SettingsForm({ userId }: { userId: string }) {
  const { data, isLoading } = useSettings(userId);
  const updateSettings = useUpdateSettings(userId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const dataObj = Object.fromEntries(formData.entries());
        updateSettings.mutate(dataObj);
      }}
    >
      <label>
        Currency:
        <select name="general.currency" defaultValue={data?.general?.currency}>
          <option value="USD">USD</option>
          <option value="EGP">EGP</option>
          <option value="SAR">SAR</option>
        </select>
      </label>

      {/* Add more fields for appearance, notifications, branding, etc. */}

      <button type="submit">Save Settings</button>
    </form>
  );
}
```

---

### ✅ Final Notes

- Make sure to secure the `/settings/:userId` route using authentication middleware (e.g., JWT).
- You can break each section (Appearance, Notifications, etc.) into sub-components.
- For validation, consider using a schema library like [Zod](https://zod.dev/) or [Yup](https://github.com/jquense/yup).

Let me know if you want the form split by tabs or sections like the Obsidian file structure.

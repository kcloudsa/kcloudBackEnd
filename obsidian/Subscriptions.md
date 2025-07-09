Great — for a **more advanced subscription system**, especially if you’re building something serious like SaaS, you’ll want to model:

---

### 🔁 Real-world Requirements You Should Support

1. ✅ Multiple plans with different pricing tiers and feature limits
2. 🕐 Monthly/yearly billing with auto-renewal
3. 🛠️ Feature flags per plan (dynamic)
4. 📅 Trial periods
5. ⏳ Grace periods & cancelation
6. 💳 Integration with Stripe or another billing system
7. 🔄 Plan upgrades/downgrades
8. 👥 Team-based subscriptions (if applicable)

---

### 🧠 Advanced Data Models (MongoDB + Mongoose)

#### 1. `plans` — Master plans table

```ts
// models/plan.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  interval: 'monthly' | 'yearly';
  price: number;
  paymobPriceId: string; // For Stripe billing sync
  features: {
    [key: string]: number | boolean | string;
  };
  description?: string;
  isActive: boolean;
}

const PlanSchema = new Schema<IPlan>({
  name: { type: String, required: true },
  interval: { type: String, enum: ['monthly', 'yearly'], required: true },
  price: { type: Number, required: true },
  paymobPriceId: { type: String, required: true },
  features: { type: Schema.Types.Mixed, required: true },
  description: String,
  isActive: { type: Boolean, default: true },
});

export default mongoose.model<IPlan>('Plan', PlanSchema);
```

---

#### 2. `subscriptions` — User plan instance

```ts
// models/subscription.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  stripeSubscriptionId?: string;
  status: 'active' | 'canceled' | 'trialing' | 'past_due';
  startedAt: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
  cancelAtPeriodEnd: boolean;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
  paymobSubscriptionId: String,
  status: {
    type: String,
    enum: ['active', 'canceled', 'trialing', 'past_due'],
    default: 'active',
  },
  startedAt: { type: Date, default: Date.now },
  currentPeriodEnd: { type: Date, required: true },
  trialEndsAt: Date,
  cancelAtPeriodEnd: { type: Boolean, default: false },
});

export default mongoose.model<ISubscription>(
  'Subscription',
  SubscriptionSchema,
);
```

---

#### 3. `users` — Reference subscription

```ts
// Extend user schema
subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
```

---

### 🔐 Feature Access Control (Advanced)

Build a feature-checking utility:

```ts
export const canAccessFeature = async (
  userId: string,
  featureKey: string,
): Promise<boolean> => {
  const user = await User.findById(userId).populate({
    path: 'subscriptionId',
    populate: {
      path: 'planId',
      model: 'Plan',
    },
  });

  const plan = user?.subscriptionId?.planId;
  if (!plan) return false;

  const features = plan.features;
  return (
    features[featureKey] === true || typeof features[featureKey] === 'number'
  );
};
```

Usage example:

```ts
if (await canAccessFeature(userId, 'customDomain')) {
  // allow custom domain setup
}
```

---

### ⚙️ Stripe Integration Strategy

You’ll need:

1. Stripe webhook handler (e.g. `invoice.paid`, `customer.subscription.updated`)
2. Link Stripe subscription events to your `subscriptions` collection
3. Store `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`

This ensures your app reflects billing status even if Stripe changes happen externally (e.g., failed payment, plan change).

---

### 💡 Optional Enhancements

| Feature                     | Description                                                            |
| --------------------------- | ---------------------------------------------------------------------- |
| `Usage tracking`            | Track how much of a resource a user consumed, e.g. file uploads        |
| `Plan history / audit logs` | Track upgrades/downgrades for analytics                                |
| `Coupon/promo support`      | Optional integration via Stripe                                        |
| `Custom feature toggles`    | Use something like LaunchDarkly or Unleash if you need real-time flags |
| `Admin panel to edit plans` | CMS-like UI for pricing management                                     |

---

Would you like a **starter seed project** (TypeScript, Express, Mongoose, Stripe, and this subscription model prebuilt)? I can scaffold that for you.

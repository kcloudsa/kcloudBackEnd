---
## 🕓 History Page
- [ ] Implement History view
- [ ] Display all recorded actions
- [ ] Only Admin role can see this page
- [ ] Only Admin can `Undo` any action
- [ ] ✅ Add an activity log per sub-admin inside the audit system

---

### ✅ Step-by-Step Guide to Implementing History with Undo in MongoDB

---

## 1. ✅ Create a `history` Collection

You’ll store all logs here with the full model like this:

```ts
// Mongoose Schema (TypeScript)
const historySchema = new mongoose.Schema({
  table: { type: String, required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'restore', 'login'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  performedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    role: String,
  },
  diff: { type: mongoose.Schema.Types.Mixed },
  reason: { type: String },
});
```

```ts
export const History = mongoose.model('History', historySchema);
```

---

## 2. 🔁 Create a Utility to Generate `diff`, `original`, `updated`

```ts
function generateDiff(oldData: any, newData: any) {
  const diff: Record<string, any> = {};
  for (const key in newData) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      diff[key] = {
        from: oldData[key],
        to: newData[key],
      };
    }
  }
  return diff;
}
```

---

## 3. 🔧 Usage in Update Route Example

```ts
import { History } from '@/models/history';
import Rental from '@/models/rental';

async function updateRental(req, res) {
  const { id } = req.query;
  const updates = req.body;
  const user = req.user; // from session/middleware

  const rental = await Rental.findById(id);
  if (!rental) return res.status(404).send('Not found');

  const oldData = rental.toObject();
  const newData = updatedRental.toObject();
  const diff = generateDiff(oldData, newData);

  await History.create({
    table: 'rentals',
    documentId: id,
    action: 'update',
    performedBy: {
      userId: user._id,
      name: user.name,
      role: user.role,
    },
    diff,
    reason: updates.reason || null,
  });

  res.status(200).json(updatedRental);
}
```

---

## 4. 🔙 Undo an Update

```ts
async function undoLastChange(collectionName: string, docId: string) {
  const lastLog = await History.findOne({
    collection: collectionName,
    documentId: docId,
  }).sort({ timestamp: -1 });

  if (!lastLog || !lastLog.original) {
    throw new Error('No change history to revert.');
  }

  const Model = mongoose.model(collectionName.slice(0, -1)); // crude way to get Model name
  await Model.findByIdAndUpdate(docId, lastLog.original);
}
```

---

### 🔐 Security Tips

- Restrict undo to super admins or the owner.
- Prevent manipulation of logs by making the `history` collection **append-only** (no update/delete allowed).
- Optionally use a pre-save Mongoose hook for critical models to **auto-log** changes.

---

### 📌 Summary

- `history` collection logs every change with full before/after and user context.
- `generateDiff()` ensures no data duplication.
- Undo is just a reverse of `original`.
- Works for any model (`collection` + `documentId`).

---

Would you like me to generate a complete reusable **MongoDB plugin or Mongoose middleware** to handle all this automatically?

To create a **utility function** that automatically records backend activity into your `HistoryModel`, you can build a reusable `recordHistory` function and optionally extend Mongoose middlewares (for example `save`, `update`, `delete`) or manually call it in services/controllers where needed.

---

### ✅ `utils/recordHistory.ts`

```ts
import { Types } from 'mongoose';
import HistoryModel, { IHistory } from '../models/history.model'; // adjust the path as needed

interface RecordHistoryOptions {
  table: string;
  documentId: Types.ObjectId;
  action: IHistory['action'];
  performedBy: {
    userId: Types.ObjectId;
    name?: string;
    role?: string;
  };
  diff?: Record<string, any>;
  reason?: string;
}

/**
 * Utility to record a history event
 */
export const recordHistory = async (
  options: RecordHistoryOptions,
): Promise<void> => {
  try {
    const history = new HistoryModel({
      table: options.table,
      documentId: options.documentId,
      action: options.action,
      performedBy: options.performedBy,
      diff: options.diff || undefined,
      reason: options.reason || undefined,
    });

    await history.save();
  } catch (error) {
    console.error('Failed to record history:', error);
  }
};
```

---

### ✅ Example Usage in a Service

```ts
import { recordHistory } from '../utils/recordHistory';
import SomeModel from '../models/some.model';

const updateItem = async (id: string, newData: any, user: any) => {
  const existingDoc = await SomeModel.findById(id);
  if (!existingDoc) throw new Error('Not found');

  const original = existingDoc.toObject();
  const updated = { ...original, ...newData };

  const diff: Record<string, any> = {};
  for (const key in newData) {
    if (original[key] !== newData[key]) {
      diff[key] = { from: original[key], to: newData[key] };
    }
  }

  await SomeModel.findByIdAndUpdate(id, newData);

  await recordHistory({
    table: 'SomeModel',
    documentId: existingDoc._id,
    action: 'update',
    performedBy: {
      userId: user._id,
      name: user.name,
      role: user.role,
    },
    diff,
    reason: 'User updated the item', // optional
  });
};
```

---

### ✅ Optional: Mongoose Plugin for Auto Hooking

If you want to **automate history recording**, you can create a plugin that hooks into `save`, `findOneAndUpdate`, etc. But this needs more control and isn't always reliable for diffing complex objects, so **manual usage in services is often clearer and safer.**

Would you like an automated Mongoose plugin version too?

```ts
interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue' | 'todo';
  assignedTo: User | null;
  property: Property;
  dueDate: string;
  createdAt: string;
  category:
    | 'maintenance'
    | 'inspection'
    | 'cleaning'
    | 'marketing'
    | 'administrative';
  isStarred?: boolean;
  isArchived?: boolean;
}
```

```ts
interface Property {
  id: string;
  address: string;
  type: string;
}
```

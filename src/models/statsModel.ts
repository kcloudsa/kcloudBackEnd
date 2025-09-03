import { Schema, model, models } from 'mongoose';

const statsSchema = new Schema(
  {
    userID: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scope: {
      // 'all', 'unit', 'rental', 'maintenance'
      type: String,
      required: true,
    },
    scopeID: { type: Schema.Types.ObjectId, required: false, refPath: 'scopeRef' },
    scopeRef: { type: String, required: false },
    // Date range this stat covers (optional)
    from: { type: Date, required: false },
    to: { type: Date, required: false },
    // Precomputed values stored as a freeform object
    values: { type: Schema.Types.Mixed, default: {} },
    // Version or TTL can be added later
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const StatsModel = models.Stats || model('Stats', statsSchema);

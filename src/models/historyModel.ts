import mongoose from 'mongoose';
import { IHistory } from '../interfaces/Ihistory';
const historySchema = new mongoose.Schema<IHistory>({
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
const HistoryModel = mongoose.model<IHistory>('History', historySchema);
export default HistoryModel;

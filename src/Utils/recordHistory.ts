import { Types } from 'mongoose';
import HistoryModel from '../models/historyModel'; // adjust the path as needed
import { IHistory } from '../interfaces/Ihistory'; // adjust the path as needed

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

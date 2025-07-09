import mongoose from 'mongoose';

export function getDeepDiff(
  original: Record<string, any>,
  updated: Record<string, any>,
  prefix = '',
): Record<string, { from: any; to: any }> {
  const diff: Record<string, { from: any; to: any }> = {};

  for (const key in updated) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const originalValue = original[key];
    const updatedValue = updated[key];

    const isObject = (val: any) =>
      typeof val === 'object' &&
      val !== null &&
      !Array.isArray(val) &&
      !(val instanceof Date) &&
      !(val instanceof mongoose.Types.ObjectId);

    if (isObject(updatedValue)) {
      const nestedDiff = getDeepDiff(
        originalValue || {},
        updatedValue,
        fullKey,
      );
      Object.assign(diff, nestedDiff);
    } else if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
      diff[fullKey] = { from: originalValue, to: updatedValue };
    }
  }

  return diff;
}
export function generateDiff(oldData: any, newData: any) {
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

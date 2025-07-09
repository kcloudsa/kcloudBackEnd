import mongoose from 'mongoose';

export function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>,
): Record<string, any> {
  const output: Record<string, any> = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    const isMergeableObject = (val: any) =>
      typeof val === 'object' &&
      val !== null &&
      !Array.isArray(val) &&
      !(val instanceof Date) &&
      !(val instanceof mongoose.Types.ObjectId);

    if (isMergeableObject(sourceValue) && isMergeableObject(targetValue)) {
      output[key] = deepMerge(targetValue, sourceValue);
    } else {
      output[key] = sourceValue;
    }
  }

  return output;
}

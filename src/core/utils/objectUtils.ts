/**
 * Recursively removes any keys with undefined values from an object or array.
 * This is necessary for Firestore as it does not support undefined values.
 *
 * @param obj The object or array to sanitize.
 * @returns A new object or array with all undefined values removed.
 */
export const sanitizeObject = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as T;
  }

  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    const sanitized = {} as T;
    Object.keys(obj).forEach(key => {
      if (obj[key as keyof T] !== undefined) {
        (sanitized as Record<string, unknown>)[key] = sanitizeObject(obj[key as keyof T]);
      }
    });
    return sanitized;
  }

  return obj;
};

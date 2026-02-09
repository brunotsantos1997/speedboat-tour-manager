/**
 * Recursively removes any keys with undefined values from an object or array.
 * This is necessary for Firestore as it does not support undefined values.
 *
 * @param obj The object or array to sanitize.
 * @returns A new object or array with all undefined values removed.
 */
export const sanitizeObject = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    const sanitized: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    });
    return sanitized;
  }

  return obj;
};

/**
 * Check if running in development mode
 * Safe check that works with TypeScript
 */
export function isDevMode() {
  try {
    return typeof import.meta !== 'undefined' && 
           import.meta.env && 
           (import.meta.env.DEV === true || import.meta.env.MODE === 'development');
  } catch {
    return false;
  }
}
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isPlausibleEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

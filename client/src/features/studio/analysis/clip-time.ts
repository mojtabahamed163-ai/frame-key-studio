export function formatEditableTime(seconds: number): string {
  const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return value.toFixed(2);
}

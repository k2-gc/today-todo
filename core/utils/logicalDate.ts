/**
 * Calculates a logical date string (YYYY-MM-DD) based on 04:00 AM start of the day.
 * If the current time is before 4 AM, it considers the previous day as the logical date.
 */

export function computeLogicalDate(currentTime: Date = new Date()): string {
  const hour = currentTime.getHours();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  // If the current time is before 4 AM, consider the previous day as the logical date
  const base = hour < 4 ? new Date(currentTime.getTime() - ONE_DAY_MS) : currentTime;

  return formatYYYYMMDD(base);
}

function formatYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

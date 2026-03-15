const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateKey(input: Date) {
  return input.toISOString().slice(0, 10);
}

export function fromDateKey(key: string) {
  return new Date(`${key}T12:00:00`);
}

export function shiftDateKey(key: string, offset: number) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
}

export function getWeekKeys(centerKey: string) {
  const center = fromDateKey(centerKey);
  const day = center.getDay();
  const start = new Date(center.getTime() - day * DAY_MS);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start.getTime() + index * DAY_MS);
    return toDateKey(current);
  });
}

export function formatDateLabel(key: string) {
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDateLabel(key: string) {
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatCompactDateLabel(key: string) {
  return fromDateKey(key).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getTodayKey() {
  return toDateKey(new Date());
}

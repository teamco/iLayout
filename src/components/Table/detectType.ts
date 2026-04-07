import dayjs from 'dayjs';

function isLikelyDateString(s: string): boolean {
  const trimmed = s?.trim();
  if (!trimmed) return false;
  if (!/[T:/-]/.test(trimmed)) return false;
  const parsed = dayjs(trimmed);
  return parsed.isValid?.() ?? false;
}

export function detectType(value: unknown): string {
  if (value === null || value === undefined) return 'object';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';

  if (typeof value === 'string') {
    if (isLikelyDateString(value)) return 'date';
    if (!isNaN(Number(value)) && value !== '') return 'number';
    return 'string';
  }

  if (typeof value === 'number') return 'number';

  if ((value as Record<string, unknown>)?.isValid && typeof (value as Record<string, unknown>).isValid === 'function') {
    try {
      if ((value as { isValid: () => boolean }).isValid()) return 'date';
    } catch { /* ignore */ }
  }

  return 'object';
}

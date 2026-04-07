import dayjs from 'dayjs';

export function exportJson(data: unknown, prefix = 'export') {
  const json = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${prefix}-${dayjs().format('YYYY-MM-DD')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

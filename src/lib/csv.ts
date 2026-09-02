/** RFC 4180 CSV serialization with a UTF-8 BOM so Excel opens Vietnamese text correctly. */

export function csvEscape(cell: string): string {
  if (/[",\r\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export function toCsv(headers: string[], rows: string[][], bom = true): string {
  const lines = [headers.map(csvEscape).join(','), ...rows.map((row) => row.map(csvEscape).join(','))];
  const body = `${lines.join('\r\n')}\r\n`;
  return bom ? `\u{FEFF}${body}` : body;
}

/** Flatten any answer value into a single display cell. */
export function answerToCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(' | ');
  return String(value);
}

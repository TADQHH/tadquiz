import type { APIRoute } from 'astro';
import { getAdminSession, apiError } from '../../../../lib/http';
import { getForm } from '../../../../db/forms.mjs';
import { listResponses } from '../../../../db/responses.mjs';
import { answerToCell } from '../../../../lib/csv.ts';

type ExcelSheet = {
  addRow: (cells: unknown[]) => unknown;
  getRow: (n: number) => { font: unknown; fill: unknown; alignment: unknown; height: number };
  getColumn: (n: number) => { width: number };
};

type ExcelWorkbook = {
  addWorksheet: (name: string, opts?: { views?: unknown[] }) => ExcelSheet;
  xlsx: { writeBuffer: () => Promise<ArrayBuffer> };
};

export const GET: APIRoute = async (context) => {
  if (!getAdminSession(context)) return apiError('Chưa đăng nhập.', 401);
  const id = Number.parseInt(String(context.params.id ?? ''), 10);
  if (!Number.isInteger(id) || id <= 0) return apiError('ID không hợp lệ.', 400);

  const form = getForm(id);
  if (!form) return apiError('Không tìm thấy form.', 404);

  const rows = listResponses(id);
  const headers = ['ID', 'Thời gian gửi', ...form.questions.map((q) => q.label)];
  const body = rows.map((row) => [
    String(row.id),
    row.submittedAt,
    ...form.questions.map((q) => answerToCell(row.answers[String(q.id)])),
  ]);

  // Bundle Vite có thể đổi hình dạng export của exceljs (CJS interop).
  const exceljs = (await import('exceljs')) as unknown as {
    Workbook?: new () => ExcelWorkbook;
    default?: { Workbook: new () => ExcelWorkbook };
  };
  const WorkbookClass = exceljs.Workbook ?? exceljs.default?.Workbook;
  if (!WorkbookClass) return apiError('Không tải được module xuất Excel.', 500);
  const workbook = new WorkbookClass();
  const sheet = workbook.addWorksheet('Phản hồi', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.addRow(headers);
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FF141414' }, size: 11 };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F1EC' } };
  header.alignment = { vertical: 'middle', wrapText: true };
  sheet.getRow(1).height = 28;

  for (const row of body) sheet.addRow(row);

  // Độ rộng cột theo nội dung dài nhất (giới hạn để không vỡ sheet).
  headers.forEach((title, col) => {
    let max = title.length;
    for (const row of body) max = Math.max(max, String(row[col] ?? '').length);
    sheet.getColumn(col + 1).width = Math.min(Math.max(max + 2, 10), 46);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `tadquiz-${form.slug}-responses.xlsx`;
  return new Response(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
};

import type { Question, ResponseRow } from '../../lib/types';
import { formatViDate } from '../format-date/format-date';

function cell(row: ResponseRow, question: Question) {
  const val = row.answers[String(question.id)] ?? row.answers[question.id as unknown as string];
  if (val == null || val === '') return '';
  return Array.isArray(val) ? val.join(' | ') : String(val);
}

export default function SheetView({ questions, rows }: { questions: Question[]; rows: ResponseRow[] }) {
  return (
    <div className="max-h-[70vh] overflow-auto border border-[var(--border)]">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-[var(--tad-paper)]">
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 bg-[var(--card)] px-3 py-2 font-headline text-xs font-bold uppercase"
            >
              STT
            </th>
            <th scope="col" className="px-3 py-2 font-headline text-xs font-bold uppercase">
              ID
            </th>
            <th scope="col" className="px-3 py-2 font-headline text-xs font-bold uppercase">
              Thời gian
            </th>
            {questions.map((question) => (
              <th
                key={question.id}
                scope="col"
                className="max-w-[16rem] px-3 py-2 font-headline text-xs font-bold uppercase"
                title={question.label}
              >
                <span className="line-clamp-2">{question.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              className={`${
                i % 2 === 1 ? 'bg-[color-mix(in_srgb,var(--muted)_40%,var(--card))]' : ''
              } hover:bg-[color-mix(in_srgb,var(--tad-red)_5%,var(--card))]`}
            >
              <td className="sticky left-0 z-20 bg-[var(--card)] px-3 py-2 font-mono text-xs">
                {i + 1}
                <span className="ml-1 text-[var(--tad-red)]">#{row.id}</span>
              </td>
              <td className="max-w-[16rem] truncate whitespace-nowrap px-3 py-2 font-mono text-xs text-[var(--tad-red)]" title={`#${row.id}`}>
                #{row.id}
              </td>
              <td className="max-w-[16rem] truncate whitespace-nowrap px-3 py-2 text-xs" title={formatViDate(row.submittedAt)}>
                {formatViDate(row.submittedAt)}
              </td>
              {questions.map((question) => {
                const text = cell(row, question);
                return (
                  <td
                    key={question.id}
                    className="max-w-[16rem] px-3 py-2 align-top"
                    title={text.length > 120 ? text : undefined}
                  >
                    <span className="line-clamp-3 whitespace-pre-wrap break-words text-xs">
                      {text}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

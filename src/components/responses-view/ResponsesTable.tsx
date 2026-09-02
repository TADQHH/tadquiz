import type { Question } from '../../lib/types';
import { formatViDate } from '../format-date/format-date';
import { IconEye } from '../icons/Icons';
import type { ResponseRow } from './ResponseDetailModal';

type Props = {
  rows: ResponseRow[];
  questions: Question[];
  onSelect: (index: number) => void;
};

export default function ResponsesTable({ rows, questions, onSelect }: Props) {
  return (
    <div className="hidden overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] md:block">
      <table className="resp-table w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--tad-paper)]">
            <th scope="col" className="w-16 px-4 py-3 font-mono text-xs font-bold uppercase">
              ID
            </th>
            <th scope="col" className="w-40 px-4 py-3 font-headline text-xs font-bold uppercase">
              Thời gian
            </th>
            {questions.map((q) => (
              <th
                key={q.id}
                scope="col"
                className="max-w-[14rem] px-4 py-3 font-headline text-xs font-bold uppercase"
              >
                <span className="line-clamp-1" title={q.label}>
                  {q.label}
                </span>
              </th>
            ))}
            <th
              scope="col"
              className="w-28 px-4 py-3 text-right font-headline text-xs font-bold uppercase"
            >
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              className="cursor-pointer transition-colors hover:bg-[color-mix(in_srgb,var(--tad-red)_5%,var(--card))]"
              onClick={() => onSelect(idx)}
            >
              <td className="px-4 py-3 font-mono text-xs font-bold text-[var(--tad-red)]">
                #{row.id}
              </td>
              <td className="px-4 py-3 text-xs whitespace-nowrap text-[var(--muted-foreground)]">
                {formatViDate(row.submittedAt)}
              </td>
              {questions.map((q) => {
                const val = row.answers[String(q.id)] ?? row.answers[q.id];
                const text = Array.isArray(val) ? val.join(' | ') : val != null ? String(val) : '';
                return (
                  <td key={q.id} className="max-w-[14rem] px-4 py-3 text-xs">
                    {text ? (
                      <span className="line-clamp-1 font-medium text-[var(--tad-ink)]" title={text}>
                        {text}
                      </span>
                    ) : (
                      <span className="text-xs italic text-[var(--muted-foreground)]">—</span>
                    )}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  className="btn-ghost inline-flex min-h-8 items-center gap-1.5 px-2.5 py-1 text-xs font-bold hover:text-[var(--tad-red)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(idx);
                  }}
                  title="Xem chi tiết câu trả lời"
                >
                  <IconEye className="h-3.5 w-3.5" />
                  <span>Chi tiết</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

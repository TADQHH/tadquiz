import type { Question } from '../../lib/types';
import { formatViDate } from '../format-date/format-date';
import { IconEye } from '../icons/Icons';
import type { ResponseRow } from './ResponseDetailModal';

type Props = {
  rows: ResponseRow[];
  questions: Question[];
  onSelect: (index: number) => void;
};

export default function ResponsesCards({ rows, questions, onSelect }: Props) {
  return (
    <div className="space-y-3 md:hidden">
      {rows.map((row, idx) => {
        const answeredCount = Object.keys(row.answers).filter(
          (k) => row.answers[k] != null && row.answers[k] !== '',
        ).length;

        return (
          <article
            key={row.id}
            className="brutalist-card rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-[var(--tad-red)]">
                  #{row.id}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatViDate(row.submittedAt)}
                </span>
              </div>
              <span className="rounded bg-[var(--muted)] px-2 py-0.5 font-headline text-[10px] font-extrabold uppercase">
                {answeredCount}/{questions.length} câu
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {questions.slice(0, 2).map((q) => {
                const ans = row.answers[String(q.id)] ?? row.answers[q.id];
                const text = Array.isArray(ans) ? ans.join(', ') : ans != null ? String(ans) : '—';
                return (
                  <div key={q.id} className="text-xs">
                    <span className="font-bold text-[var(--muted-foreground)] line-clamp-1">
                      {q.label}:
                    </span>
                    <p className="mt-0.5 font-medium text-[var(--tad-ink)] line-clamp-2">
                      {text}
                    </p>
                  </div>
                );
              })}
              {questions.length > 2 ? (
                <p className="text-[11px] italic text-[var(--muted-foreground)]">
                  + {questions.length - 2} câu hỏi khác
                </p>
              ) : null}
            </div>

            <button
              type="button"
              className="btn-primary mt-3 flex min-h-11 w-full items-center justify-center gap-2 text-xs font-bold"
              onClick={() => onSelect(idx)}
            >
              <IconEye className="h-4 w-4" />
              Xem chi tiết phản hồi
            </button>
          </article>
        );
      })}
    </div>
  );
}

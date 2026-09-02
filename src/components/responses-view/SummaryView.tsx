import type { Question, ResponseRow } from '../../lib/types';
import { TYPE_LABELS } from '../type-labels/type-labels';
import { summarize, type QuestionSummary } from './summary-model';

function Bars({
  item,
  color,
}: {
  item: Extract<QuestionSummary, { kind: 'choice' | 'rating' }>;
  color: string;
}) {
  return (
    <div className="mt-4 space-y-3">
      {item.rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-medium" title={row.label}>
              {row.label}
            </span>
            <span className="shrink-0 font-mono text-xs text-[var(--muted-foreground)]">
              {row.count} · {row.pct}%
            </span>
          </div>
          <div className="mt-1 h-2 bg-[var(--muted)]">
            <div className="h-2" style={{ width: `${row.pct}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Texts({ answers }: { answers: string[] }) {
  const shown = answers.slice(0, 20);
  const rest = answers.length - shown.length;
  return (
    <div>
      {shown.map((text, i) => (
        <div
          key={`${i}-${text.slice(0, 12)}`}
          className="mt-2 break-words rounded-[var(--radius)] bg-[var(--muted)] p-3 text-sm"
        >
          {text}
        </div>
      ))}
      {rest > 0 ? (
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">và {rest} câu khác</p>
      ) : null}
    </div>
  );
}

export default function SummaryView({ questions, rows }: { questions: Question[]; rows: ResponseRow[] }) {
  const items = summarize(questions, rows);
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <article
          key={item.question.id}
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-headline text-xs font-extrabold tracking-wider text-[var(--tad-red)] uppercase">
              Câu {i + 1}
            </span>
            <span className="eyebrow">{TYPE_LABELS[item.question.type]}</span>
            <span className="font-mono text-xs text-[var(--muted-foreground)]">
              {item.answered} câu trả lời
            </span>
            {item.kind === 'rating' && item.average != null ? (
              <span className="rounded bg-[var(--muted)] px-2 py-0.5 font-headline text-[10px] font-extrabold uppercase">
                Trung bình: {item.average}/5
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 font-headline text-lg font-extrabold break-words">{item.question.label}</h3>
          {item.kind === 'choice' ? <Bars item={item} color="var(--tad-red)" /> : null}
          {item.kind === 'rating' ? <Bars item={item} color="var(--tad-ink)" /> : null}
          {item.kind === 'text' ? <Texts answers={item.answers} /> : null}
        </article>
      ))}
    </div>
  );
}

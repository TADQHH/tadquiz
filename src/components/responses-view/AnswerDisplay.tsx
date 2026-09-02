import type { Question } from '../../lib/types';
import { IconCheck } from '../icons/Icons';

export default function AnswerDisplay({
  type,
  value,
}: {
  type: Question['type'];
  value: unknown;
}) {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-xs italic text-[var(--muted-foreground)]">Chưa trả lời</span>;
  }

  if (type === 'rating' && typeof value === 'number') {
    return (
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`inline-flex h-7 w-7 items-center justify-center rounded font-headline text-xs font-extrabold ${
              star <= value
                ? 'bg-[var(--tad-red)] text-white'
                : 'border border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]'
            }`}
          >
            {star}
          </span>
        ))}
        <span className="ml-2 font-headline text-xs font-bold">({value}/5 điểm)</span>
      </div>
    );
  }

  if (type === 'multi_choice' && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded bg-[color-mix(in_srgb,var(--tad-red)_12%,var(--card))] px-2.5 py-1 font-headline text-xs font-bold text-[var(--tad-red-deep)]"
          >
            <IconCheck className="h-3 w-3" />
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  if (type === 'single_choice') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-[color-mix(in_srgb,var(--tad-red)_12%,var(--card))] px-2.5 py-1 font-headline text-xs font-bold text-[var(--tad-red-deep)]">
        <IconCheck className="h-3 w-3" />
        {String(value)}
      </span>
    );
  }

  return (
    <div className="whitespace-pre-wrap rounded border border-[var(--border)] bg-[var(--tad-paper)] p-3 text-xs leading-relaxed text-[var(--tad-ink)]">
      {String(value)}
    </div>
  );
}

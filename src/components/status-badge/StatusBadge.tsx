import type { FormStatus } from '../../lib/types';

const LABELS: Record<FormStatus, string> = {
  published: 'Đang mở',
  draft: 'Nháp',
  closed: 'Đã đóng',
};

const CLASS: Record<FormStatus, { bg: string; dot: string }> = {
  published: {
    bg: 'bg-[color-mix(in_srgb,var(--tad-red)_12%,var(--card))] text-[var(--tad-red-deep)] border border-[var(--tad-red)]',
    dot: 'bg-[var(--tad-red)]',
  },
  draft: {
    bg: 'bg-[var(--muted)] text-[var(--tad-ink)] border border-[var(--border)]',
    dot: 'bg-[var(--muted-foreground)]',
  },
  closed: {
    bg: 'bg-[var(--tad-black)] text-white border border-[var(--tad-black)]',
    dot: 'bg-[#ff6b6b]',
  },
};

export default function StatusBadge({ status }: { status: FormStatus }) {
  const style = CLASS[status] ?? CLASS.draft;
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 py-0.5 font-headline text-[11px] font-extrabold uppercase tracking-wide ${style.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      <span>{LABELS[status]}</span>
    </span>
  );
}

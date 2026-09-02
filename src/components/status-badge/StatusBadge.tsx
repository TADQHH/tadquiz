import type { FormStatus } from '../../lib/types';

const LABELS: Record<FormStatus, string> = {
  published: 'Đang mở',
  draft: 'Nháp',
  closed: 'Đã đóng',
};

const CLASS: Record<FormStatus, string> = {
  published: 'bg-[var(--tad-red)] text-white',
  draft: 'bg-[var(--muted)] text-[var(--tad-ink)]',
  closed: 'bg-[var(--tad-black)] text-white',
};

export default function StatusBadge({ status }: { status: FormStatus }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center px-2.5 font-headline text-xs font-extrabold uppercase tracking-wide ${CLASS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}

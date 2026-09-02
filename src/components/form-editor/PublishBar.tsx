import type { FormStatus } from '../../lib/types';
import { statusAction } from './editor-model';

type Props = {
  status: FormStatus;
  slug: string;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onStatus: () => void;
  onDelete: () => void;
};

export default function PublishBar({
  status,
  slug,
  dirty,
  saving,
  onSave,
  onStatus,
  onDelete,
}: Props) {
  const action = statusAction(status);
  const preview = status === 'published';
  return (
    <div className="mt-6 space-y-3 border-t border-[var(--border)] pt-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="btn-ghost min-h-11 border border-[var(--border)] text-xs font-bold hover:border-[var(--tad-ink)] disabled:opacity-40"
          disabled={!dirty || saving}
          onClick={onSave}
        >
          {saving ? 'Đang lưu…' : dirty ? 'Lưu thay đổi' : 'Đã lưu'}
        </button>
        <button
          type="button"
          className="btn-primary min-h-11 text-xs font-bold"
          disabled={saving}
          onClick={onStatus}
        >
          {action.label}
        </button>
      </div>
      <a
        href={`/q/${slug}`}
        target="_blank"
        rel="noreferrer"
        className={`btn-ghost flex min-h-10 items-center justify-center gap-1.5 border border-[var(--border)] text-xs font-bold ${
          preview ? 'hover:border-[var(--tad-ink)]' : 'pointer-events-none opacity-40'
        }`}
        aria-disabled={!preview}
        tabIndex={preview ? 0 : -1}
      >
        <span>Xem trước khảo sát</span>
        <span>↗</span>
      </a>
      <button
        type="button"
        className="inline-flex min-h-9 w-full items-center justify-center text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--tad-red)]"
        onClick={onDelete}
      >
        Xóa form này
      </button>
    </div>
  );
}

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
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" disabled={!dirty || saving} onClick={onSave}>
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
        <button type="button" className="btn-primary" disabled={saving} onClick={onStatus}>
          {action.label}
        </button>
      </div>
      <a
        href={`/q/${slug}`}
        target="_blank"
        rel="noreferrer"
        className={`btn-ghost ${preview ? '' : 'pointer-events-none opacity-40'}`}
        aria-disabled={!preview}
        tabIndex={preview ? 0 : -1}
      >
        Xem trước ↗
      </a>
      <button type="button" className="btn-ghost w-full" onClick={onDelete}>
        Xóa form
      </button>
    </div>
  );
}

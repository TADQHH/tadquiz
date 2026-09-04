import type { FormStatus } from '../../lib/types';
import SlugField from '../slug-field/SlugField';
import StatusBadge from '../status-badge/StatusBadge';
import PublishBar from './PublishBar';

type Props = {
  title: string;
  slug: string;
  description: string;
  completionUrl: string;
  responseLimit: string;
  responseCount: number;
  status: FormStatus;
  slugError?: string;
  dirty: boolean;
  saving: boolean;
  onTitle: (value: string) => void;
  onSlug: (value: string) => void;
  onDescription: (value: string) => void;
  onCompletionUrl: (value: string) => void;
  onResponseLimit: (value: string) => void;
  onSave: () => void;
  onStatus: () => void;
  onDelete: () => void;
};

export default function MetaPanel(props: Props) {
  return (
    <aside className="space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">Form</p>
        <StatusBadge status={props.status} />
      </div>
      <label className="block">
        <span className="mb-2 block font-headline text-xs font-extrabold uppercase tracking-[0.14em]">
          Tiêu đề
        </span>
        <input className="input-box" value={props.title} onChange={(e) => props.onTitle(e.target.value)} />
      </label>
      <SlugField value={props.slug} error={props.slugError} onChange={props.onSlug} />
      <label className="block">
        <span className="mb-2 block font-headline text-xs font-extrabold uppercase tracking-[0.14em]">
          Mô tả
        </span>
        <textarea
          className="input-box min-h-28 py-3"
          rows={4}
          value={props.description}
          onChange={(e) => props.onDescription(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-2 block font-headline text-xs font-extrabold uppercase tracking-[0.14em]">
          Link khi hoàn tất
        </span>
        <input
          className="input-box"
          type="url"
          inputMode="url"
          placeholder="https://… (bỏ trống nếu không dùng)"
          value={props.completionUrl}
          onChange={(e) => props.onCompletionUrl(e.target.value)}
        />
        <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
          Người trả lời xong sẽ thấy nút mở link này (tab mới).
        </span>
      </label>
      <label className="block">
        <span className="mb-2 block font-headline text-xs font-extrabold uppercase tracking-[0.14em]">
          Giới hạn phản hồi
        </span>
        <input
          className="input-box"
          type="number"
          min={1}
          max={1000000}
          inputMode="numeric"
          placeholder="Bỏ trống = không giới hạn"
          value={props.responseLimit}
          onChange={(e) => props.onResponseLimit(e.target.value)}
        />
        <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
          Form tự ngừng nhận phản hồi khi đủ số lượt. {props.responseCount} đã nhận.
        </span>
      </label>
      <PublishBar
        status={props.status}
        slug={props.slug}
        dirty={props.dirty}
        saving={props.saving}
        onSave={props.onSave}
        onStatus={props.onStatus}
        onDelete={props.onDelete}
      />
    </aside>
  );
}

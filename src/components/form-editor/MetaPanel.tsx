import type { FormStatus } from '../../lib/types';
import SlugField from '../slug-field/SlugField';
import StatusBadge from '../status-badge/StatusBadge';
import PublishBar from './PublishBar';

type Props = {
  title: string;
  slug: string;
  description: string;
  status: FormStatus;
  slugError?: string;
  dirty: boolean;
  saving: boolean;
  onTitle: (value: string) => void;
  onSlug: (value: string) => void;
  onDescription: (value: string) => void;
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

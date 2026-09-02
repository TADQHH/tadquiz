import { useState } from 'react';
import type { FormSummary } from '../../lib/types';
import { formatViDate } from '../format-date/format-date';
import { IconCopy } from '../icons/Icons';
import StatusBadge from '../status-badge/StatusBadge';

type Props = {
  form: FormSummary;
  onDelete: () => void;
};

export default function FormCard({ form, onDelete }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${location.origin}/q/${form.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="brutalist-card rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-5">
      <StatusBadge status={form.status} />
      <h2 className="mt-3 font-headline text-xl font-extrabold">{form.title}</h2>
      <p className="mt-2 font-mono text-xs text-[var(--muted-foreground)]">/q/{form.slug}</p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {form.responseCount} phản hồi · {formatViDate(form.updatedAt)}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={`/admin/f/${form.id}`} className="btn-ghost text-sm">
          Chỉnh sửa
        </a>
        <a href={`/admin/f/${form.id}/responses`} className="btn-ghost text-sm">
          Phản hồi ({form.responseCount})
        </a>
        <button
          type="button"
          className="btn-ghost text-sm"
          aria-pressed={copied}
          onClick={() => void copy()}
        >
          <IconCopy className="mr-2 h-4 w-4" />
          {copied ? 'Đã sao chép' : 'Sao chép link'}
        </button>
        <button type="button" className="btn-ghost text-sm" onClick={onDelete}>
          Xóa
        </button>
      </div>
    </article>
  );
}

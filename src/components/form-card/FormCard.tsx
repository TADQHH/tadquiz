import { useState } from 'react';
import type { FormSummary } from '../../lib/types';
import { copyText } from '../../lib/clipboard';
import { formatViDate } from '../format-date/format-date';
import { IconCopy } from '../icons/Icons';
import StatusBadge from '../status-badge/StatusBadge';

type Props = {
  form: FormSummary;
  onDelete: () => void;
};

export default function FormCard({ form, onDelete }: Props) {
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null);
  const [cloning, setCloning] = useState(false);

  async function copy() {
    const url = `${location.origin}/q/${form.slug}`;
    const ok = await copyText(url);
    setCopied(ok ? 'ok' : 'fail');
    window.setTimeout(() => setCopied(null), 1600);
  }

  async function clone() {
    setCloning(true);
    try {
      const res = await fetch(`/api/forms/${form.id}/clone`, { method: 'POST' });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? 'lỗi');
      location.href = `/admin/f/${data.id}`;
    } catch {
      setCloning(false);
      alert('Không nhân bản được form — thử lại.');
    }
  }


  return (
    <article className="brutalist-card flex flex-col justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={form.status} />
          <span className="text-[11px] text-[var(--muted-foreground)]">
            {formatViDate(form.updatedAt)}
          </span>
        </div>
        <h2 className="mt-3 font-headline text-lg font-extrabold text-[var(--tad-ink)] line-clamp-2 md:text-xl">
          {form.title}
        </h2>
        <div className="mt-2 flex items-center justify-between rounded border border-[var(--border)] bg-[var(--tad-paper)] px-2.5 py-1.5 font-mono text-xs">
          <span className="truncate text-[var(--muted-foreground)]">/q/{form.slug}</span>
          <button
            type="button"
            className="ml-2 inline-flex shrink-0 items-center gap-1 font-headline text-[10px] font-bold text-[var(--tad-red)] hover:underline"
            onClick={() => void copy()}
            title="Sao chép link khảo sát"
          >
            <IconCopy className="h-3 w-3" />
            {copied === 'ok' ? 'Đã chép' : copied === 'fail' ? 'Lỗi — chép tay' : 'Chép'}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <span className="font-headline font-bold text-[var(--tad-ink)]">
            {form.responseCount}
          </span>{' '}
          phản hồi đã nhận
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-4">
        <a
          href={`/admin/f/${form.id}`}
          className="btn-primary flex min-h-10 items-center justify-center text-center text-xs font-bold"
        >
          Chỉnh sửa
        </a>
        <a
          href={`/admin/f/${form.id}/responses`}
          className="btn-ghost flex min-h-10 items-center justify-center border border-[var(--border)] text-center text-xs font-bold hover:border-[var(--tad-ink)]"
        >
          Phản hồi ({form.responseCount}
          {form.responseLimit != null ? `/${form.responseLimit}` : ''})
        </a>
        <button
          type="button"
          className="btn-ghost col-span-2 flex min-h-9 items-center justify-center border border-[var(--border)] text-center text-xs font-bold hover:border-[var(--tad-red)]"
          onClick={() => void clone()}
          disabled={cloning}
        >
          {cloning ? 'Đang nhân bản…' : 'Nhân bản thành bản sao'}
        </button>
        <button
          type="button"
          className="col-span-2 inline-flex min-h-9 items-center justify-center text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--tad-red)]"
          onClick={onDelete}
        >
          Xóa khảo sát này
        </button>
      </div>
    </article>
  );
}

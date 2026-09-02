import { useMemo, useState } from 'react';
import type { FormStatus, FormSummary } from '../../lib/types';
import ConfirmDialog from '../confirm-dialog/ConfirmDialog';
import FormCard from '../form-card/FormCard';
import { IconPlus, IconSearch } from '../icons/Icons';

export default function Dashboard({ forms }: { forms: FormSummary[] }) {
  const [list, setList] = useState(forms);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | FormStatus>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return list.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
    });
  }, [list, filter, search]);

  const counts = useMemo(
    () => ({
      all: list.length,
      published: list.filter((f) => f.status === 'published').length,
      draft: list.filter((f) => f.status === 'draft').length,
      closed: list.filter((f) => f.status === 'closed').length,
    }),
    [list],
  );

  async function createForm() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Khảo sát mới' }),
      });
      const data = (await res.json()) as { id?: number; error?: string };
      if (!res.ok || data.id == null) {
        setError(data.error ?? 'Không tạo được form.');
        return;
      }
      location.href = `/admin/f/${data.id}`;
    } catch {
      setError('Không kết nối được máy chủ.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (deleteId == null) return;
    const res = await fetch(`/api/forms/${deleteId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? 'Không xóa được form.');
      setDeleteId(null);
      return;
    }
    setList((prev) => prev.filter((item) => item.id !== deleteId));
    setDeleteId(null);
  }

  const target = list.find((item) => item.id === deleteId);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Bảng điều khiển</p>
          <h1 className="section-title">Quản lý khảo sát</h1>
        </div>
        <button
          type="button"
          className="btn-primary flex min-h-11 items-center justify-center"
          disabled={busy}
          onClick={() => void createForm()}
        >
          <IconPlus className="mr-2 h-4 w-4" />
          {busy ? 'Đang tạo…' : 'Tạo form mới'}
        </button>
      </div>

      {error ? (
        <p className="field-error mt-4" role="alert">
          {error}
        </p>
      ) : null}

      {list.length > 0 ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5 border-b border-[var(--border)] pb-2 sm:border-b-0 sm:pb-0">
            {(
              [
                ['all', `Tất cả (${counts.all})`],
                ['published', `Đang mở (${counts.published})`],
                ['draft', `Nháp (${counts.draft})`],
                ['closed', `Đã đóng (${counts.closed})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`rounded-[var(--radius)] px-3 py-1.5 font-headline text-xs font-bold uppercase tracking-wide transition-colors ${
                  filter === key
                    ? 'bg-[var(--tad-black)] text-white'
                    : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--tad-ink)]'
                }`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative min-w-[14rem]">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="search"
              className="input-box min-h-9 pl-8.5 text-xs"
              placeholder="Tìm theo tiêu đề hoặc slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      {list.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <p className="font-headline text-xl font-extrabold uppercase">Chưa có khảo sát</p>
          <p className="lede mx-auto">Tạo form đầu tiên để bắt đầu thu thập phản hồi.</p>
          <button
            type="button"
            className="btn-primary mt-6 min-h-11"
            disabled={busy}
            onClick={() => void createForm()}
          >
            Tạo form đầu tiên
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-sm font-bold text-[var(--muted-foreground)]">
            Không tìm thấy khảo sát nào khớp với điều kiện lọc.
          </p>
          <button
            type="button"
            className="btn-ghost mt-2 text-xs font-bold"
            onClick={() => {
              setFilter('all');
              setSearch('');
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((form) => (
            <FormCard key={form.id} form={form} onDelete={() => setDeleteId(form.id)} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId != null}
        title="Xóa form?"
        message={`Xóa “${target?.title ?? ''}” và toàn bộ phản hồi? Không hoàn tác được.`}
        confirmLabel="Xóa"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}

import { useState } from 'react';
import type { FormSummary } from '../../lib/types';
import ConfirmDialog from '../confirm-dialog/ConfirmDialog';
import FormCard from '../form-card/FormCard';
import { IconPlus } from '../icons/Icons';

export default function Dashboard({ forms }: { forms: FormSummary[] }) {
  const [list, setList] = useState(forms);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="section-title">Quản lý khảo sát</h1>
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void createForm()}>
          <IconPlus className="mr-2 h-4 w-4" />
          {busy ? 'Đang tạo…' : 'Tạo form mới'}
        </button>
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      {list.length === 0 ? (
        <div className="mt-10 border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <p className="font-headline text-xl font-extrabold uppercase">Chưa có khảo sát</p>
          <p className="lede mx-auto">Tạo form đầu tiên để bắt đầu thu thập phản hồi.</p>
          <button type="button" className="btn-primary mt-6" disabled={busy} onClick={() => void createForm()}>
            Tạo form đầu tiên
          </button>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((form) => (
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

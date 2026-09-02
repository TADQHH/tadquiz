import { useState } from 'react';
import { IconExternalLink } from '../icons/Icons';

type Props = {
  formId: number;
  gristUrl: string | null;
};

/** Nút đồng bộ + mở Grist sheet: lần đầu tạo doc, các lần sau chỉ đẩy phần mới. */
export default function GristButton({ formId, gristUrl }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function open() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/forms/${formId}/grist?origin=${encodeURIComponent(location.origin)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = (await res.json()) as { url?: string | null; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Không đồng bộ được sheet.');
        return;
      }
      if (data.url) window.open(data.url, '_blank', 'noopener');
      else setError('Đã đồng bộ. Mở Grist để xem sheet (chưa cấu hình GRIST_PUBLIC_URL).');
    } catch {
      setError('Không kết nối được máy chủ.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        className="btn-ghost inline-flex items-center gap-1.5 border border-[var(--border)] text-xs font-bold hover:border-[var(--tad-red)]"
        disabled={busy}
        onClick={() => void open()}
        title="Mở dữ liệu phản hồi trên Grist sheet"
      >
        <IconExternalLink className="h-3.5 w-3.5" />
        {busy ? 'Đang đồng bộ…' : gristUrl ? 'Mở Sheet ↗' : 'Tạo Sheet ↗'}
      </button>
      {error ? <span className="field-error mt-1 max-w-64 text-right text-[11px]">{error}</span> : null}
    </div>
  );
}

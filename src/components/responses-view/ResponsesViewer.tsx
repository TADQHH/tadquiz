import { useMemo, useState } from 'react';
import type { Question } from '../../lib/types';
import { IconSearch } from '../icons/Icons';
import ResponseDetailModal, { type ResponseRow } from './ResponseDetailModal';
import ResponsesCards from './ResponsesCards';
import ResponsesTable from './ResponsesTable';

type Props = {
  questions: Question[];
  rows: ResponseRow[];
};

export default function ResponsesViewer({ questions, rows }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase().trim();
    return rows.filter((r) => {
      if (String(r.id).includes(q)) return true;
      return Object.values(r.answers).some((val) => {
        if (val == null) return false;
        if (Array.isArray(val)) return val.some((v) => String(v).toLowerCase().includes(q));
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [rows, query]);

  const selectedRow = selectedIndex != null ? filtered[selectedIndex] ?? null : null;

  if (rows.length === 0) {
    return (
      <div className="mt-8 rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center md:p-12">
        <p className="font-headline text-lg font-extrabold uppercase">Chưa có phản hồi nào</p>
        <p className="lede mx-auto text-sm">
          Khảo sát này chưa nhận được câu trả lời nào từ người tham gia.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[16rem] flex-1 max-w-md">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="search"
            className="input-box min-h-10 pl-9 text-xs"
            placeholder="Tìm theo ID hoặc nội dung câu trả lời…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="font-headline text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide">
          Hiển thị {filtered.length} / {rows.length} phản hồi
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-sm font-bold text-[var(--muted-foreground)]">
            Không tìm thấy phản hồi phù hợp với “{query}”
          </p>
          <button
            type="button"
            className="btn-ghost mt-2 text-xs font-bold"
            onClick={() => setQuery('')}
          >
            Xóa tìm kiếm
          </button>
        </div>
      ) : (
        <>
          <ResponsesCards
            rows={filtered}
            questions={questions}
            onSelect={(idx) => setSelectedIndex(idx)}
          />
          <ResponsesTable
            rows={filtered}
            questions={questions}
            onSelect={(idx) => setSelectedIndex(idx)}
          />
        </>
      )}

      <ResponseDetailModal
        open={selectedIndex != null}
        row={selectedRow}
        questions={questions}
        currentIndex={selectedIndex ?? 0}
        totalCount={filtered.length}
        onClose={() => setSelectedIndex(null)}
        onPrev={() => setSelectedIndex((prev) => (prev != null && prev > 0 ? prev - 1 : prev))}
        onNext={() =>
          setSelectedIndex((prev) =>
            prev != null && prev < filtered.length - 1 ? prev + 1 : prev,
          )
        }
      />
    </div>
  );
}

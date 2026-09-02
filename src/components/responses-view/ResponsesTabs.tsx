import { useState } from 'react';
import type { Question, ResponseRow } from '../../lib/types';
import ResponsesViewer from './ResponsesViewer';
import SheetView from './SheetView';
import SummaryView from './SummaryView';

type Mode = 'summary' | 'individual' | 'sheet';

const TABS: { id: Mode; label: string }[] = [
  { id: 'summary', label: 'Tổng hợp' },
  { id: 'individual', label: 'Từng phản hồi' },
  { id: 'sheet', label: 'Bảng tính' },
];

export default function ResponsesTabs({ questions, rows }: { questions: Question[]; rows: ResponseRow[] }) {
  const [mode, setMode] = useState<Mode>('summary');

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
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chế độ xem phản hồi">
        {TABS.map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`min-h-10 border px-4 font-headline text-xs font-extrabold uppercase tracking-wider ${
                active
                  ? 'border-[var(--tad-red)] bg-[var(--tad-red)] text-white'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--tad-ink)] hover:border-[var(--tad-red)]'
              }`}
              onClick={() => setMode(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {mode === 'summary' ? <SummaryView questions={questions} rows={rows} /> : null}
      {mode === 'individual' ? (
        <div className="-mt-8">
          <ResponsesViewer questions={questions} rows={rows} />
        </div>
      ) : null}
      {mode === 'sheet' ? <SheetView questions={questions} rows={rows} /> : null}
    </div>
  );
}

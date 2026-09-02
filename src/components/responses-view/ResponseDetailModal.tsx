import { useEffect, useRef, useState } from 'react';
import type { Question } from '../../lib/types';
import { copyText } from '../../lib/clipboard';
import { formatViDate } from '../format-date/format-date';
import { TYPE_LABELS } from '../type-labels/type-labels';
import { IconClose, IconChevronLeft, IconChevronRight, IconCopy } from '../icons/Icons';
import AnswerDisplay from './AnswerDisplay';

export type ResponseRow = {
  id: number;
  submittedAt: string;
  answers: Record<string, unknown>;
};

type Props = {
  open: boolean;
  row: ResponseRow | null;
  questions: Question[];
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function ResponseDetailModal({
  open,
  row,
  questions,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null);

  async function copyJson() {
    if (!row) return;
    const ok = await copyText(JSON.stringify(row, null, 2));
    setCopied(ok ? 'ok' : 'fail');
    window.setTimeout(() => setCopied(null), 1600);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight' && currentIndex < totalCount - 1) {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, totalCount, onPrev, onNext]);

  if (!row) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto flex max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl flex-col rounded-[var(--radius)] border-2 border-[var(--tad-black)] bg-[var(--card)] p-0 shadow-[8px_8px_0_var(--tad-red)] backdrop:bg-[color-mix(in_srgb,var(--tad-black)_60%,transparent)]"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--tad-paper)] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-extrabold text-[var(--tad-red)]">#{row.id}</span>
          <div>
            <h2 className="font-headline text-base font-extrabold uppercase tracking-wide md:text-lg">
              Chi tiết phản hồi
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Gửi lúc: {formatViDate(row.submittedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] hover:border-[var(--tad-red)] disabled:opacity-30"
            disabled={currentIndex <= 0}
            onClick={onPrev}
            aria-label="Phản hồi trước"
            title="Phản hồi trước (Phím ←)"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-1 font-mono text-xs text-[var(--muted-foreground)]">
            {currentIndex + 1}/{totalCount}
          </span>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] hover:border-[var(--tad-red)] disabled:opacity-30"
            disabled={currentIndex >= totalCount - 1}
            onClick={onNext}
            aria-label="Phản hồi sau"
            title="Phản hồi sau (Phím →)"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
            onClick={onClose}
            aria-label="Đóng"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {questions.map((q, idx) => {
          const val = row.answers[String(q.id)] ?? row.answers[q.id];
          return (
            <div
              key={q.id}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-headline text-xs font-bold uppercase tracking-wider text-[var(--tad-red)]">
                  Câu {idx + 1}
                </span>
                <span className="rounded bg-[var(--muted)] px-2 py-0.5 font-headline text-[10px] font-extrabold uppercase text-[var(--muted-foreground)]">
                  {TYPE_LABELS[q.type]}
                </span>
              </div>
              <p className="mt-1.5 font-headline text-sm font-extrabold text-[var(--tad-ink)] md:text-base">
                {q.label}
              </p>
              {q.description ? (
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{q.description}</p>
              ) : null}
              <div className="mt-3">
                <AnswerDisplay type={q.type} value={val} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--tad-paper)] px-5 py-3">
        <button
          type="button"
          className="btn-ghost text-xs font-bold"
          onClick={() => void copyJson()}
        >
          <IconCopy className="mr-1.5 h-3.5 w-3.5" />
          {copied === 'ok' ? 'Đã chép!' : copied === 'fail' ? 'Lỗi — chép tay' : 'Sao chép JSON'}
        </button>
        <button
          type="button"
          className="btn-primary min-h-9 px-4 text-xs font-bold"
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    </dialog>
  );
}

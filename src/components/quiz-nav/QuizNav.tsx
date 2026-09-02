type Props = {
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  isTextarea?: boolean;
  onBack: () => void;
  onNext: () => void;
};

export default function QuizNav({
  isFirst,
  isLast,
  busy,
  isTextarea = false,
  onBack,
  onNext,
}: Props) {
  return (
    <div
      className="mt-auto flex items-center justify-between gap-3 pt-8 pb-4"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <button
        type="button"
        className="btn-ghost min-h-12 border border-[var(--border)] px-4 text-xs font-bold sm:px-6 hover:border-[var(--tad-ink)] disabled:opacity-30"
        disabled={isFirst || busy}
        onClick={onBack}
      >
        ← Quay lại
      </button>
      <p className="hidden text-xs text-[var(--muted-foreground)] md:block">
        {isTextarea ? (
          'Dùng nút Tiếp tục để sang câu kế tiếp'
        ) : (
          <>
            Nhấn <kbd aria-hidden="true">Enter ↵</kbd> để tiếp tục
          </>
        )}
      </p>
      <button
        type="button"
        className="btn-primary min-h-12 px-6 text-xs font-bold sm:px-8"
        disabled={busy}
        onClick={onNext}
      >
        {busy ? 'Đang gửi…' : isLast ? 'Gửi phản hồi ✓' : 'Tiếp tục →'}
      </button>
    </div>
  );
}

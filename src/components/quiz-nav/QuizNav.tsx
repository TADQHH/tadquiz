type Props = {
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  isTextarea?: boolean;
  onBack: () => void;
  onNext: () => void;
};

export default function QuizNav({ isFirst, isLast, busy, isTextarea = false, onBack, onNext }: Props) {
  return (
    <div
      className="mt-auto flex items-center justify-between gap-3 pt-8"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <button type="button" className="btn-ghost" disabled={isFirst || busy} onClick={onBack}>
        ← Quay lại
      </button>
      <p className="hidden text-sm text-[var(--muted-foreground)] md:block">
        {isTextarea ? (
          'Dùng nút Tiếp tục để sang câu kế tiếp'
        ) : (
          <>
            Nhấn <kbd aria-hidden="true">Enter</kbd> để tiếp tục
          </>
        )}
      </p>
      <button type="button" className="btn-primary" disabled={busy} onClick={onNext}>
        {busy ? 'Đang gửi…' : isLast ? 'Gửi phản hồi' : 'Tiếp tục'}
      </button>
    </div>
  );
}

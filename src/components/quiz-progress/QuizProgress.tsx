type Props = { now: number; max: number };

export default function QuizProgress({ now, max }: Props) {
  const percent = max === 0 ? 0 : (now / max) * 100;
  return (
    <div className="sticky top-0 z-20 h-1 bg-[var(--muted)]">
      <div
        className="h-full bg-[var(--tad-red)]"
        style={{ width: `${percent}%` }}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={Math.max(max, 1)}
        aria-valuenow={now}
        aria-label="Tiến độ"
      />
    </div>
  );
}

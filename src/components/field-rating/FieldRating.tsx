type Props = {
  name: string;
  value?: number;
  error?: string;
  labelledBy: string;
  onChange: (value: number) => void;
};

export default function FieldRating({ name, value, error, labelledBy, onChange }: Props) {
  const LABELS = ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'];

  return (
    <div>
      <div className="grid grid-cols-5 gap-2 sm:gap-3" role="radiogroup" aria-labelledby={labelledBy}>
        {[1, 2, 3, 4, 5].map((n, idx) => (
          <button
            key={n}
            type="button"
            className="rate-btn flex flex-col items-center justify-center p-2 min-h-14 sm:min-h-16"
            data-selected={value === n}
            aria-checked={value === n}
            role="radio"
            name={name}
            onClick={() => onChange(n)}
          >
            <span className="font-headline text-lg font-extrabold sm:text-xl">{n}</span>
            <span className="hidden text-[10px] font-semibold text-[var(--muted-foreground)] sm:inline-block">
              {LABELS[idx]}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between px-1 text-[11px] font-medium text-[var(--muted-foreground)] sm:hidden">
        <span>1: Rất tệ</span>
        <span>5: Tuyệt vời</span>
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

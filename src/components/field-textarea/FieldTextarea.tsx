type Props = {
  id: string;
  labelledBy: string;
  value: string;
  maxChars: number | null;
  error?: string;
  onChange: (value: string) => void;
};

export default function FieldTextarea({ id, labelledBy, value, maxChars, error, onChange }: Props) {
  const errorId = `${id}-error`;
  return (
    <div>
      <textarea
        id={id}
        className="input-box min-h-32 py-3 text-base sm:text-sm leading-relaxed"
        rows={5}
        placeholder="Nhập câu trả lời chi tiết của bạn…"
        value={value}
        maxLength={maxChars ?? undefined}
        aria-labelledby={labelledBy}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="mt-2 flex items-center justify-between">
        {error ? (
          <p id={errorId} className="field-error m-0" role="alert">
            {error}
          </p>
        ) : (
          <span />
        )}
        {maxChars != null ? (
          <span
            className={`font-mono text-xs ${
              value.length >= maxChars ? 'font-bold text-[var(--tad-red)]' : 'text-[var(--muted-foreground)]'
            }`}
          >
            {value.length}/{maxChars}
          </span>
        ) : null}
      </div>
    </div>
  );
}

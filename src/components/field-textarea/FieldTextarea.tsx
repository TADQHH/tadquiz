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
        className="input-box min-h-32 py-3"
        rows={5}
        value={value}
        maxLength={maxChars ?? undefined}
        aria-labelledby={labelledBy}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {maxChars != null ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {value.length}/{maxChars}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

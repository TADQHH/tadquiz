type Props = {
  name: string;
  value?: number;
  error?: string;
  labelledBy: string;
  onChange: (value: number) => void;
};

export default function FieldRating({ name, value, error, labelledBy, onChange }: Props) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-labelledby={labelledBy}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="rate-btn"
            data-selected={value === n}
            aria-checked={value === n}
            role="radio"
            name={name}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

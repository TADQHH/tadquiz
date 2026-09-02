type Props = {
  name: string;
  options: string[];
  multiple: boolean;
  value: string | string[];
  error?: string;
  labelledBy: string;
  onChange: (value: string | string[]) => void;
};

function letter(index: number) {
  return String.fromCharCode(65 + index);
}

export default function FieldChoice({
  name,
  options,
  multiple,
  value,
  error,
  labelledBy,
  onChange,
}: Props) {
  const selected = new Set(Array.isArray(value) ? value : value ? [value] : []);

  function toggle(option: string) {
    if (multiple) {
      const next = new Set(selected);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      onChange([...next]);
      return;
    }
    onChange(option);
  }

  return (
    <div role={multiple ? 'group' : 'radiogroup'} aria-labelledby={labelledBy}>
      <ul className="space-y-3">
        {options.map((option, index) => {
          const checked = selected.has(option);
          const inputId = `${name}-${index}`;
          return (
            <li key={`${index}-${option}`}>
              <label className="opt-card cursor-pointer" data-selected={checked}>
                <input
                  id={inputId}
                  className="sr-only"
                  type={multiple ? 'checkbox' : 'radio'}
                  name={name}
                  value={option}
                  checked={checked}
                  onChange={() => toggle(option)}
                />
                <kbd className="hidden md:inline-flex" aria-hidden="true">
                  {letter(index)}
                </kbd>
                <span>{option}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

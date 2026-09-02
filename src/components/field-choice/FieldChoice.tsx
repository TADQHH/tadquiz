import { IconCheck } from '../icons/Icons';

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
              <label className="opt-card cursor-pointer group" data-selected={checked}>
                <input
                  id={inputId}
                  className="sr-only"
                  type={multiple ? 'checkbox' : 'radio'}
                  name={name}
                  value={option}
                  checked={checked}
                  onChange={() => toggle(option)}
                />
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
                    multiple ? 'rounded-[3px]' : 'rounded-full'
                  } ${
                    checked
                      ? 'border-[var(--tad-red)] bg-[var(--tad-red)] text-white'
                      : 'border-[var(--border)] bg-[var(--card)] group-hover:border-[var(--tad-red)]'
                  }`}
                  aria-hidden="true"
                >
                  {checked ? <IconCheck className="h-3.5 w-3.5" /> : null}
                </span>
                <kbd className="hidden md:inline-flex" aria-hidden="true">
                  {letter(index)}
                </kbd>
                <span className="flex-1 break-words font-medium text-[var(--tad-ink)]">{option}</span>
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

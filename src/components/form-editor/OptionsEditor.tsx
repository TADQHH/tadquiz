import { MAX_OPTIONS } from '../../lib/types';
import { IconPlus, IconTrash } from '../icons/Icons';

type Props = {
  options: string[];
  onChange: (options: string[]) => void;
};

export default function OptionsEditor({ options, onChange }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="font-headline text-xs font-extrabold uppercase tracking-[0.14em]">
          Các phương án lựa chọn
        </p>
        <span className="text-xs text-[var(--muted-foreground)]">
          {options.length}/{MAX_OPTIONS}
        </span>
      </div>
      {options.map((option, index) => {
        const letter = String.fromCharCode(65 + index);
        return (
          <div key={index} className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] font-headline text-xs font-bold text-[var(--tad-ink)]">
              {letter}
            </span>
            <input
              className="input-box min-h-10 text-sm"
              placeholder={`Lựa chọn ${letter}…`}
              value={option}
              onChange={(event) => {
                const next = [...options];
                next[index] = event.target.value;
                onChange(next);
              }}
              aria-label={`Lựa chọn ${letter}`}
            />
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--tad-red)] hover:text-[var(--tad-red)] disabled:opacity-30"
              disabled={options.length <= 2}
              onClick={() => onChange(options.filter((_, i) => i !== index))}
              aria-label={`Xóa lựa chọn ${letter}`}
              title={`Xóa lựa chọn ${letter}`}
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        className="btn-dashed min-h-10 text-xs font-bold"
        disabled={options.length >= MAX_OPTIONS}
        onClick={() => onChange([...options, ''])}
      >
        <IconPlus className="mr-1.5 h-3.5 w-3.5" />
        Thêm lựa chọn ({options.length}/{MAX_OPTIONS})
      </button>
    </div>
  );
}

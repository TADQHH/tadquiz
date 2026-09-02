import { useMemo } from 'react';
import { validateSlug } from '../../lib/slug';

type Props = {
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

export default function SlugField({ value, error, onChange }: Props) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const local = useMemo(() => validateSlug(value), [value]);
  const shown = error || (!local.ok ? local.error : '');

  return (
    <label className="block">
      <span className="mb-2 block font-headline text-xs font-extrabold uppercase tracking-[0.14em]">
        Đường dẫn
      </span>
      <div className="flex min-h-11 items-stretch border-2 border-[var(--border)] bg-[var(--card)] focus-within:border-[var(--tad-red)] focus-within:shadow-[3px_3px_0_var(--tad-red)]">
        <span className="inline-flex items-center px-3 font-mono text-sm text-[var(--muted-foreground)]">
          /q/
        </span>
        <input
          className="min-h-11 w-full bg-transparent px-2 font-mono outline-none"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={shown ? true : undefined}
          aria-describedby="slug-hint"
        />
      </div>
      <p id="slug-hint" className="mt-2 text-sm text-[var(--muted-foreground)]">
        Chỉ a–z, 0–9 và dấu gạch ngang. {origin}/q/{value || '…'}
      </p>
      {shown ? (
        <p className="field-error" role="alert">
          {shown}
        </p>
      ) : null}
    </label>
  );
}

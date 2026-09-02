import { MAX_OPTIONS } from '../../lib/types';
import { IconPlus, IconTrash } from '../icons/Icons';

type Props = {
  options: string[];
  onChange: (options: string[]) => void;
};

export default function OptionsEditor({ options, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="font-headline text-xs font-extrabold uppercase tracking-[0.14em]">Lựa chọn</p>
      {options.map((option, index) => (
        <div key={index} className="flex gap-2">
          <input
            className="input-box"
            value={option}
            onChange={(event) => {
              const next = [...options];
              next[index] = event.target.value;
              onChange(next);
            }}
            aria-label={`Lựa chọn ${index + 1}`}
          />
          <button
            type="button"
            className="btn-ghost px-3"
            disabled={options.length <= 2}
            onClick={() => onChange(options.filter((_, i) => i !== index))}
            aria-label={`Xóa lựa chọn ${index + 1}`}
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-dashed"
        disabled={options.length >= MAX_OPTIONS}
        onClick={() => onChange([...options, ''])}
      >
        <IconPlus className="mr-2 h-4 w-4" />
        Thêm lựa chọn
      </button>
    </div>
  );
}

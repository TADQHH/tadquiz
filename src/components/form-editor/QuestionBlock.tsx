import { QUESTION_TYPES, type QuestionType } from '../../lib/types';
import { IconArrowUp, IconArrowDown, IconGrip, IconTrash } from '../icons/Icons';
import { TYPE_LABELS } from '../type-labels/type-labels';
import LogicBuilder from './LogicBuilder';
import OptionsEditor from './OptionsEditor';
import { applyType, type DraftQuestion } from './editor-model';

type Props = {
  index: number;
  total: number;
  question: DraftQuestion;
  earlier: DraftQuestion[];
  onChange: (question: DraftQuestion) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
};

export default function QuestionBlock({
  index,
  total,
  question,
  earlier,
  onChange,
  onMove,
  onRemove,
}: Props) {
  const choice = question.type === 'single_choice' || question.type === 'multi_choice';
  const texty = question.type === 'text' || question.type === 'textarea';

  return (
    <article className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <IconGrip className="h-4 w-4 text-[var(--muted-foreground)]" />
          <span className="font-headline text-xs font-extrabold uppercase tracking-wider text-[var(--tad-red)]">
            Câu {index + 1}
          </span>
          <span className="rounded bg-[var(--muted)] px-2 py-0.5 font-headline text-[10px] font-extrabold uppercase text-[var(--muted-foreground)]">
            {TYPE_LABELS[question.type]}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] hover:border-[var(--tad-red)] disabled:opacity-30"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Chuyển lên"
            title="Chuyển lên"
          >
            <IconArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] hover:border-[var(--tad-red)] disabled:opacity-30"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label="Chuyển xuống"
            title="Chuyển xuống"
          >
            <IconArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--tad-red)] hover:text-[var(--tad-red)]"
            onClick={onRemove}
            aria-label="Xóa câu hỏi"
            title="Xóa câu hỏi"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      </div>
      <label className="mt-4 block">
        <span className="mb-2 block font-headline text-xs font-extrabold uppercase tracking-[0.14em]">
          Nội dung
        </span>
        <input
          className="input-box"
          value={question.label}
          onChange={(event) => onChange({ ...question, label: event.target.value })}
        />
      </label>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block font-headline text-xs font-extrabold uppercase tracking-[0.14em]">
            Loại
          </span>
          <select
            className="input-box"
            value={question.type}
            onChange={(event) => onChange(applyType(question, event.target.value as QuestionType))}
          >
            {QUESTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex min-h-11 items-center gap-2 self-end">
          <input
            type="checkbox"
            className="chk"
            checked={question.required}
            onChange={(event) => onChange({ ...question, required: event.target.checked })}
          />
          Bắt buộc
        </label>
      </div>
      <label className="mt-4 block">
        <span className="mb-2 block font-headline text-xs font-extrabold uppercase tracking-[0.14em]">
          Mô tả
        </span>
        <input
          className="input-box"
          value={question.description}
          onChange={(event) => onChange({ ...question, description: event.target.value })}
        />
      </label>
      {choice ? (
        <div className="mt-4">
          <OptionsEditor
            options={question.options}
            onChange={(options) => onChange({ ...question, options })}
          />
        </div>
      ) : null}
      {texty ? (
        <label className="mt-4 block">
          <span className="mb-2 block font-headline text-xs font-extrabold uppercase tracking-[0.14em]">
            Tối đa ký tự
          </span>
          <input
            className="input-box"
            type="number"
            min={1}
            max={5000}
            value={question.maxChars ?? ''}
            onChange={(event) =>
              onChange({
                ...question,
                maxChars: event.target.value === '' ? null : Number(event.target.value),
              })
            }
          />
        </label>
      ) : null}
      {earlier.length > 0 ? (
        <LogicBuilder question={question} earlier={earlier} onChange={onChange} />
      ) : null}
    </article>
  );
}

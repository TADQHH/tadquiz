import { QUESTION_TYPES, type QuestionType } from '../../lib/types';
import { IconGrip, IconTrash } from '../icons/Icons';
import { TYPE_LABELS } from '../type-labels/type-labels';
import OptionsEditor from './OptionsEditor';
import { applyType, type DraftQuestion } from './editor-model';

type Props = {
  index: number;
  total: number;
  question: DraftQuestion;
  onChange: (question: DraftQuestion) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
};

export default function QuestionBlock({ index, total, question, onChange, onMove, onRemove }: Props) {
  const choice = question.type === 'single_choice' || question.type === 'multi_choice';
  const texty = question.type === 'text' || question.type === 'textarea';

  return (
    <article className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <IconGrip className="h-5 w-5" />
          <p className="eyebrow">Câu {index + 1}</p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className="btn-ghost px-3"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Chuyển lên"
          >
            ↑
          </button>
          <button
            type="button"
            className="btn-ghost px-3"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label="Chuyển xuống"
          >
            ↓
          </button>
          <button type="button" className="btn-ghost px-3" onClick={onRemove} aria-label="Xóa câu hỏi">
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
    </article>
  );
}

import { OPERATOR_LABELS, OPERATORS_BY_TYPE, opNeedsValue } from '../../lib/logic';
import type { LogicOperator } from '../../lib/types';
import type { DraftLogic, DraftQuestion } from './editor-model';

type Props = {
  question: DraftQuestion;
  earlier: DraftQuestion[];
  onChange: (question: DraftQuestion) => void;
};

function valueOk(ref: DraftQuestion, op: LogicOperator, value?: string | number) {
  if (!opNeedsValue(op)) return true;
  if (value === undefined || value === '') return false;
  if (ref.type === 'single_choice' || ref.type === 'multi_choice') {
    return ref.options.includes(String(value));
  }
  if (ref.type === 'rating') {
    const n = typeof value === 'number' ? value : Number(value);
    return n >= 1 && n <= 5;
  }
  return true;
}

function patched(ref: DraftQuestion, logic: DraftLogic): DraftLogic {
  const ops = OPERATORS_BY_TYPE[ref.type];
  const op = ops.includes(logic.op) ? logic.op : ops[0];
  const value = valueOk(ref, op, logic.value) ? logic.value : undefined;
  return { questionKey: ref.key, op, value };
}

function ValueControl({
  refQ,
  op,
  value,
  onChange,
}: {
  refQ: DraftQuestion;
  op: LogicOperator;
  value?: string | number;
  onChange: (value: string | number) => void;
}) {
  if (!opNeedsValue(op)) return null;
  if (refQ.type === 'single_choice' || refQ.type === 'multi_choice') {
    return (
      <select
        className="input-box min-w-[10rem] flex-1"
        aria-label="Giá trị"
        value={value === undefined ? '' : String(value)}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Chọn đáp án</option>
        {refQ.options.filter(Boolean).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  if (refQ.type === 'rating') {
    return (
      <select
        className="input-box min-w-[6rem]"
        aria-label="Giá trị"
        value={value === undefined ? '' : String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        <option value="">Chọn mức</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      className="input-box min-w-[10rem] flex-1"
      aria-label="Giá trị"
      value={value === undefined ? '' : String(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default function LogicBuilder({ question, earlier, onChange }: Props) {
  const logic = question.logic;
  const ref = earlier.find((item) => item.key === logic?.questionKey);
  const orphan = Boolean(logic?.questionKey) && !ref;

  function setLogic(next: DraftLogic | null) {
    onChange({ ...question, logic: next });
  }

  function toggle(on: boolean) {
    if (!on) {
      setLogic(null);
      return;
    }
    const first = earlier[0];
    setLogic({ questionKey: first.key, op: OPERATORS_BY_TYPE[first.type][0] });
  }

  const ops = ref ? OPERATORS_BY_TYPE[ref.type] : [];

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      <label className="inline-flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          className="chk"
          checked={Boolean(logic) && !orphan}
          onChange={(event) => toggle(event.target.checked)}
        />
        Chỉ hiển thị khi có điều kiện
      </label>
      {orphan ? <p className="field-error mt-2">Câu tham chiếu đã bị xóa</p> : null}
      {logic && ref ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <select
            className="input-box min-w-[12rem] flex-1"
            aria-label="Câu hỏi trước"
            value={logic.questionKey}
            onChange={(event) => {
              const nextRef = earlier.find((item) => item.key === event.target.value);
              if (nextRef) setLogic(patched(nextRef, logic));
            }}
          >
            {earlier.map((item, i) => {
              const label = item.label.trim() || 'Chưa có nội dung';
              const short = label.length > 40 ? `${label.slice(0, 40)}…` : label;
              return (
                <option key={item.key} value={item.key} title={item.label}>
                  C{i + 1}. {short}
                </option>
              );
            })}
          </select>
          <select
            className="input-box min-w-[10rem]"
            aria-label="Điều kiện"
            value={ops.includes(logic.op) ? logic.op : ops[0]}
            onChange={(event) => setLogic(patched(ref, { ...logic, op: event.target.value as LogicOperator }))}
          >
            {ops.map((op) => (
              <option key={op} value={op}>
                {OPERATOR_LABELS[op]}
              </option>
            ))}
          </select>
          <ValueControl
            refQ={ref}
            op={ops.includes(logic.op) ? logic.op : ops[0]}
            value={logic.value}
            onChange={(value) => setLogic({ ...logic, value })}
          />
          <button type="button" className="btn-ghost text-xs font-bold" onClick={() => setLogic(null)}>
            Xóa điều kiện
          </button>
        </div>
      ) : null}
    </div>
  );
}

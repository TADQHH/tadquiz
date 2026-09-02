import { useEffect, useMemo, useRef, useState } from 'react';
import { visibleQuestions } from '../../lib/logic';
import type { AnswerValue, FormDetail } from '../../lib/types';
import { validateAnswers } from '../../lib/validate';

function fieldOf(fields: Record<string, string>, id: number) {
  return fields[String(id)] ?? fields[id as unknown as string];
}

export function useQuiz(form: FormDetail) {
  const all = form.questions;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const visible = useMemo(() => visibleQuestions(all, answers), [all, answers]);
  const safeIndex = visible.length === 0 ? 0 : Math.min(index, visible.length - 1);
  const question = visible[safeIndex];
  const isLast = visible.length === 0 || safeIndex === visible.length - 1;

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.scrollIntoView({ block: 'start' });
  }, [safeIndex]);

  function setAnswer(id: number, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [String(id)]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[String(id)];
      delete next[id];
      return next;
    });
  }

  function validateAt(i: number, extra?: Record<string, AnswerValue>) {
    const q = visible[i];
    if (!q) return true;
    const submitted = { ...answersRef.current, ...extra };
    const result = validateAnswers([q], submitted);
    if (result.ok) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[String(q.id)];
        delete next[q.id];
        return next;
      });
      return true;
    }
    setErrors((prev) => ({ ...prev, ...result.errors }));
    return false;
  }

  function go(nextIndex: number) {
    // Tính lại từ answersRef: closure có thể cũ hơn danh sách visible mới nhất
    // (câu điều kiện vừa hiện ra sau khi chọn đáp án).
    const list = visibleQuestions(all, answersRef.current);
    if (list.length === 0) {
      setIndex(0);
      return;
    }
    setIndex(Math.min(list.length - 1, Math.max(0, nextIndex)));
  }

  function next(extra?: Record<string, AnswerValue>) {
    if (busy) return;
    if (!validateAt(safeIndex, extra)) return;
    const submitted = { ...answersRef.current, ...extra };
    const list = visibleQuestions(all, submitted);
    const here = question ? list.findIndex((q) => q.id === question.id) : safeIndex;
    const at = here >= 0 ? here : safeIndex;
    if (list.length === 0 || at >= list.length - 1) void submit(extra);
    else go(at + 1);
  }

  function back() {
    if (busy || safeIndex === 0) return;
    go(safeIndex - 1);
  }

  async function submit(extra?: Record<string, AnswerValue>) {
    const submitted = { ...answersRef.current, ...extra };
    const shown = visibleQuestions(all, submitted);
    const result = validateAnswers(shown, submitted);
    if (!result.ok) {
      setErrors(Object.fromEntries(Object.entries(result.errors).map(([k, v]) => [k, v])));
      const first = shown.findIndex((q) => result.errors[q.id]);
      if (first >= 0) setIndex(first);
      return;
    }
    setBusy(true);
    setInfo('');
    try {
      const res = await fetch(`/api/q/${form.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: result.values }),
      });
      const data = (await res.json()) as {
        error?: string;
        fields?: Record<string, string>;
        redirect?: string;
      };
      if (res.status === 429) {
        setInfo(data.error ?? 'Bạn gửi nhanh quá — thử lại sau một phút.');
        return;
      }
      if (res.status === 400 && data.fields) {
        setErrors(data.fields);
        const first = shown.findIndex((q) => fieldOf(data.fields ?? {}, q.id));
        if (first >= 0) setIndex(first);
        return;
      }
      if (!res.ok) {
        setInfo(data.error ?? 'Gửi thất bại.');
        return;
      }
      location.href = data.redirect ?? `/q/${form.slug}/done`;
    } catch {
      setInfo('Không kết nối được máy chủ.');
    } finally {
      setBusy(false);
    }
  }

  return {
    index: safeIndex,
    question,
    questions: visible,
    answers,
    errors,
    busy,
    info,
    titleRef,
    isLast,
    setAnswer,
    next,
    back,
  };
}

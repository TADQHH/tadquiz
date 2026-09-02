import { useEffect, useRef, useState } from 'react';
import type { AnswerValue, FormDetail } from '../../lib/types';
import { validateAnswers } from '../../lib/validate';

function fieldOf(fields: Record<string, string>, id: number) {
  return fields[String(id)] ?? fields[id as unknown as string];
}

export function useQuiz(form: FormDetail) {
  const questions = form.questions;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const question = questions[index];
  const isLast = questions.length === 0 || index === questions.length - 1;

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.scrollIntoView({ block: 'start' });
  }, [index]);

  function setAnswer(id: number, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[String(id)];
      delete next[id];
      return next;
    });
  }

  function validateAt(i: number, extra?: Record<string, AnswerValue>) {
    const q = questions[i];
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
    setIndex(Math.min(questions.length - 1, Math.max(0, nextIndex)));
  }

  function next(extra?: Record<string, AnswerValue>) {
    if (busy) return;
    if (!validateAt(index, extra)) return;
    if (isLast) void submit(extra);
    else go(index + 1);
  }

  function back() {
    if (busy || index === 0) return;
    go(index - 1);
  }

  async function submit(extra?: Record<string, AnswerValue>) {
    const submitted = { ...answersRef.current, ...extra };
    const result = validateAnswers(questions, submitted);
    if (!result.ok) {
      setErrors(Object.fromEntries(Object.entries(result.errors).map(([k, v]) => [k, v])));
      const first = questions.findIndex((q) => result.errors[q.id]);
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
        const first = questions.findIndex((q) => fieldOf(data.fields ?? {}, q.id));
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
    index,
    question,
    questions,
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

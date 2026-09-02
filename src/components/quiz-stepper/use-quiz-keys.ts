import { useEffect, useRef } from 'react';
import type { AnswerValue, Question } from '../../lib/types';

function typingTarget(target: EventTarget | null) {
  const el = target as HTMLInputElement | HTMLTextAreaElement | null;
  if (!el || !('tagName' in el)) return { typing: false, textarea: false, text: false };
  const tag = el.tagName;
  const type = 'type' in el ? String(el.type) : '';
  const textarea = tag === 'TEXTAREA';
  const text =
    tag === 'INPUT' &&
    ['text', 'search', 'email', 'password', 'number', 'url', ''].includes(type);
  return { typing: textarea || text, textarea, text };
}

type Api = {
  question?: Question;
  answers: Record<string, AnswerValue>;
  setAnswer: (id: number, value: AnswerValue) => void;
  next: (extra?: Record<string, AnswerValue>) => void;
  back: () => void;
};

export function useQuizKeys(api: Api) {
  const ref = useRef(api);
  ref.current = api;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const { question, answers, setAnswer, next, back } = ref.current;
      const kind = typingTarget(event.target);
      if (event.key === 'Enter' && event.shiftKey) {
        if (kind.textarea) return;
        event.preventDefault();
        back();
        return;
      }
      if (event.key === 'Enter') {
        if (kind.textarea) return;
        if ((event.target as HTMLElement | null)?.tagName === 'BUTTON') return;
        event.preventDefault();
        next();
        return;
      }
      if (kind.typing) return;
      if (!question) return;
      const letter = event.key.length === 1 ? event.key.toUpperCase() : '';
      let optionIndex = -1;
      if (event.key >= '1' && event.key <= '9') optionIndex = Number(event.key) - 1;
      else if (letter >= 'A' && letter <= 'Z') optionIndex = letter.charCodeAt(0) - 65;
      if (optionIndex < 0) return;
      if (question.type === 'rating') {
        const rating = optionIndex + 1;
        if (rating < 1 || rating > 5) return;
        event.preventDefault();
        setAnswer(question.id, rating);
        return;
      }
      if (question.type !== 'single_choice' && question.type !== 'multi_choice') return;
      const option = question.options[optionIndex];
      if (!option) return;
      event.preventDefault();
      if (question.type === 'single_choice') {
        setAnswer(question.id, option);
        window.setTimeout(() => ref.current.next({ [question.id]: option }), 150);
        return;
      }
      const current = answers[String(question.id)];
      const list = Array.isArray(current) ? current : [];
      const nextList = list.includes(option)
        ? list.filter((item) => item !== option)
        : [...list, option];
      setAnswer(question.id, nextList);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

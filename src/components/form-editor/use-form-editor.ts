import { useMemo, useRef, useState } from 'react';
import type { FormDetail, FormStatus } from '../../lib/types';
import { validateSlug } from '../../lib/slug';
import {
  fromForm,
  newQuestion,
  payloadOf,
  snapshot,
  statusAction,
  type DraftQuestion,
} from './editor-model';

export function useFormEditor(form: FormDetail) {
  const [title, setTitle] = useState(form.title);
  const [slug, setSlug] = useState(form.slug);
  const [description, setDescription] = useState(form.description);
  const [completionUrl, setCompletionUrl] = useState(form.completionUrl ?? '');
  const [status, setStatus] = useState<FormStatus>(form.status);
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => fromForm(form));
  const [error, setError] = useState('');
  const [slugError, setSlugError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const baseline = useRef(snapshot(form.title, form.slug, form.description, form.completionUrl ?? '', fromForm(form)));
  const dirty = useMemo(
    () => snapshot(title, slug, description, completionUrl, questions) !== baseline.current,
    [title, slug, description, completionUrl, questions],
  );

  function apply(detail: FormDetail) {
    const next = fromForm(detail);
    setTitle(detail.title);
    setSlug(detail.slug);
    setDescription(detail.description);
    setCompletionUrl(detail.completionUrl ?? '');
    setQuestions(next);
    baseline.current = snapshot(detail.title, detail.slug, detail.description, detail.completionUrl ?? '', next);
  }

  async function save(): Promise<FormDetail | null> {
    const check = validateSlug(slug);
    if (!check.ok) {
      setSlugError(check.error ?? 'Slug không hợp lệ.');
      return null;
    }
    setSaving(true);
    setError('');
    setSlugError('');
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadOf(title, slug, description, completionUrl.trim(), questions)),
      });
      const data = (await res.json()) as FormDetail & { error?: string };
      if (res.status === 409) {
        setSlugError(data.error ?? 'Slug đã được dùng.');
        return null;
      }
      if (!res.ok) {
        setError(data.error ?? 'Không lưu được.');
        return null;
      }
      apply(data);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
      return data;
    } catch {
      setError('Không kết nối được máy chủ.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus() {
    if (dirty) {
      const ok = await save();
      if (!ok) return;
    }
    const { next } = statusAction(status);
    const res = await fetch(`/api/forms/${form.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    const data = (await res.json()) as { error?: string; status?: FormStatus };
    if (!res.ok) {
      setError(data.error ?? 'Không đổi trạng thái.');
      return;
    }
    if (data.status) setStatus(data.status);
  }

  async function removeForm() {
    const res = await fetch(`/api/forms/${form.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      location.href = '/admin';
      return;
    }
    const data = (await res.json()) as { error?: string };
    setError(data.error ?? 'Không xóa được form.');
  }

  function move(index: number, dir: -1 | 1) {
    setQuestions((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return {
    title,
    setTitle,
    slug,
    setSlug,
    description,
    setDescription,
    completionUrl,
    setCompletionUrl,
    status,
    setQuestions,
    error,
    slugError,
    saved,
    saving,
    dirty,
    save,
    changeStatus,
    removeForm,
    move,
    addQuestion: () => setQuestions((prev) => [...prev, newQuestion()]),
    removeQuestion: (index: number) => setQuestions((prev) => prev.filter((_, i) => i !== index)),
  };
}

import type { FormDetail, FormSummary, FormInput } from '../lib/types';

export function slugExists(slug: string, excludeId?: number): boolean;
export function createForm(input: {
  slug: string;
  title: string;
  description?: string;
  createdBy: number;
}): number;
export function syncQuestions(formId: number, questions: FormInput['questions']): void;
export function getForm(id: number): FormDetail | null;
export function getFormBySlug(slug: string): FormDetail | null;
export function listForms(): FormSummary[];
export function updateFormMeta(
  id: number,
  meta: { title?: string; slug?: string; description?: string },
): boolean;
export function setStatus(id: number, status: 'draft' | 'published' | 'closed'): boolean;
export function deleteForm(id: number): void;

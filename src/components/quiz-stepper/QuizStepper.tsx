import type { FormDetail } from '../../lib/types';
import { TYPE_LABELS } from '../type-labels/type-labels';
import QuizField from '../quiz-field/QuizField';
import QuizNav from '../quiz-nav/QuizNav';
import QuizProgress from '../quiz-progress/QuizProgress';
import { useQuiz } from './use-quiz';
import { useQuizKeys } from './use-quiz-keys';

export default function QuizStepper({ form }: { form: FormDetail }) {
  const quiz = useQuiz(form);
  useQuizKeys(quiz);
  const { question, questions: visible, index, answers, errors, busy, info, titleRef, isLast } =
    quiz;

  if (!question) {
    return (
      <div className="page-shell flex min-h-[100dvh] items-center py-16">
        <p className="lede">Form này chưa có câu hỏi.</p>
      </div>
    );
  }

  const error = errors[String(question.id)] ?? errors[question.id];
  const value = answers[String(question.id)] ?? answers[question.id];
  return (
    <div className="flex min-h-[100dvh] flex-col" aria-busy={busy}>
      <QuizProgress now={index + 1} max={visible.length} />
      <div className="page-shell mx-auto flex w-full max-w-2xl flex-1 flex-col py-6 sm:py-10">
        <div className="flex items-center justify-between">
          <p className="font-headline text-xs font-bold tracking-[0.24em] text-[var(--muted-foreground)] uppercase">
            Câu {index + 1} / {visible.length}
          </p>
          <span className="font-mono text-xs text-[var(--muted-foreground)]">
            {Math.round(((index + 1) / visible.length) * 100)}%
          </span>
        </div>
        <div aria-live="polite" className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{TYPE_LABELS[question.type]}</span>
            {question.required ? (
              <span className="rounded bg-[color-mix(in_srgb,var(--tad-red)_12%,var(--card))] px-2 py-0.5 font-headline text-[10px] font-extrabold uppercase text-[var(--tad-red-deep)]">
                Bắt buộc
              </span>
            ) : (
              <span className="text-xs text-[var(--muted-foreground)]">(Không bắt buộc)</span>
            )}
          </div>
          <h2
            id="quiz-step-title"
            ref={titleRef}
            tabIndex={-1}
            className="mt-3 font-headline text-xl font-extrabold break-words text-[var(--tad-ink)] focus:outline-none sm:text-2xl md:text-3xl"
          >
            {question.label}
          </h2>
          {question.description ? (
            <p className="lede mt-2 break-words text-sm sm:text-base">{question.description}</p>
          ) : null}
          <div className="mt-6 sm:mt-8">
            <QuizField
              question={question}
              value={value}
              error={error}
              onChange={(next) => quiz.setAnswer(question.id, next)}
            />
          </div>
        </div>
        {info ? (
          <p className="field-error mt-4" role="status">
            {info}
          </p>
        ) : null}
        <QuizNav
          isFirst={index === 0}
          isLast={isLast}
          busy={busy}
          isTextarea={question.type === 'textarea'}
          onBack={quiz.back}
          onNext={() => quiz.next()}
        />
      </div>
    </div>
  );
}

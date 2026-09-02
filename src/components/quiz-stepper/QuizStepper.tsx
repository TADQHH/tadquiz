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
  const { question, questions, index, answers, errors, busy, info, titleRef, isLast } = quiz;

  if (!question) {
    return (
      <div className="page-shell flex min-h-[100dvh] items-center py-16">
        <p className="lede">Form này chưa có câu hỏi.</p>
      </div>
    );
  }

  const required = question.required ? ' · Bắt buộc' : '';
  const error = errors[String(question.id)] ?? errors[question.id];
  const value = answers[String(question.id)] ?? answers[question.id];

  return (
    <div className="flex min-h-[100dvh] flex-col" aria-busy={busy}>
      <QuizProgress now={index + 1} max={questions.length} />
      <div className="page-shell mx-auto flex w-full max-w-2xl flex-1 flex-col py-10">
        <p className="font-headline tracking-[0.28em] text-[var(--muted-foreground)] uppercase">
          Câu {index + 1} / {questions.length}
        </p>
        <div aria-live="polite">
          <p className="eyebrow mt-6">
            {TYPE_LABELS[question.type]}
            {required}
          </p>
          <h2
            id="quiz-step-title"
            ref={titleRef}
            tabIndex={-1}
            className="mt-3 font-headline text-2xl font-extrabold focus:outline-none md:text-3xl"
          >
            {question.label}
          </h2>
          {question.description ? <p className="lede">{question.description}</p> : null}
          <div className="mt-8">
            <QuizField
              question={question}
              value={value}
              error={error}
              onChange={(next) => quiz.setAnswer(question.id, next)}
            />
          </div>
        </div>
        {info ? (
          <p className="field-error" role="status">
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

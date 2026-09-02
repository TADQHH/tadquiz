import type { AnswerValue, Question } from '../../lib/types';
import FieldChoice from '../field-choice/FieldChoice';
import FieldRating from '../field-rating/FieldRating';
import FieldText from '../field-text/FieldText';
import FieldTextarea from '../field-textarea/FieldTextarea';

type Props = {
  question: Question;
  value: AnswerValue | undefined;
  error?: string;
  onChange: (value: AnswerValue) => void;
};

export default function QuizField({ question, value, error, onChange }: Props) {
  const id = `q-${question.id}`;
  const labelledBy = 'quiz-step-title';
  if (question.type === 'text') {
    return (
      <FieldText
        id={id}
        labelledBy={labelledBy}
        value={typeof value === 'string' ? value : ''}
        maxChars={question.maxChars}
        error={error}
        onChange={onChange}
      />
    );
  }
  if (question.type === 'textarea') {
    return (
      <FieldTextarea
        id={id}
        labelledBy={labelledBy}
        value={typeof value === 'string' ? value : ''}
        maxChars={question.maxChars}
        error={error}
        onChange={onChange}
      />
    );
  }
  if (question.type === 'rating') {
    return (
      <FieldRating
        name={id}
        labelledBy={labelledBy}
        value={typeof value === 'number' ? value : undefined}
        error={error}
        onChange={onChange}
      />
    );
  }
  return (
    <FieldChoice
      name={id}
      labelledBy={labelledBy}
      options={question.options}
      multiple={question.type === 'multi_choice'}
      value={Array.isArray(value) ? value : typeof value === 'string' ? value : ''}
      error={error}
      onChange={onChange}
    />
  );
}

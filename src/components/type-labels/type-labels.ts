import type { QuestionType } from '../../lib/types';

export const TYPE_LABELS: Record<QuestionType, string> = {
  text: 'Câu trả lời ngắn',
  textarea: 'Đoạn văn',
  single_choice: 'Chọn một đáp án',
  multi_choice: 'Chọn nhiều đáp án',
  rating: 'Đánh giá 1–5',
};

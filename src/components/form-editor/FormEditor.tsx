import { useState } from 'react';
import type { FormDetail } from '../../lib/types';
import ConfirmDialog from '../confirm-dialog/ConfirmDialog';
import { IconPlus } from '../icons/Icons';
import MetaPanel from './MetaPanel';
import QuestionBlock from './QuestionBlock';
import { useFormEditor } from './use-form-editor';

export default function FormEditor({ form }: { form: FormDetail }) {
  const editor = useFormEditor(form);
  const [confirm, setConfirm] = useState<null | 'form' | number>(null);

  return (
    <div className="page-shell py-8 lg:grid lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-8">
        {editor.error ? (
          <p className="field-error mb-4" role="alert">
            {editor.error}
          </p>
        ) : null}
        {editor.saved ? (
          <p className="mb-4 font-bold" role="status">
            Đã lưu ✓
          </p>
        ) : null}
        <div className="space-y-4">
          {editor.questions.map((question, index) => (
            <QuestionBlock
              key={question.key}
              index={index}
              total={editor.questions.length}
              question={question}
              earlier={editor.questions.slice(0, index)}
              onChange={(next) =>
                editor.setQuestions((prev) => prev.map((item, i) => (i === index ? next : item)))
              }
              onMove={(dir) => editor.move(index, dir)}
              onRemove={() => setConfirm(index)}
            />
          ))}
        </div>
        <button type="button" className="btn-dashed mt-4" onClick={editor.addQuestion}>
          <IconPlus className="mr-2 h-4 w-4" />
          Thêm câu hỏi
        </button>
      </div>
      <div className="mt-8 lg:col-span-4 lg:mt-0">
        <MetaPanel
          title={editor.title}
          slug={editor.slug}
          description={editor.description}
          completionUrl={editor.completionUrl}
          responseLimit={editor.responseLimit}
          responseCount={form.responseCount}
          status={editor.status}
          slugError={editor.slugError}
          dirty={editor.dirty}
          saving={editor.saving}
          onTitle={editor.setTitle}
          onSlug={editor.setSlug}
          onDescription={editor.setDescription}
          onCompletionUrl={editor.setCompletionUrl}
          onResponseLimit={editor.setResponseLimit}
          onSave={() => void editor.save()}
          onStatus={() => void editor.changeStatus()}
          onDelete={() => setConfirm('form')}
        />
      </div>
      <ConfirmDialog
        open={confirm != null}
        title={confirm === 'form' ? 'Xóa form?' : 'Xóa câu hỏi?'}
        message={
          confirm === 'form'
            ? 'Xóa form và toàn bộ phản hồi? Không hoàn tác được.'
            : 'Xóa câu hỏi này khỏi form?'
        }
        confirmLabel="Xóa"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === 'form') void editor.removeForm();
          else if (typeof confirm === 'number') editor.removeQuestion(confirm);
          setConfirm(null);
        }}
      />
    </div>
  );
}

/** Shared row mappers for the forms/questions tables. */

export function rowToQuestion(row) {
  return {
    id: row.id,
    formId: row.form_id,
    key: row.key,
    type: row.type,
    label: row.label,
    description: row.description,
    options: JSON.parse(row.options),
    required: row.required === 1,
    position: row.position,
    maxChars: row.max_chars === null ? null : row.max_chars,
    logic: row.logic ? JSON.parse(row.logic) : null,
  };
}

export function rowToForm(row, questions = []) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    status: row.status,
    responseLimit: row.response_limit ?? null,
    responseCount: row.response_count ?? 0,
    questionCount: row.question_count ?? questions.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    grist: {
      docId: row.grist_doc_id ?? null,
      tableId: row.grist_table_id ?? null,
      url: row.grist_url ?? null,
      syncedResponseId: row.grist_synced_response_id ?? 0,
    },
    questions,
  };
}

/** Grist linkage persistence for forms. */
import { getDb } from './client.mjs';

export function updateFormGrist(id, grist) {
  getDb()
    .prepare(
      `UPDATE forms SET grist_doc_id = ?, grist_table_id = ?, grist_url = ?, grist_synced_response_id = ? WHERE id = ?`,
    )
    .run(
      grist.docId ?? null,
      grist.tableId ?? null,
      grist.url ?? null,
      grist.syncedResponseId ?? 0,
      id,
    );
}

export function markGristSynced(formId, responseId) {
  getDb()
    .prepare('UPDATE forms SET grist_synced_response_id = ? WHERE id = ?')
    .run(responseId, formId);
}

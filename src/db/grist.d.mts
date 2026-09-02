export interface FormGrist {
  docId: string | null;
  tableId: string | null;
  url: string | null;
  syncedResponseId: number;
}

export function updateFormGrist(id: number, grist: Partial<FormGrist>): void;
export function markGristSynced(formId: number, responseId: number): void;

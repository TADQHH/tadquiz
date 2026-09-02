import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const restore = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      restore.current = document.activeElement as HTMLElement;
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
      restore.current?.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 className="font-headline text-xl font-extrabold uppercase">{title}</h2>
      <p className="mt-3 text-[var(--muted-foreground)]">{message}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="btn-primary" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

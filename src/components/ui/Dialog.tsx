'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Fills the viewport height — used by the Digimon picker's long grid. */
  tall?: boolean;
}

/**
 * Replaces the site's SweetAlert2 usage (~40 KB) with the native <dialog>,
 * which brings focus trapping, Esc-to-close and inertness for free.
 */
export function Dialog({ open, onClose, title, children, tall }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // `close` also fires for Esc, so this is the single exit path.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      // Clicking the ::backdrop lands on the dialog element itself.
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      className={`m-auto w-[min(42rem,calc(100vw-2rem))] rounded-2xl bg-surface-raised p-0 text-content shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm ${
        tall ? 'h-[min(44rem,calc(100dvh-4rem))]' : ''
      }`}
    >
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="-mr-1.5 cursor-pointer rounded-lg p-1.5 text-content-muted transition-colors hover:bg-surface-sunken hover:text-content"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </dialog>
  );
}

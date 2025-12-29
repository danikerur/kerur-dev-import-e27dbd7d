import { useCallback, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  title?: string;
  description: string;
  type: ToastType;
}

let toastIdCounter = 1;

export function useCustomToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = toastIdCounter++;
      setToasts((current) => [...current, { ...toast, id }]);
      return id;
    },
    [],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const helpers = useMemo(
    () => ({
      success: (description: string, title?: string) =>
        showToast({ description, title, type: 'success' }),
      error: (description: string, title?: string) =>
        showToast({ description, title, type: 'error' }),
      info: (description: string, title?: string) =>
        showToast({ description, title, type: 'info' }),
    }),
    [showToast],
  );

  return {
    toasts,
    showToast,
    dismissToast,
    helpers,
  };
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex flex-col gap-3 items-end sm:items-end"
      dir="rtl"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-full max-w-sm rounded-lg border px-4 py-3 shadow-lg text-right ${
            toast.type === 'success'
              ? 'border-green-300 bg-green-50 text-green-800'
              : toast.type === 'error'
              ? 'border-red-300 bg-red-50 text-red-800'
              : 'border-blue-200 bg-blue-50 text-blue-800'
          }`}
        >
          {toast.title && <div className="mb-1 font-semibold">{toast.title}</div>}
          <div className="text-sm leading-5">{toast.description}</div>
          <button
            type="button"
            className="mt-2 text-xs underline"
            onClick={() => onDismiss(toast.id)}
          >
            סגור
          </button>
        </div>
      ))}
    </div>
  );
}

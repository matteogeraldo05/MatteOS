import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, Info, Warning, X } from '@phosphor-icons/react'
import type { ToastItem } from '../types/app'
import { registerToastPush } from '../lib/queryClient'

// ─── Context ────────────────────────────────────────────────────────────────

interface ToastCtx {
  push: (toast: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastCtx>({ push: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

// ─── ToastHost ───────────────────────────────────────────────────────────────

const ICONS = {
  success: <CheckCircle size={16} weight="regular" color="#3ecf8e" aria-hidden="true" />,
  info: <Info size={16} weight="regular" color="#9aa0b0" aria-hidden="true" />,
  danger: <Warning size={16} weight="regular" color="#ef4444" aria-hidden="true" />,
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (item.kind !== 'danger') {
      const t = setTimeout(() => onDismiss(item.id), 3000)
      return () => clearTimeout(t)
    }
  }, [item.id, item.kind, onDismiss])

  return (
    <div
      className="
        flex items-start gap-3 p-4 rounded-lg bg-bg-raised border border-border-default
        w-72 shadow-lg matteos-slide-up cursor-default
      "
      role="alert"
      aria-live="polite"
    >
      <span className="mt-0.5 flex-shrink-0">{ICONS[item.kind]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{item.title}</p>
        {item.description && (
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{item.description}</p>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(item.id)}
        className="flex-shrink-0 text-text-muted hover:text-text-primary cursor-pointer transition-colors"
      >
        <X size={14} weight="regular" aria-hidden="true" />
      </button>
    </div>
  )
}

export function ToastHost({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Register push with the query client's global error handler
  useEffect(() => {
    registerToastPush(push)
  }, [push])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      {createPortal(
        <div
          className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end sm:bottom-4 sm:right-4 bottom-0 left-0 right-0"
          aria-live="polite"
        >
          {toasts.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

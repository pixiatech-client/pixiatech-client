"use client"

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  subtitle?: string
  description?: string | React.ReactNode
  warning?: string
  cancelText?: string
  confirmText?: string
  onConfirm: () => void
  icon?: React.ReactNode
  headerColor?: string
  confirmButtonClass?: string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Confirmer',
  subtitle,
  description,
  warning,
  cancelText = 'Annuler',
  confirmText = 'Confirmer',
  onConfirm,
  icon,
  headerColor = 'bg-amber-500',
  confirmButtonClass = 'bg-amber-500 hover:bg-amber-600',
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className={`${headerColor} px-6 pt-6 pb-4 flex items-start gap-4`}>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            {icon ?? <AlertTriangle className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h3 className="text-white font-black text-lg leading-tight">{title}</h3>
            {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="px-6 py-5">
          {typeof description === 'string' ? (
            <p className="text-zinc-700 text-sm leading-relaxed">{description}</p>
          ) : (
            description
          )}
          {warning && (
            <p className="text-amber-600 text-xs mt-3 leading-relaxed font-semibold flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              {warning}
            </p>
          )}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-200 text-zinc-700 font-bold text-sm hover:bg-zinc-50 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-xl text-white font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

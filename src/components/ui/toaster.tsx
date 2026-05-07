"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertTriangle, Info } from "lucide-react"

const ToastIcon = ({ variant }: { variant?: 'default' | 'destructive' | 'success' | 'info' }) => {
  const baseClasses = "flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow-sm transition-all duration-500 overflow-hidden relative";
  
  switch (variant) {
    case 'success':
      return (
        <div className={cn(baseClasses, "bg-emerald-500/20 text-emerald-600 border border-emerald-500/20")}>
          <div className="absolute inset-0 bg-emerald-500/5 blur-sm" />
          <CheckCircle className="h-5 w-5 relative z-10" />
        </div>
      );
    case 'destructive':
      return (
        <div className={cn(baseClasses, "bg-red-500/20 text-red-600 border border-red-500/20")}>
          <div className="absolute inset-0 bg-red-500/5 blur-sm" />
          <AlertTriangle className="h-5 w-5 relative z-10" />
        </div>
      );
    case 'info':
      return (
        <div className={cn(baseClasses, "bg-blue-500/20 text-blue-600 border border-blue-500/20")}>
          <div className="absolute inset-0 bg-blue-500/5 blur-sm" />
          <Info className="h-5 w-5 relative z-10" />
        </div>
      );
    default:
      return (
        <div className={cn(baseClasses, "bg-slate-500/10 text-slate-600 border border-slate-500/10")}>
          <Info className="h-5 w-5 relative z-10" />
        </div>
      );
  }
};


export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-center gap-4 w-full">
              <ToastIcon variant={variant ?? undefined} />
              <div className="grid gap-0.5 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

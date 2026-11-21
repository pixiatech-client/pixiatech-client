'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from 'framer-motion';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                              MobileBottomSheet                             */
/* -------------------------------------------------------------------------- */

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** Poignée en haut du panneau. Active par défaut. */
  showHandle?: boolean;
  /** Autoriser la fermeture au backdrop, Échap et drag-down. */
  dismissible?: boolean;
  /** Hauteur max : 92dvh par défaut (≈ 95 % sur les petits écrans). */
  maxHeight?: string;
  tone?: 'light' | 'dark';
  ariaLabel?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Panneau mobile unique, utilisé par TOUS les menus/sélecteurs de l'app et du
 * site. Desktop reste libre d'utiliser ses propres popovers : ce composant est
 * uniquement monté sous le breakpoint mobile par les composants qui l'utilisent.
 */
export function MobileBottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  showHandle = true,
  dismissible = true,
  maxHeight = '92dvh',
  tone = 'light',
  ariaLabel,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const dragControls = useDragControls();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => setMounted(true), []);

  // Verrouille le scroll de la page sans provoquer de saut horizontal.
  useEffect(() => {
    if (!open || !mounted) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open, mounted]);

  // Focus, piège clavier, fermeture Échap et restauration du focus.
  useEffect(() => {
    if (!open || !mounted) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const frame = window.requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      (focusable?.[0] ?? panelRef.current)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown, true);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, mounted, dismissible, onClose]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!dismissible) return;
      if (info.offset.y > 96 || info.velocity.y > 520) onClose();
    },
    [dismissible, onClose],
  );

  if (!mounted) return null;

  const isDark = tone === 'dark';

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-[1190] bg-black/60 backdrop-blur-[2px]"
            onClick={dismissible ? onClose : undefined}
            aria-hidden="true"
          />
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={title && !ariaLabel ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            drag={dismissible ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={handleDragEnd}
            initial={reduceMotion ? { opacity: 0 } : { y: '100%' }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: '100%' }}
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: 'spring', damping: 28, stiffness: 280, mass: 0.9 }
            }
            style={{ maxHeight, overscrollBehavior: 'contain' }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-[1200] flex w-full flex-col overflow-hidden rounded-t-[28px] shadow-[0_-12px_48px_rgba(0,0,0,0.35)] outline-none',
              'border-t',
              isDark
                ? 'border-white/10 bg-[#0e0e0d] text-[#f5f4f0]'
                : 'border-black/5 bg-white text-gray-900',
              'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
              className,
            )}
          >
            {showHandle && (
              <div
                className="flex shrink-0 cursor-grab touch-none items-center justify-center pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 active:cursor-grabbing"
                onPointerDown={(event) => dragControls.start(event)}
                aria-hidden="true"
              >
                <span
                  className={cn('h-1.5 w-11 rounded-full', isDark ? 'bg-white/25' : 'bg-gray-300')}
                />
              </div>
            )}

            {(title || description) && (
              <div
                className={cn(
                  'flex shrink-0 items-start justify-between gap-3 px-5 pb-3',
                  showHandle ? 'pt-0' : 'pt-[max(1rem,env(safe-area-inset-top))]',
                )}
              >
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 id={titleId} className="truncate text-[17px] font-bold tracking-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id={descriptionId}
                      className={cn(
                        'mt-1 text-[12px]',
                        isDark ? 'text-white/55' : 'text-gray-500',
                      )}
                    >
                      {description}
                    </p>
                  )}
                </div>
                {dismissible && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer le panneau"
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors',
                      isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200',
                    )}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            <div
              className={cn(
                'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2',
                contentClassName,
              )}
            >
              {children}
            </div>

            {footer && (
              <div
                className={cn(
                  'shrink-0 border-t px-5 pt-3',
                  isDark ? 'border-white/10' : 'border-gray-100',
                )}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Alias historique pour les pages qui importent déjà `BottomSheet`. */
export const BottomSheet = MobileBottomSheet;

/* -------------------------------------------------------------------------- */
/*                           Détection breakpoint                              */
/* -------------------------------------------------------------------------- */

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, [breakpoint]);
  return isMobile;
}

/* -------------------------------------------------------------------------- */
/*                       Sélecteur d'options partagé                           */
/* -------------------------------------------------------------------------- */

export interface BottomSheetOption {
  value: string;
  label: React.ReactNode;
  /** Texte utilisé pour la recherche quand `label` est un ReactNode. */
  searchText?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface BottomSheetSelectProps {
  options: BottomSheetOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  title?: string;
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  leadingIcon?: React.ReactNode;
  onBlur?: () => void;
  className?: string;
  triggerClassName?: string;
  tone?: 'light' | 'dark';
  emptyLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

function OptionRows({
  options,
  selected,
  multiple,
  onToggle,
  tone,
  emptyLabel = 'Aucune option disponible',
}: {
  options: BottomSheetOption[];
  selected: string[];
  multiple: boolean;
  onToggle: (value: string) => void;
  tone: 'light' | 'dark';
  emptyLabel?: string;
}) {
  const isDark = tone === 'dark';
  if (options.length === 0) {
    return (
      <p className={cn('py-8 text-center text-sm', isDark ? 'text-white/50' : 'text-gray-500')}>
        {emptyLabel}
      </p>
    );
  }
  return (
    <div role="listbox" aria-multiselectable={multiple || undefined} className="space-y-2">
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={active}
            aria-disabled={option.disabled || undefined}
            disabled={option.disabled}
            onClick={() => onToggle(option.value)}
            className={cn(
              'flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors',
              option.disabled
                ? 'cursor-not-allowed opacity-40'
                : 'cursor-pointer active:scale-[0.99]',
              active
                ? isDark
                  ? 'border-[color:var(--ui-accent)] bg-[color:var(--ui-accent-muted)]'
                  : 'border-[color:var(--ui-accent)] bg-[color:var(--ui-accent-muted)]'
                : isDark
                  ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                  : 'border-gray-200 bg-white hover:bg-gray-50',
            )}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{option.label}</span>
              {option.description && (
                <span
                  className={cn(
                    'mt-0.5 block truncate text-xs',
                    isDark ? 'text-white/50' : 'text-gray-500',
                  )}
                >
                  {option.description}
                </span>
              )}
            </span>
            {option.badge}
            <span
              aria-hidden="true"
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center border',
                multiple ? 'rounded-md' : 'rounded-full',
                active
                  ? 'border-[color:var(--ui-accent)] bg-[color:var(--ui-accent)] text-black'
                  : isDark
                    ? 'border-white/25'
                    : 'border-gray-300',
              )}
            >
              {active && <Check className="h-4 w-4" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Sélecteur unique : desktop = menu ancré, mobile = Bottom Sheet unifié. */
export function BottomSheetSelect({
  options,
  value,
  onChange,
  title,
  label,
  placeholder = 'Sélectionner…',
  multiple = false,
  searchable = false,
  searchPlaceholder = 'Rechercher…',
  disabled = false,
  leadingIcon,
  onBlur,
  className,
  triggerClassName,
  tone = 'light',
  emptyLabel,
  confirmLabel = 'Valider',
  cancelLabel = 'Annuler',
}: BottomSheetSelectProps) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const isDark = tone === 'dark';

  const current = useMemo(
    () => (Array.isArray(value) ? value : value ? [value] : []),
    [value],
  );

  const selectedLabels = useMemo(
    () => options.filter((option) => current.includes(option.value)).map((option) => option.label),
    [options, current],
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) =>
      (option.searchText ?? String(option.label))
        .toLowerCase()
        .includes(q),
    );
  }, [options, query]);

  const open = useCallback(() => {
    if (disabled) return;
    setDraft(current);
    setQuery('');
    if (isMobile) setSheetOpen(true);
    else setDesktopOpen((prev) => !prev);
  }, [current, disabled, isMobile]);

  useEffect(() => {
    if (!desktopOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setDesktopOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDesktopOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [desktopOpen]);

  const toggleDraft = (optionValue: string) => {
    setDraft((prev) => {
      if (multiple) {
        return prev.includes(optionValue)
          ? prev.filter((item) => item !== optionValue)
          : [...prev, optionValue];
      }
      return [optionValue];
    });
    if (!multiple && isMobile) {
      onChange(optionValue);
      setSheetOpen(false);
    }
  };

  const toggleDesktop = (optionValue: string) => {
    if (multiple) {
      const next = current.includes(optionValue)
        ? current.filter((item) => item !== optionValue)
        : [...current, optionValue];
      onChange(next);
    } else {
      onChange(optionValue);
      setDesktopOpen(false);
    }
  };

  const confirm = () => {
    onChange(multiple ? draft : draft[0] ?? '');
    setSheetOpen(false);
  };

  const triggerLabel = selectedLabels.length
    ? selectedLabels.map((item) => String(item)).join(', ')
    : placeholder;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={open}
        onBlur={onBlur}
        aria-haspopup="listbox"
        aria-expanded={isMobile ? sheetOpen : desktopOpen}
        className={cn(
          'flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          isDark
            ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
            : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50',
          triggerClassName,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {leadingIcon && <span className="shrink-0 opacity-60">{leadingIcon}</span>}
          <span className="truncate">{triggerLabel}</span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', desktopOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {label && <span className="sr-only">{label}</span>}

      {desktopOpen && !isMobile && (
        <div
          className={cn(
            'absolute left-0 right-0 top-[calc(100%+6px)] z-[900] rounded-2xl border p-2 shadow-2xl',
            isDark ? 'border-white/10 bg-[#141414]' : 'border-gray-200 bg-white',
          )}
        >
          {searchable && (
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className={cn(
                  'h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none',
                  isDark ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-gray-50',
                )}
              />
            </div>
          )}
          <div className="max-h-[320px] overflow-y-auto">
            <OptionRows
              options={filteredOptions}
              selected={current}
              multiple={multiple}
              onToggle={toggleDesktop}
              tone={tone}
              emptyLabel={emptyLabel}
            />
          </div>
        </div>
      )}

      <MobileBottomSheet
        open={sheetOpen && isMobile}
        onClose={() => setSheetOpen(false)}
        title={title ?? label ?? placeholder}
        description={multiple ? 'Sélectionnez une ou plusieurs options' : undefined}
        tone={tone}
        footer={
          multiple ? (
            <div className="flex gap-2 pb-[max(0px,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className={cn(
                  'h-12 flex-1 rounded-xl border text-sm font-bold',
                  isDark ? 'border-white/15 text-white/80' : 'border-gray-200 text-gray-600',
                )}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={confirm}
                className="h-12 flex-[2] rounded-xl bg-[color:var(--ui-accent)] text-sm font-bold text-black"
              >
                {confirmLabel} {draft.length > 0 ? `(${draft.length})` : ''}
              </button>
            </div>
          ) : undefined
        }
      >
        {searchable && (
          <div className="relative mb-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              autoComplete="off"
              className={cn(
                'h-12 w-full rounded-xl border pl-10 pr-3 text-sm outline-none',
                isDark
                  ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40'
                  : 'border-gray-200 bg-gray-50 placeholder:text-gray-400',
              )}
            />
          </div>
        )}
        <OptionRows
          options={filteredOptions}
          selected={draft}
          multiple={multiple}
          onToggle={toggleDraft}
          tone={tone}
          emptyLabel={emptyLabel}
        />
      </MobileBottomSheet>
    </div>
  );
}

/** Liste d'options partagée, réutilisable par les sélecteurs natifs (Radix). */
export { OptionRows as BottomSheetOptionRows };

/* -------------------------------------------------------------------------- */
/*            Contexte facultatif : feuille impérative globale                */
/* -------------------------------------------------------------------------- */

interface SheetRequest {
  title?: React.ReactNode;
  description?: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode;
  tone?: 'light' | 'dark';
}

interface BottomSheetContextValue {
  openSheet: (request: SheetRequest) => void;
  closeSheet: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export function BottomSheetProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<SheetRequest | null>(null);
  const value = useMemo<BottomSheetContextValue>(
    () => ({
      openSheet: setRequest,
      closeSheet: () => setRequest(null),
    }),
    [],
  );

  return (
    <BottomSheetContext.Provider value={value}>
      {children}
      <MobileBottomSheet
        open={request !== null}
        onClose={() => setRequest(null)}
        title={request?.title}
        description={request?.description}
        footer={request?.footer}
        tone={request?.tone}
      >
        {request?.content}
      </MobileBottomSheet>
    </BottomSheetContext.Provider>
  );
}

export function useBottomSheet() {
  const context = useContext(BottomSheetContext);
  if (!context) throw new Error('useBottomSheet doit être utilisé dans <BottomSheetProvider>');
  return context;
}

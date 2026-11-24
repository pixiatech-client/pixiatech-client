'use client';

export type ActiveView = 'featured' | 'full';

interface HudChromeProps {
  view: ActiveView;
  hasInteracted: boolean;
  isSheetOpen: boolean;
  onSelectView: (view: ActiveView) => void;
}

export function HudChrome({
  view,
  hasInteracted,
  isSheetOpen,
  onSelectView,
}: HudChromeProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end px-6 py-5 sm:px-10 sm:py-6 transition-opacity duration-500 ${
        isSheetOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex items-end justify-between">
        <nav
          aria-label="Navigation Pixiatech"
          className="pxt-label pointer-events-auto flex items-center gap-1.5"
        >
          <button
            type="button"
            onClick={() => onSelectView('featured')}
            className={`cursor-pointer transition-opacity duration-300 hover:opacity-100 focus:outline-none ${
              view === 'featured' ? 'text-white opacity-100' : 'text-white opacity-45'
            }`}
          >
            Sélection
          </button>
          <span aria-hidden="true" className="text-white/40">
            /
          </span>
          <button
            type="button"
            onClick={() => onSelectView('full')}
            className={`cursor-pointer transition-opacity duration-300 hover:opacity-100 focus:outline-none ${
              view === 'full' ? 'text-white opacity-100' : 'text-white opacity-45'
            }`}
          >
            Tout voir
          </button>
        </nav>

        {view === 'featured' && (
          <span
            aria-hidden="true"
            className={`pxt-label hidden sm:block text-white/30 transition-opacity duration-700 ${
              hasInteracted ? 'opacity-0' : 'opacity-100'
            }`}
          >
            Défiler ou glisser
          </span>
        )}
      </div>
    </div>
  );
}

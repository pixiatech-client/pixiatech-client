import { Presentation3DSection } from './components/Presentation3DSection';

export default function App() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col">
      {/* Minimal PIXIATECH Administration Top Bar */}
      <header className="border-b border-slate-200/90 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
          <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            PIXIATECH
          </span>
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap truncate">
            Administration · Catalogue d’affichage LED
          </span>
        </div>
      </header>

      {/* Main Admin Content Viewport */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex items-start justify-center">
        <div className="w-full">
          <Presentation3DSection />
        </div>
      </main>
    </div>
  );
}

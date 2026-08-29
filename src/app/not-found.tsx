import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-4 text-center" style={{ fontFamily: 'var(--font-inter)' }}>
      <p className="font-tech text-6xl font-bold text-primary sm:text-7xl" style={{ fontFamily: 'var(--font-orbitron)' }}>
        404
      </p>
      <h1 className="mt-4 text-xl font-semibold text-foreground sm:text-2xl">
        Page introuvable
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
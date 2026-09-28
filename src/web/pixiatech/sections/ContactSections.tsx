'use client';

import { useEffect, useMemo, useState } from 'react';
import { trackFormSubmit } from '@/lib/analytics/tracker';
import { DEFAULT_PAGE_CONTENT } from '@/lib/site-web/defaultPageContent';
import type { ContactSubmissionPayload, PageContentConfig } from '@/lib/site-web/types';
import type { Language } from '../../pixiatech-translations';

/* ──────────────────────────────  Styles  ──────────────────────────────
   Repris de web.css / pixiatech.css : encre #080808, accent lime #C3F910, mono
   pour les surtitres, filets 1px, aucune couleur décorative.

   Les états :hover / :focus-visible / :active / :checked ne sont pas
   exprimables en inline style, ils vivent donc dans une feuille injectée — en
   `innerHTML` et non comme texte enfant, sinon le rendu serveur peut émettre un
   <style/> vide et l'hydratation échoue.

   Règles suivies : accent lime sur chaque survol, anneau de focus visible
   (jamais `outline: none` sans remplacement), cibles tactiles >= 44px,
   transitions 200-300ms, contrast >= 4.5:1 pour le texte des libellés, et
   uniquement des transitions de couleur / opacité / transform — aucun survol
   qui décale la mise en page.

   Les couleurs de texte / fond / filet ne sont pas écrites en dur : elles
   passent par les variables `--ct-*` que chaque section définit selon sa
   tonalité (voir TONE_DARK / TONE_LIGHT). Une seule feuille sert donc aux
   sections noires et à la section blanche.

   Le lime est en revanche écrit en hexadécimal littéral partout : `--accent`
   pouvait être redéfini à l'exécution par le CMS, ce qui rendait un chip
   sélectionné noir sur noir. Ici la couleur est non négociable. */
const CONTACT_CSS = `
.ct-input, .ct-area {
  width: 100%;
  background: var(--ct-surface);
  border: 1px solid var(--ct-line-strong);
  color: var(--ct-text);
  font-family: var(--font);
  font-size: 16px;
  line-height: 1.5;
  padding: 13px 15px;
  transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
}
.ct-input::placeholder, .ct-area::placeholder { color: var(--ct-placeholder); opacity: 1; }
.ct-input:hover, .ct-area:hover { border-color: var(--ct-line-hover); }
.ct-input:focus, .ct-area:focus {
  border-color: #C3F910;
  background: var(--ct-surface-focus);
  box-shadow: 0 0 0 3px rgba(195, 249, 16, .2);
}
.ct-input:focus-visible, .ct-area:focus-visible {
  outline: 2px solid #C3F910;
  outline-offset: 2px;
}
.ct-area { resize: vertical; min-height: 132px; }
.ct-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: .18em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ct-muted);
  margin-bottom: 8px;
}
.ct-link {
  color: var(--ct-sub);
  border-bottom: 1px solid transparent;
  transition: color .2s ease, border-color .2s ease;
}
.ct-link:hover, .ct-link:active { color: #C3F910; border-bottom-color: #C3F910; }
.ct-link:focus-visible {
  outline: 2px solid #C3F910;
  outline-offset: 2px;
}

/* Lignes de coordonnées : le libellé passe au lime au survol de la ligne. */
.ct-row-label { transition: color .2s ease; }
.ct-row:hover .ct-row-label { color: #C3F910; }

/* Titre de carte en Satoshi, comme tous les titres du site ; le mono revient
   sur la seule ligne de precision (.ct-chip-sub). */
.ct-chip {
  font-family: var(--font);
  font-size: 14.5px;
  letter-spacing: -.01em;
  text-transform: none;
  font-weight: 700;
  color: var(--ct-text);
  background: transparent;
  border: 1px solid var(--ct-line-strong);
  padding: 13px 15px;
  min-height: 44px;
  cursor: pointer;
  text-align: left;
  line-height: 1.35;
  transition: color .2s ease, border-color .2s ease, background .2s ease,
    transform .12s ease;
}
.ct-chip:hover {
  border-color: #C3F910;
  background: rgba(195, 249, 16, .12);
  color: var(--ct-text);
}
/* Élément sélectionné ou activé : lime plein, texte quasi noir. */
.ct-chip[aria-pressed='true'],
.ct-chip:active {
  background: #C3F910;
  border-color: #C3F910;
  color: #0a0a0a;
}
.ct-chip[aria-pressed='true']:hover { background: #d4ff2e; }
.ct-chip:active { transform: scale(.985); }
.ct-chip:focus-visible {
  outline: 2px solid #C3F910;
  outline-offset: 2px;
}
.ct-chip-sub {
  display: block;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: .16em;
  text-transform: uppercase;
  opacity: .72;
  margin-top: 6px;
  font-weight: 600;
}

.ct-check {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  flex: none;
  margin: 2px 0 0;
  border: 1px solid var(--ct-muted);
  background: transparent;
  display: inline-grid;
  place-content: center;
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease;
}
.ct-check:hover, .ct-check:active { border-color: #C3F910; background: rgba(195, 249, 16, .22); }
.ct-check:checked { background: #C3F910; border-color: #C3F910; }
.ct-check:checked::after {
  content: '';
  width: 8px;
  height: 4px;
  border-left: 2px solid #0a0a0a;
  border-bottom: 2px solid #0a0a0a;
  transform: rotate(-45deg) translate(1px, -2px);
}
.ct-check:focus-visible {
  outline: 2px solid #C3F910;
  outline-offset: 2px;
}

/* Boutons : primaire plein lime, secondaire transparent qui vire au lime. */
.ct-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 48px;
  padding: 14px 26px;
  font-family: var(--font);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .14em;
  text-transform: uppercase;
  border: 1px solid var(--ct-line-strong);
  background: transparent;
  color: var(--ct-text);
  cursor: pointer;
  text-decoration: none;
  transition: background .2s ease, color .2s ease, border-color .2s ease,
    box-shadow .2s ease, transform .12s ease;
}
.ct-btn:hover, .ct-btn:active {
  background: #C3F910;
  border-color: #C3F910;
  color: #0a0a0a;
  box-shadow: 0 0 0 3px rgba(195, 249, 16, .2);
}
.ct-btn:active { transform: scale(.985); }
.ct-btn:focus-visible {
  outline: 2px solid #C3F910;
  outline-offset: 3px;
}
.ct-btn:disabled {
  cursor: progress;
  opacity: .65;
  background: transparent;
  color: var(--ct-text);
  border-color: var(--ct-line-strong);
  box-shadow: none;
}
.ct-btn-solid {
  background: #C3F910;
  border-color: #C3F910;
  color: #0a0a0a;
}
.ct-btn-solid:hover {
  background: #d4ff2e;
  border-color: #d4ff2e;
  box-shadow: 0 0 0 4px rgba(195, 249, 16, .26);
}
.ct-btn-solid:disabled {
  background: rgba(195, 249, 16, .4);
  border-color: transparent;
  color: #0a0a0a;
  box-shadow: none;
}

/* FAQ : le "+" devient une pastille lime pleine au survol et à l'ouverture. */
.ct-faq-btn {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  background: none;
  border: 0;
  padding: 26px 0;
  text-align: left;
  cursor: pointer;
  color: var(--ct-text);
}
.ct-faq-q {
  font-size: clamp(17px, 1.6vw, 21px);
  font-weight: 700;
  letter-spacing: -.01em;
  line-height: 1.3;
  transition: color .2s ease;
}
.ct-faq-btn:hover .ct-faq-q { color: var(--ct-body); }
.ct-faq-plus {
  flex: none;
  display: inline-grid;
  place-content: center;
  width: 30px;
  height: 30px;
  font-size: 20px;
  line-height: 1;
  color: var(--ct-muted);
  background: transparent;
  border: 1px solid var(--ct-line);
  transition: background .2s ease, color .2s ease, border-color .2s ease,
    transform .3s ease;
}
.ct-faq-btn:hover .ct-faq-plus, .ct-faq-btn:active .ct-faq-plus {
  background: #C3F910;
  border-color: #C3F910;
  color: #0a0a0a;
}
.ct-faq-btn[aria-expanded='true'] .ct-faq-plus {
  background: #C3F910;
  border-color: #C3F910;
  color: #0a0a0a;
  transform: rotate(45deg);
}
.ct-faq-btn:focus-visible {
  outline: 2px solid #C3F910;
  outline-offset: 2px;
}

/* ── Fond mesh animé ────────────────────────────────────────────────────
   Un voile de quatre taches floutes derive lentement derriere la carte. La
   teinte vient de --mesh-1/2/3, que fixent les classes .ct-mesh-1 … .ct-mesh-6 :
   les six melanges sont des fenetres glissantes sur une meme rampe
   (lime → vert → sarcelle → cyan → bleu → violet), donc la 1re carte prend la
   1re teinte, la 2e la suivante, etc., sans jamais sortir du registre de la
   marque.

   L'animation porte sur transform et non sur background-position : le voile
   est donc rasterise une fois puis compose sur le GPU, au lieu d'etre
   re-floute a chaque image.

   L'opacite vient de --ct-mesh-op, que chaque tonalite regle (voir
   TONE_DARK / TONE_LIGHT) : lisible sans ecrire la valeur en dur, et le
   contraste du texte au-dessus reste celui de la section. */
@keyframes ct-mesh-drift {
  0%   { transform: translate3d(-5%, -4%, 0) scale(1.05); }
  50%  { transform: translate3d(6%, 5%, 0) scale(1.15); }
  100% { transform: translate3d(-3%, 6%, 0) scale(1.07); }
}
.ct-mesh {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}
.ct-mesh::before {
  content: '';
  position: absolute;
  inset: -45%;
  z-index: -1;
  pointer-events: none;
  background-image:
    radial-gradient(38% 42% at 14% 20%, var(--mesh-1, #C3F910) 0px, transparent 100%),
    radial-gradient(40% 38% at 86% 14%, var(--mesh-2, #8FE83A) 0px, transparent 100%),
    radial-gradient(42% 44% at 80% 86%, var(--mesh-3, #4AE07A) 0px, transparent 100%),
    radial-gradient(36% 40% at 18% 84%, var(--mesh-2, #8FE83A) 0px, transparent 100%);
  filter: blur(38px);
  opacity: var(--ct-mesh-op, .2);
  animation: ct-mesh-drift 28s ease-in-out infinite alternate;
  /* Le decalage evite que toutes les cartes battent a la meme phase. */
  animation-delay: calc(var(--i, 0) * -4.6s);
  will-change: transform;
}
.ct-mesh-1 { --mesh-1: #C3F910; --mesh-2: #8FE83A; --mesh-3: #4AE07A; }
.ct-mesh-2 { --mesh-1: #8FE83A; --mesh-2: #4AE07A; --mesh-3: #22C9A8; }
.ct-mesh-3 { --mesh-1: #4AE07A; --mesh-2: #22C9A8; --mesh-3: #2BB6E0; }
.ct-mesh-4 { --mesh-1: #22C9A8; --mesh-2: #2BB6E0; --mesh-3: #4A8CE8; }
.ct-mesh-5 { --mesh-1: #2BB6E0; --mesh-2: #4A8CE8; --mesh-3: #7A70FF; }
.ct-mesh-6 { --mesh-1: #4A8CE8; --mesh-2: #7A70FF; --mesh-3: #A96BFF; }

/* Grande surface (hero, carte du formulaire) : l'opacite baisse sur son seul
   voile, sans toucher a --ct-mesh-op — sinon elle herriterait dans les cartes
   imbriquees (chips du formulaire) qui doivent garder leur tonalite. */
.ct-mesh.ct-mesh--faint::before { opacity: .07; }
/* Carte selectionnee : le lime plein est deja la couleur, le voile s'eteint. */
.ct-chip[aria-pressed='true'] { --ct-mesh-op: 0; }

@media (min-width: 768px) {
  .ct-input, .ct-area { font-size: 15px; }
}
@media (prefers-reduced-motion: reduce) {
  .ct-input, .ct-area, .ct-chip, .ct-link, .ct-check, .ct-btn,
  .ct-faq-q, .ct-faq-plus, .ct-row-label { transition: none; }
  .ct-chip:active, .ct-btn:active, .ct-faq-btn[aria-expanded='true'] .ct-faq-plus { transform: none; }
  .ct-mesh::before { animation: none; }
}
`;

/* Tonalités : une section = un jeu de `--ct-*`. Le lime, lui, ne change pas. */
type Tone = React.CSSProperties & Record<'--ct-text' | '--ct-body' | '--ct-sub' | '--ct-muted' | '--ct-line' | '--ct-line-strong' | '--ct-line-hover' | '--ct-surface' | '--ct-surface-focus' | '--ct-placeholder' | '--ct-error' | '--ct-accent' | '--ct-mesh-op', string>;

const TONE_DARK: Tone = {
  '--ct-text': 'var(--dark-text, #f5f4f0)',
  '--ct-body': 'var(--dark-body, #a3a3a3)',
  '--ct-sub': 'var(--dark-text-2, #c9c7c1)',
  '--ct-muted': '#8a8880',
  '--ct-line': 'var(--dark-line-2, #161615)',
  '--ct-line-strong': 'var(--dark-line, #1f1f1f)',
  '--ct-line-hover': '#3a3a3a',
  '--ct-surface': 'transparent',
  '--ct-surface-focus': 'rgba(195, 249, 16, .06)',
  '--ct-placeholder': '#7a7a76',
  '--ct-error': '#ffb3a4',
  '--ct-accent': '#C3F910',
  /* Sur le noir le voile peut monter : le texte clair garde son contraste. */
  '--ct-mesh-op': '.24',
};

const TONE_LIGHT: Tone = {
  '--ct-text': 'var(--ink, #111110)',
  '--ct-body': 'var(--body, #4a4a46)',
  '--ct-sub': 'var(--muted-2, #6b6a66)',
  '--ct-muted': 'var(--muted-2, #6b6a66)',
  '--ct-line': 'var(--line, #dad8d2)',
  '--ct-line-strong': 'var(--line-2, #e2e0da)',
  '--ct-line-hover': '#c9c7c2',
  '--ct-surface': 'var(--paper-2, #fff)',
  '--ct-surface-focus': 'rgba(195, 249, 16, .05)',
  '--ct-placeholder': 'var(--muted-2, #6b6a66)',
  '--ct-error': '#a3271b',
  '--ct-accent': 'var(--ink, #111110)',
  /* Sur le papier le voile reste un lavis : l'encre garde ses 4.5:1. */
  '--ct-mesh-op': '.18',
};

/* Lime : hexadécimal littéral, jamais `var(--accent)`. Le CMS peut redéfinir
   `--accent` à l'exécution, ce qui rendait les chips sélectionnés illisibles
   (noir sur noir). Ici la couleur est fixe. */
const ACCENT = '#C3F910';

/* Le lime n'est lisible qu'en fond ou en texte sur fond noir (15:1). Sur le
   papier il tombe à 1.5:1 : sur section blanche, l'accent en texte devient
   donc l'encre du site. `--ct-accent` est le pendant "côté texte" du lime. */
const ACCENT_TEXT = 'var(--ct-accent)';

/* Six melanges = six fenetres sur une rampe unique. `mesh()` donne a la carte
   d'index `i` le melange `i`, en rebouclant si le CMS en ajoute davantage :
   la 1re carte prend la 1re teinte, la 2e la suivante, etc. `meshVars()`
   fournit le `--i` qui decale la phase de l'animation d'une carte a l'autre. */
const MESH_COUNT = 6;

const mesh = (i: number) => `ct-mesh ct-mesh-${(i % MESH_COUNT) + 1}`;

const meshVars = (i: number) => ({ '--i': String(i) }) as React.CSSProperties;

/* Les couleurs de texte, de fond et de filet vivent dans les variables
   `--ct-*` définies par la tonalité de chaque section (TONE_DARK /
   TONE_LIGHT). On garde des alias pour ne pas répéter `var(--ct-…)` partout. */
const DARK_TEXT = 'var(--ct-text)';
const DARK_BODY = 'var(--ct-body)';
const DARK_TEXT_2 = 'var(--ct-sub)';
const DARK_MUTED = 'var(--ct-muted)';
const DARK_LINE_2 = 'var(--ct-line)';
const DARK_LINE = 'var(--ct-line-strong)';
const DARK_SURFACE = 'var(--ct-surface)';
const ERROR_TEXT = 'var(--ct-error)';

const eyebrowDark: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '.24em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-mono)',
  fontWeight: 700,
  color: DARK_MUTED,
  marginBottom: 28,
};

const mapsUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

const digits = (value: string) => value.replace(/[^0-9]/g, '');

/* ──────────────────────────────  Primitives  ────────────────────────────── */

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="ct-row"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(120px, 168px) 1fr',
        gap: '8px 24px',
        padding: '18px 0',
        borderTop: `1px solid ${DARK_LINE_2}`,
        alignItems: 'start',
      }}
    >
      <span
        className="ct-row-label"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: DARK_MUTED,
          paddingTop: 2,
        }}
      >
        {label}
      </span>
      <div style={{ fontSize: 15, lineHeight: 1.55, color: DARK_TEXT_2 }}>{children}</div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="ct-label" htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        id={id}
        name={id}
        className="ct-input"
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  href,
  type = 'button',
  disabled,
  variant = 'ghost',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'ghost' | 'solid';
}) {
  // `solid` = action primaire : lime plein dès l'état de repos, parce que le
  // site reserve l'accent à l'action retenue. `ghost` vire au lime au survol
  // comme à l'activation.
  const className = variant === 'solid' ? 'ct-btn ct-btn-solid' : 'ct-btn';

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}

/* ──────────────────────────────  Formulaire  ────────────────────────────── */

function ContactFormCard({
  form,
  visibility,
  lang,
}: {
  form: PageContentConfig['form'];
  visibility: PageContentConfig['visibility'];
  lang: Language;
}) {
  const categories = useMemo(() => (form.categories ?? []).filter((c) => c.visible), [form.categories]);

  // `null` = l'utilisateur n'a rien choisi : on suit alors la première catégorie
  // visible, y compris quand le contenu CMS arrive après le premier rendu.
  const [picked, setPicked] = useState<string | null>(null);
  const projectType = picked ?? categories[0]?.title ?? 'Autre';

  const [fields, setFields] = useState({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const set = (key: keyof typeof fields) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const empty = { name: '', email: '', phone: '', company: '', subject: '', message: '' };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setError(null);
    setSending(true);

    const payload: ContactSubmissionPayload = { ...fields, projectType, consent };

    try {
      const response = await fetch('/api/site-web/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Erreur lors de l'envoi de votre demande.");
      }
      trackFormSubmit();
      setSent(result.message ?? 'Votre demande a bien été enregistrée.');
      setFields(empty);
      setConsent(false);
      setPicked(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setSending(false);
    }
  }

  if (!visibility.contactFormCard) return null;

  if (sent) {
    return (
      <div
        className="ct-mesh ct-mesh-1 ct-mesh--faint"
        style={{
          ...meshVars(0),
          border: `1px solid ${ACCENT}`,
          background: 'rgba(195, 249, 16, .04)',
          padding: 'clamp(28px, 4vw, 48px)',
        }}
      >
        <div style={{ ...eyebrowDark, marginBottom: 18, color: ACCENT_TEXT }}>
          {lang === 'FR' ? 'Demande envoyée' : 'Request sent'}
        </div>
        <h3 className="display" style={{ margin: 0, color: DARK_TEXT, fontSize: 'clamp(26px, 3vw, 40px)' }}>
          {lang === 'FR' ? 'Merci, votre demande est partie.' : 'Thanks, your request is on its way.'}
        </h3>
        <p style={{ margin: '20px 0 0', color: DARK_BODY, fontSize: 15.5, lineHeight: 1.6, maxWidth: 520 }}>{sent}</p>
        <p style={{ margin: '14px 0 0', color: DARK_MUTED, fontSize: 13, lineHeight: 1.6 }}>
          {lang === 'FR'
            ? `Technologie déclarée : ${projectType}`
            : `Declared technology: ${projectType}`}
        </p>
        <div style={{ marginTop: 30 }}>
          <ActionButton onClick={() => setSent(null)}>
            {lang === 'FR' ? 'Envoyer une autre demande' : 'Send another request'}
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ct-mesh ct-mesh-1 ct-mesh--faint"
      style={{
        ...meshVars(0),
        border: `1px solid ${DARK_LINE_2}`,
        background: DARK_SURFACE,
        padding: 'clamp(24px, 3.4vw, 44px)',
      }}
    >
      <div style={eyebrowDark}>{form.badge}</div>
      <h3 className="display" style={{ margin: 0, color: DARK_TEXT, fontSize: 'clamp(24px, 2.6vw, 34px)' }}>
        {form.title}
      </h3>
      <p style={{ margin: '16px 0 0', color: DARK_BODY, fontSize: 15, lineHeight: 1.6, maxWidth: 560 }}>
        {form.subtitle}
      </p>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 26,
            padding: '14px 16px',
            border: '1px solid #ff6b57',
            background: 'rgba(255, 107, 87, .08)',
            color: ERROR_TEXT,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      {visibility.formCategorySelection && categories.length > 0 && (
        <fieldset style={{ border: 0, padding: 0, margin: '30px 0 0' }}>
          <legend className="ct-label" style={{ marginBottom: 12 }}>
            {form.step1Title}
          </legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            {categories.map((cat, i) => {
              const active = cat.title === projectType;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`ct-chip ${mesh(i)}`}
                  style={meshVars(i)}
                  aria-pressed={active}
                  onClick={() => setPicked(cat.title)}
                >
                  {cat.title}
                  <span className="ct-chip-sub">{cat.tag}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginTop: 30 }}>
        <Field
          id="ct-name"
          label={lang === 'FR' ? 'Nom complet' : 'Full name'}
          value={fields.name}
          onChange={set('name')}
          placeholder="ex. Alexandre Bernard"
          required
          autoComplete="name"
        />
        <Field
          id="ct-email"
          label={lang === 'FR' ? 'Email professionnel' : 'Work email'}
          type="email"
          value={fields.email}
          onChange={set('email')}
          placeholder="contact@entreprise.fr"
          required
          autoComplete="email"
        />
        {visibility.formPhoneField && (
          <Field
            id="ct-phone"
            label={lang === 'FR' ? 'Téléphone' : 'Phone'}
            type="tel"
            value={fields.phone}
            onChange={set('phone')}
            placeholder="+33 6 00 00 00 00"
            autoComplete="tel"
          />
        )}
        {visibility.formCompanyField && (
          <Field
            id="ct-company"
            label={lang === 'FR' ? 'Entreprise / Organisation' : 'Company'}
            value={fields.company}
            onChange={set('company')}
            placeholder="Nom de la société"
            autoComplete="organization"
          />
        )}
        {visibility.formSubjectField && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Field
              id="ct-subject"
              label={lang === 'FR' ? 'Objet' : 'Subject'}
              value={fields.subject}
              onChange={set('subject')}
              placeholder={lang === 'FR' ? 'ex. Écran vitrine 3m × 2m en boutique' : 'ex. 3m × 2m shopfront display'}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <label className="ct-label" htmlFor="ct-message">
          {form.step3Title}
        </label>
        <textarea
          id="ct-message"
          name="message"
          className="ct-area"
          rows={5}
          required
          value={fields.message}
          onChange={(e) => set('message')(e.target.value)}
          placeholder={
            lang === 'FR'
              ? 'Dimensions prévues, environnement (intérieur / vitrine / extérieur), ville d’installation, planning souhaité…'
              : 'Expected dimensions, environment (indoor / shopfront / outdoor), city, target timeline…'
          }
        />
      </div>

      <label
        htmlFor="ct-consent"
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          marginTop: 22,
          color: DARK_TEXT_2,
          fontSize: 13,
          lineHeight: 1.55,
          cursor: 'pointer',
        }}
      >
        <input
          id="ct-consent"
          name="consent"
          type="checkbox"
          className="ct-check"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          {lang === 'FR' ? (
            <>
              J’accepte que PIXIATECH traite mes informations dans le cadre de ma demande de devis et
              d’échange technique, conformément à la{' '}
              <a href="/web/politique-confidentialite" className="ct-link">
                politique de confidentialité
              </a>
              .
            </>
          ) : (
            <>
              I agree that PIXIATECH processes my information for the purpose of my quote and technical
              enquiry, in accordance with the{' '}
              <a href="/web/politique-confidentialite" className="ct-link">
                privacy policy
              </a>
              .
            </>
          )}
        </span>
      </label>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, marginTop: 30 }}>
        <ActionButton type="submit" disabled={sending} variant="solid">
          {sending
            ? lang === 'FR'
              ? 'Transmission…'
              : 'Sending…'
            : form.submitButtonText}
          {!sending && <span aria-hidden="true">→</span>}
        </ActionButton>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: DARK_MUTED,
          }}
        >
          {form.trustReassuranceText}
        </span>
      </div>
    </form>
  );
}

/* ──────────────────────────────  FAQ  ────────────────────────────── */

function FaqList({ faq }: { faq: PageContentConfig['faq'] }) {
  const items = useMemo(() => (faq.items ?? []).filter((i) => i.visible), [faq.items]);
  // `undefined` = l'utilisateur n'a encore rien choisi : on affiche alors le
  // premier item, y compris quand le contenu CMS arrive après le premier rendu.
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const open = picked === undefined ? items[0]?.id ?? null : picked;
  const toggle = (id: string) => setPicked(open === id ? null : id);

  if (!items.length) return null;

  return (
    <div style={{ borderTop: `1px solid ${DARK_LINE_2}` }}>
      {items.map((item) => {
        const expanded = open === item.id;
        return (
          <div key={item.id} style={{ borderBottom: `1px solid ${DARK_LINE_2}` }}>
            <button
              type="button"
              className="ct-faq-btn"
              aria-expanded={expanded}
              aria-controls={`ct-faq-panel-${item.id}`}
              onClick={() => toggle(item.id)}
            >
              <span>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    letterSpacing: '.18em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: DARK_MUTED,
                    marginBottom: 10,
                  }}
                >
                  {item.category}
                </span>
                <span className="ct-faq-q">{item.question}</span>
              </span>
              <span className="ct-faq-plus" aria-hidden="true">
                +
              </span>
            </button>
            {expanded && (
              <div
                id={`ct-faq-panel-${item.id}`}
                style={{ padding: '0 0 28px', maxWidth: 760, color: DARK_BODY, fontSize: 15.5, lineHeight: 1.65 }}
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────  Sections  ────────────────────────────── */

export function ContactSections({ lang }: { lang: Language }) {
  const [content, setContent] = useState<PageContentConfig>(DEFAULT_PAGE_CONTENT);

  useEffect(() => {
    let alive = true;
    fetch('/api/site-web/contact/page-content')
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        const incoming = body?.data as PageContentConfig | undefined;
        if (!alive || !body?.success || !incoming) return;
        setContent((prev) => ({
          ...prev,
          ...incoming,
          visibility: { ...prev.visibility, ...incoming.visibility },
          hero: { ...prev.hero, ...incoming.hero },
          info: { ...prev.info, ...incoming.info },
          form: { ...prev.form, ...incoming.form },
          faq: { ...prev.faq, ...incoming.faq },
        }));
      })
      .catch(() => {
        /* Le contenu par défaut reste affiché : la page ne dépend pas du réseau. */
      });
    return () => {
      alive = false;
    };
  }, []);

  const { hero, info, form, faq, visibility } = content;
  const scrollToForm = () =>
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const stats = [hero.stat1Text, hero.stat2Text, hero.stat3Text].filter(Boolean);
  const whatsappHref = `https://wa.me/${digits(info.whatsappNumber)}?text=${encodeURIComponent(
    "Bonjour PIXIATECH, je souhaite échanger sur un projet d'affichage / écran LED.",
  )}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CONTACT_CSS }} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        id="contact"
        className="theme-dark ct-mesh ct-mesh-1"
        style={{
          ...TONE_DARK,
          ...meshVars(0),
          position: 'relative',
          background: 'var(--black, #080808)',
          padding: 'calc(var(--nav-h) + clamp(48px, 7vh, 92px)) 0 clamp(64px, 8vh, 104px)',
        }}
      >
        <div className="wrap">
          {visibility.heroBadge && (
            <div style={eyebrowDark}>
              {lang === 'FR' ? 'PIXIATECH / CONTACT' : 'PIXIATECH / CONTACT'}
            </div>
          )}
          {visibility.heroTitle && (
            <h1 className="display" style={{ margin: 0, color: DARK_TEXT, maxWidth: 1020 }}>
              {hero.titleLine1}
              {hero.titleHighlight && (
                <>
                  <br />
                  <span style={{ color: ACCENT }}>{hero.titleHighlight}</span>
                </>
              )}
            </h1>
          )}
          {visibility.heroSubtitle && (
            <p
              className="lede"
              data-reveal="true"
              style={{ margin: '30px 0 0', maxWidth: 660, color: DARK_BODY, fontSize: 17, lineHeight: 1.62 }}
            >
              {hero.subtitle}
            </p>
          )}

          {visibility.heroStatsPills && stats.length > 0 && (
            <div
              data-reveal="true"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '14px 44px',
                marginTop: 48,
                paddingTop: 26,
                borderTop: `1px solid ${DARK_LINE}`,
              }}
            >
              {stats.map((stat) => (
                <span
                  key={stat}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: DARK_TEXT_2,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ width: 14, height: 2, background: ACCENT, flex: 'none' }}
                  />
                  {stat}
                </span>
              ))}
            </div>
          )}

          {visibility.heroCtaButton && (
            <div style={{ marginTop: 38 }}>
              <ActionButton onClick={scrollToForm}>
                {hero.ctaButtonText}
                <span aria-hidden="true">↓</span>
              </ActionButton>
            </div>
          )}
        </div>
      </section>

      {/* ── Coordonnées + formulaire ─────────────────────────────
          Section blanche : c'est le rythme noir → blanc → noir demandé, et ça
          donne au formulaire le même contraste que les pages produit du site. */}
      <section
        className="theme-light"
        style={{
          ...TONE_LIGHT,
          background: 'var(--paper, #f5f4f0)',
          padding: 'clamp(72px, 9vh, 120px) 0',
        }}
      >
        <div className="wrap">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'clamp(40px, 5vw, 88px)',
              alignItems: 'start',
            }}
          >
            {/* Colonne gauche : coordonnées */}
            {visibility.contactInfoCard && (
              <div>
                <div style={eyebrowDark}>{info.hqBadge}</div>
                <h2 className="display" style={{ margin: 0, color: DARK_TEXT, fontSize: 'clamp(26px, 2.8vw, 38px)' }}>
                  {info.hqTitle}
                </h2>
                <p style={{ margin: '18px 0 0', color: DARK_BODY, fontSize: 15, lineHeight: 1.62 }}>
                  {info.hqDesc}
                </p>

                <div style={{ marginTop: 34 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 12,
                      paddingBottom: 8,
                    }}
                  >
                    {[
                      { label: info.stat1Label, value: info.stat1Value },
                      { label: info.stat2Label, value: info.stat2Value, accent: true },
                    ].map((stat, i) => (
                      <div
                        key={stat.label}
                        className={mesh(i)}
                        style={{
                          ...meshVars(i),
                          border: `1px solid ${DARK_LINE_2}`,
                          background: 'var(--paper-2, #fff)',
                          padding: '18px 20px',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10.5,
                            letterSpacing: '.18em',
                            textTransform: 'uppercase',
                            color: DARK_MUTED,
                            marginBottom: 8,
                          }}
                        >
                          {stat.label}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: stat.accent ? ACCENT_TEXT : DARK_TEXT }}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {visibility.infoAddressRow && (
                  <InfoRow label={info.addressLabel}>
                    {info.addressValue}{' '}
                    <a
                      href={mapsUrl(info.addressValue)}
                      target="_blank"
                      rel="noreferrer"
                      className="ct-link"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {lang === 'FR' ? 'Itinéraire' : 'Directions'}
                    </a>
                  </InfoRow>
                )}
                {visibility.infoPhonesRow && (
                  <InfoRow label={info.phonesLabel}>
                    <a href={`tel:${digits(info.phone1)}`} className="ct-link">
                      {info.phone1}
                    </a>
                    {info.phone2 && (
                      <>
                        {' · '}
                        <a href={`tel:${digits(info.phone2)}`} className="ct-link">
                          {info.phone2}
                        </a>
                      </>
                    )}
                  </InfoRow>
                )}
                {visibility.infoEmailRow && (
                  <InfoRow label={info.emailLabel}>
                    <a href={`mailto:${info.emailValue}`} className="ct-link">
                      {info.emailValue}
                    </a>
                  </InfoRow>
                )}
                {visibility.infoWhatsappRow && (
                  <InfoRow label={info.whatsappLabel}>
                    <a href={whatsappHref} target="_blank" rel="noreferrer" className="ct-link">
                      {info.whatsappNumber}
                    </a>
                    <div style={{ marginTop: 6, color: DARK_MUTED, fontSize: 13.5 }}>{info.whatsappSubtext}</div>
                  </InfoRow>
                )}
                {visibility.infoWorkingHoursRow && (
                  <InfoRow label={info.hoursLabel.replace(':', '')}>
                    {info.hoursValue}
                  </InfoRow>
                )}
              </div>
            )}

            {/* Colonne droite : formulaire. Le header est fixed sur 88px, on
                décale la cible du scroll pour que rien ne passe dessous. */}
            <div id="contact-form" style={{ scrollMarginTop: 'calc(var(--nav-h) + 24px)' }}>
              <ContactFormCard form={form} visibility={visibility} lang={lang} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────
          Retour au noir pour refermer l'alternance. */}
      {visibility.faqSection && (
        <section
          id="faq"
          className="theme-dark"
          style={{ ...TONE_DARK, background: 'var(--black, #080808)', padding: 'clamp(72px, 9vh, 120px) 0' }}
        >
          <div className="wrap">
            <div style={eyebrowDark}>{faq.badge}</div>
            <h2 className="display" style={{ margin: 0, color: DARK_TEXT, maxWidth: 780 }}>
              {faq.title}
            </h2>
            <p
              data-reveal="true"
              style={{ margin: '24px 0 52px', maxWidth: 620, color: DARK_BODY, fontSize: 16.5, lineHeight: 1.62 }}
            >
              {faq.subtitle}
            </p>
            <FaqList faq={faq} />
          </div>
        </section>
      )}
    </>
  );
}

'use client';

/**
 * Registre des sections CMS rendues + suivi de l'élément sélectionné.
 *
 * 1. Clé de section
 * -----------------
 * Le problème résolu : la clé de section ne doit JAMAIS être devinée à partir
 * du DOM (`closest('section[id], div[id]')`). Un `id` de layout comme `top` ou
 * `pixia-web` n'est pas une clé de contenu et finissait par créer des sections
 * parasites (`pages.home.sections["top"]`).
 *
 * `EditableWrapper` connaît déjà la vraie clé sémantique (`sectionKey`) et
 * l'enregistre ici avec son nœud DOM. `VisualInPlaceEditor` retrouve la clé par
 * appartenance d'ancêtre — donc par une donnée transmise explicitement par le
 * parent, et non par une heuristique.
 *
 * Un bloc qui ne peut pas être enveloppé (en-tête, pied de page, ou page dont
 * l'intégration arrive plus tard) peut s'optiner explicitement avec
 * `data-cms-section="hero"`. C'est une clé réelle, saisie par le développeur :
 * ce n'est toujours pas une devinette.
 *
 * 2. Élément sélectionné
 * ----------------------
 * La barre contextuelle d'`EditableWrapper` doit piloter l'élément sur lequel
 * l'admin vient de cliquer. Les poignées DOM ne sont pas des données CMS : on
 * les garde donc dans ce module (même pattern que le registre) plutôt que dans
 * le contexte CMS.
 */

type SectionEntry = {
  node: HTMLElement;
  sectionKey: string;
};

const entries: SectionEntry[] = [];

export function registerSection(node: HTMLElement, sectionKey: string): () => void {
  const entry: SectionEntry = { node, sectionKey };
  entries.push(entry);
  return () => {
    const idx = entries.indexOf(entry);
    if (idx >= 0) entries.splice(idx, 1);
  };
}

/** Liste des sections CMS actuellement montées. */
export function getRegisteredSections(): { node: HTMLElement; sectionKey: string }[] {
  return entries.filter((e) => e.node.isConnected);
}

/**
 * Remonte l'arbre depuis `node` et renvoie la clé de la section CMS englobante
 * la plus proche. Deux sources, jamais de devinette :
 *  - un nœud enregistré par `EditableWrapper` ;
 *  - l'attribut opt-in `data-cms-section` portant une clé réelle.
 */
export function findSectionKey(node: EventTarget | null): string | null {
  let current: HTMLElement | null =
    node instanceof Node
      ? (node as HTMLElement)
      : node && 'parentElement' in node
      ? (node as HTMLElement)
      : null;

  while (current) {
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].node === current) return entries[i].sectionKey;
    }
    const explicit = current.getAttribute?.('data-cms-section');
    if (explicit) return explicit;
    current = current.parentElement || null;
  }

  return null;
}

/** Nœud racine enregistré pour une clé de section donnée. */
export function getSectionNode(sectionKey: string): HTMLElement | null {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].sectionKey === sectionKey) return entries[i].node;
  }
  return null;
}

/**
 * Clé stable d'un élément à l'intérieur de sa section.
 *
 * On privilégie les clés déjà portées par les sections (`data-element-key`,
 * `data-text-key`, `data-image-key`, `data-media-key`). Sinon on reconstruit un
 * chemin DOM déterministe (`H2:1/DIV:2/P:1`) : il est identique avant et après un
 * refresh tant que la structure de la section ne change pas — ce qui est
 * exactement le cas d'un simple rechargement de page.
 */
export function resolveElementKey(el: HTMLElement, sectionRoot: HTMLElement | null): string {
  const explicit =
    el.getAttribute('data-element-key') ||
    el.getAttribute('data-text-key') ||
    el.getAttribute('data-image-key') ||
    el.getAttribute('data-media-key');
  if (explicit) return explicit;

  const parts: string[] = [];
  let cur: HTMLElement | null = el;

  while (cur && cur !== sectionRoot && parts.length < 12) {
    const parent: HTMLElement | null = cur.parentElement;
    if (!parent) break;
    const tag = cur.tagName.toLowerCase();
    let index = 0;
    for (const child of Array.from(parent.children)) {
      if (child.tagName === cur.tagName) {
        index += 1;
        if (child === cur) break;
      }
    }
    parts.unshift(`${tag}:${index}`);
    cur = parent;
  }

  return parts.join('/') || el.tagName.toLowerCase();
}

/** Parcourt les éléments d'une section et fournit la clé stable de chacun. */
export function forEachElementInSection(
  sectionRoot: HTMLElement,
  cb: (el: HTMLElement, key: string) => void
): void {
  const walk = (el: HTMLElement, depth: number) => {
    if (depth > 14) return;
    for (const child of Array.from(el.children)) {
      const node = child as HTMLElement;
      if (node.getAttribute('data-cms-ui') || node.hasAttribute('data-cms-ignore')) continue;
      cb(node, resolveElementKey(node, sectionRoot));
      walk(node, depth + 1);
    }
  };
  walk(sectionRoot, 0);
}

// ── Élément sélectionné ──────────────────────────────────────────────────────

export type SelectedElement = {
  el: HTMLElement;
  sectionKey: string;
  elementKey: string;
  kind: 'text' | 'media';
};

let selectedElement: SelectedElement | null = null;
const listeners = new Set<() => void>();

export function getSelectedElement(): SelectedElement | null {
  return selectedElement;
}

export function setSelectedElement(next: SelectedElement | null): void {
  const same =
    (selectedElement === null && next === null) ||
    (selectedElement !== null &&
      next !== null &&
      selectedElement.el === next.el &&
      selectedElement.elementKey === next.elementKey);
  if (same) return;
  selectedElement = next;
  listeners.forEach((l) => l());
}

export function subscribeSelectedElement(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

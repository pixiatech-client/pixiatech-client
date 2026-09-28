'use client';

import { useEffect } from 'react';
import { registerSection } from './section-registry';

/**
 * Enregistre un nœud comme section CMS sans introduire de wrapper.
 *
 * Indispensable pour le header `position: fixed` et le footer : un
 * `EditableWrapper` autour du header casserait le positionnement, alors que
 * l'éditeur n'a besoin que d'une racine connue pour calculer des clés
 * d'éléments bornées et réappliquer `sections[sectionKey]._elements`.
 */
export function useRegisterCmsSection(
  ref: React.RefObject<HTMLElement>,
  sectionKey: string
): void {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    return registerSection(node, sectionKey);
  }, [ref, sectionKey]);
}

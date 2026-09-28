import { permanentRedirect } from 'next/navigation';

/**
 * La page Contact vit desormais cote site web (`/web/contact`), pour etre rendue
 * avec le meme contexte que les autres pages du site (pas de header boutique).
 * L'URL `/contact` reste un point d'entree : elle redirige en permanence, donc
 * les liens existants (header boutique,/partages) ne cassent pas.
 */
export default function ContactPage() {
  permanentRedirect('/web/contact');
}

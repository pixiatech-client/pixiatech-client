import { ContactAdmin } from './ContactAdmin';

/**
 * Back-office PixiaTech Web → Contact.
 *
 * Trois onglets : SMTP & envoi, Boîte de réception, Coordonnées publiques.
 * Les valeurs saisies dans « Coordonnées publiques » sont persistées dans
 * `siteWeb/contactInfo` et lues par la page Contact publique.
 */
export default function SiteWebContactPage() {
  return <ContactAdmin />;
}
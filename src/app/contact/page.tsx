import type { Metadata } from 'next';
import { ContactModule } from '@/app/admin/site-web/contact/ContactModule';

export const metadata: Metadata = {
  title: 'Contactez-nous | PIXIATECH',
  description: "Contactez l'équipe PIXIATECH pour vos projets d'écrans LED, devis et solutions visuelles sur-mesure.",
};

export default function ContactPage() {
  return <ContactModule isAdminPage={false} />;
}

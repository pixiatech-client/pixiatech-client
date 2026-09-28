import { SiteWebProduitsModule } from './_components/SiteWebProduitsModule';

type SiteWebProduitsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Le paramètre `?edit=<slug>` est lu ici, côté serveur, puis transmis au
 * module client : pas de `useSearchParams`, donc pas de frontière Suspense à
 * maintenir dans un composant client.
 */
export default async function SiteWebProduitsPage({ searchParams }: SiteWebProduitsPageProps) {
  const raw = (await searchParams).edit;
  const editSlug = Array.isArray(raw) ? raw[0] : raw;
  return <SiteWebProduitsModule editSlug={editSlug} />;
}

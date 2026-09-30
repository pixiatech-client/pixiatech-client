import fs from 'fs';

let failures = 0;
const check = (name, cond, extra) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${name}${extra ? ` :: ${extra}` : ''}`);
  if (!cond) failures++;
};

const read = (p) => fs.readFileSync(p, 'utf8');
const vpe = read('src/web/cms/VisualInPlaceEditor.tsx');
const ce = read('src/web/cms/contact-edit.ts');
const cs = read('src/web/pixiatech/sections/ContactSections.tsx');
const footer = read('src/web/pixiatech/PixiaFooter.tsx');
const home = read('src/web/pixiatech/HomePage.tsx');
const product = read('src/web/ProductPageTemplate.tsx');
const heroSection = read('src/web/components/HeroSection.tsx');

// ── Phase 1 : plus de faux contrôle vert ─────────────────────────────────────
check('VPE : le survol résout data-contact-key avant tout marquage',
  vpe.indexOf('const contactKey = target.getAttribute(\'data-contact-key\')') > vpe.indexOf('handleMouseOver'));
check('VPE : le survol résout la section avant tout marquage',
  vpe.indexOf('const sectionKey = getSectionKey(target)') > vpe.indexOf('const contactKey = target.getAttribute'));
check('VPE : survol image conditionné par sectionKey',
  /if \(sectionKey\) \{\s*\n\s*target\.classList\.add\('pixia-editable-img-hover'\)/.test(vpe));
check('VPE : survol texte = branche contactKey dédiée',
  /classList\.add\('pixia-editable-text-hover'\);/.test(vpe.slice(vpe.indexOf('} else if (contactKey)'), vpe.indexOf('} else if (\n        sectionKey'))));
check('VPE : survol texte section = garde sectionKey + <=3 enfants',
  /sectionKey &&\s*\n\s*target\.children\.length <= 3/.test(vpe));
const textHovers = (vpe.match(/classList\.add\('pixia-editable-text-hover'\)/g) || []).length;
check('VPE : le survol texte n\'existe que pour contact OU section (2 branches)', textHovers >= 2, `branches=${textHovers}`);

// ── Phase 1 : le clic ne s'accroche plus aux éléments non-éditables ─────────
const noSectionIdx = vpe.indexOf('if (!sectionKey) {');
const noSectionBlock = vpe.slice(noSectionIdx, vpe.indexOf('return;', noSectionIdx));
check('VPE : clic hors section rendu sans interception (aucun preventDefault)',
  noSectionIdx > -1 && !noSectionBlock.includes('preventDefault'));
check('VPE : l\'interception des liens ne survient qu\'après une section valide',
  vpe.indexOf('const clickableParent') > vpe.indexOf('if (!sectionKey) {'));
check('VPE : branche Contact avec garde anti double-édition',
  /if \(target\.isContentEditable\) \{\s*\n\s*return;/.test(vpe.slice(vpe.indexOf('if (contactKey)'), vpe.lastIndexOf('const sectionKey'))));
check('VPE : branche Contact sauvegarde via saveContactField',
  /saveContactField\(contactKey, newText\)/.test(vpe));

// ── Phase 2 : éléments Contact réellement éditables (clés réelles) ──────────
const CONTACT_KEYS = [
  'contact.hero.titleLine1',
  'contact.hero.titleHighlight',
  'contact.hero.subtitle',
  'contact.hero.ctaButtonText',
  'contact.info.addressValue',
  'contact.info.phone1',
  'contact.info.phone2',
  'contact.info.emailValue',
];
for (const key of CONTACT_KEYS) {
  check(`ContactSections déclare ${key}`, cs.includes(`data-contact-key="${key}"`));
}
check('ContactSections déclare la question FAQ (par id)',
  cs.includes('contact.faq.${item.id}.question'));
check('ContactSections déclare la réponse FAQ (par id)',
  cs.includes('contact.faq.${item.id}.answer'));

// ── Phase 2 : relecture Firestore après sauvegarde ───────────────────────────
check('ContactSections recharge sur l\'événement de sauvegarde',
  cs.includes('CONTACT_REFRESH_EVENT') && /window\.addEventListener\(CONTACT_REFRESH_EVENT, onContentSaved\)/.test(cs));
check('ContactSections re-fetch la source Firestore',
  cs.includes('fetch(\'/api/site-web/contact/page-content\')') && /let alive = true;/.test(cs));

// ── Phase 2 : helper de sauvegarde (même API que l\'admin, jamais le JSON) ───
check('contact-edit exporte saveContactField + événement',
  ce.includes('export const CONTACT_REFRESH_EVENT') && ce.includes('export async function saveContactField'));
check('contact-edit liste-blanche hero/info/faq',
  ce.includes('HERO_FIELDS') && ce.includes('INFO_FIELDS') && ce.includes('FAQ_PARTS'));
check('contact-edit lit via GET page-content', ce.includes("fetch('/api/site-web/contact/page-content', { cache: 'no-store' })"));
check('contact-edit écrit via PUT page-content', ce.includes("method: 'PUT'") && ce.includes('/api/site-web/contact/page-content'));
check('contact-edit n\'écrit JAMAIS dans le CMS JSON', !ce.includes('/api/site-web/pages'));
check('contact-edit envoie toujours une config complète (visibility+hero requis par la route)',
  ce.includes('return { ...current, hero: { ...current.hero'))

// ── Régressions : hors périmètre intact ──────────────────────────────────────
check('Footer : registration footer conservée',
  /useRegisterCmsSection\(footerRootRef, 'footer'\)/.test(footer));
check('Footer : aucun data-text-key (texte -> _elements)', !footer.includes('data-text-key'));
check('Home : wrappers + drag conservés',
  home.includes('EditableWrapper') && home.includes('SectionDragDropProvider'));
check('Produits : template wrappé + clés texte réelles conservées',
  product.includes('EditableWrapper') && heroSection.includes('data-text-key'));
check('VPE : flux sections conservé (updateSectionField / _elements)',
  vpe.includes('updateSectionField(sectionKey, explicitKey') &&
  vpe.includes('updateElementStyle(sectionKey, elementKey') &&
  vpe.includes('_elements.'));
// -- SOURCE UNIQUE DES COORDONNEES ------------------------------------------
// `siteWeb/contactInfo` est le SEUL document qui possede les VALEURS (adresse,
// telephones, e-mail, WhatsApp, horaires). `siteWeb/content` ne porte que la
// mise en forme. Ces verrous empechent le retour de la double source : la page
// affichait `content.info` pendant que le module Contact editait
// `contactInfo`, les deux divergant silencieusement.
const infoRoute = read('src/app/api/site-web/contact/page-content/route.ts');
const contactModule = read('src/app/admin/site-web/contact/ContactModule.tsx');

check('route page-content ne recopie PLUS les valeurs vers contactInfo',
  !infoRoute.includes('setContactInfo') && !infoRoute.includes('getContactInfo'));
check('route page-content importe setPageContent seul',
  /import \{ getPageContent, setPageContent \} from/.test(infoRoute));

check('ContactSections lit contactInfo (API info) et non plus content.info seul',
  cs.includes('/api/site-web/contact/info') &&
  cs.includes('contactInfo?.address') &&
  cs.includes('contactInfo?.primaryEmail'));

check('ContactSections replie sur content.info si l API est injoignable',
  cs.includes('contactInfo?.address || contentInfo.addressValue'));

check('contact-edit route les VALEURS vers /contact/info (pas vers content)',
  ce.includes('CONTACT_INFO_KEY_BY_CONTENT_KEY') &&
  ce.includes("fetch('/api/site-web/contact/info'") &&
  ce.includes('isContactInfoKey(key)'));

check('contact-edit mappe chaque valeur vers sa cle canonique ContactInfo',
  ["'contact.info.addressValue': 'address'",
   "'contact.info.phone1': 'phone1'",
   "'contact.info.phone2': 'phone2'",
   "'contact.info.emailValue': 'primaryEmail'"].every((m) => ce.includes(m)));

check('module Contact separe valeurs et presentation dans handleUpdateInfo',
  contactModule.includes('contactValues') &&
  contactModule.includes('primaryEmail') &&
  contactModule.includes('workingHours'));

check('module Contact ecrit contactInfo AVANT page-content et n annonce pas d echec a tort',
  contactModule.includes('/api/site-web/contact/info') &&
  contactModule.includes('return;'));

check('module Contact affiche les valeurs canoniques dans la carte infos',
  contactModule.includes('addressValue: contactInfo?.address') &&
  contactModule.includes('hoursValue: contactInfo?.workingHours'));


console.log(failures === 0 ? 'CMS-EDITABILITY-LOCK-PASS' : `CMS-EDITABILITY-LOCK-FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
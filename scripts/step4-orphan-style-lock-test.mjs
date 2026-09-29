import fs from 'fs';

let failures = 0;
const check = (name, cond, extra) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${name}${extra ? ` :: ${extra}` : ''}`);
  if (!cond) failures++;
};

const read = (p) => fs.readFileSync(p, 'utf8');
const panel = read('src/web/cms/SectionStylePanel.tsx');
const wrapper = read('src/web/cms/EditableWrapper.tsx');
const wrapper2 = read('src/web/cms/useSectionStyle.ts');
const home = read('src/web/pixiatech/HomePage.tsx');

function arrayOf(text, fromMarker) {
  const i = text.indexOf(fromMarker);
  if (i < 0) return null;
  const eq = text.indexOf('= [', i);
  if (eq < 0) return null;
  const j = eq + 2;
  const k = text.indexOf(']', j);
  const raw = text.slice(j + 1, k);
  return (raw.match(/'([^']+)'/g) || []).map((s) => s.slice(1, -1));
}

const spacing = arrayOf(panel, 'export const SPACING_KEYS');
const showreel = arrayOf(panel, 'export const SHOWREEL_STYLE_KEYS');
const ORPHAN_SHOWREEL = ['marginTop', 'marginBottom', 'titleFontSize', 'textColor'];

// ── Constantes de capacité du panneau ───────────────────────────────────────
check('SPACING_KEYS = padding* + minHeight', spacing && spacing.length === 5, spacing && spacing.join(','));
check('SPACING_KEYS a bien 4 paddings + minHeight', spacing && ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'minHeight'].every((k) => spacing.includes(k)));
check('SHOWREEL_STYLE_KEYS = 9 clés', showreel && showreel.length === 9, showreel && showreel.join(','));
check('SHOWREEL exclut marges/typo/couleur texte (orphelins)',
  showreel && ORPHAN_SHOWREEL.every((k) => !showreel.includes(k)));
check('SHOWREEL garde fond+voile+padding+minHeight',
  showreel && ['bgColor', 'bgImage', 'overlayOpacity', 'overlayColor', 'paddingTop', 'minHeight'].every((k) => showreel.includes(k)));

check('FULL_STYLE_KEYS = ALL_KEYS', /export const FULL_STYLE_KEYS: readonly StyleKey\[\] = ALL_KEYS;/.test(panel));
check('BGMAP_STYLE_KEYS exclut le voile', /BGMAP_STYLE_KEYS.*ALL_KEYS\.filter/.test(panel)
  && panel.indexOf(`k !== 'overlayOpacity'`) > panel.indexOf('BGMAP_STYLE_KEYS')
  && panel.indexOf(`k !== 'overlayColor'`) > panel.indexOf('BGMAP_STYLE_KEYS'));
check('BGMAP_TITLELESS_KEYS exclut aussi titleFontSize',
  /BGMAP_TITLELESS_KEYS.*ALL_KEYS\.filter/.test(panel)
  && panel.indexOf(`k !== 'titleFontSize'`) > panel.indexOf('BGMAP_TITLELESS_KEYS'));

// ── Défaut = espacement (ocalypse : plus de propriété orpheline exposée) ─────
check('Panneau : défaut capabilities = SPACING_KEYS', /capabilities = SPACING_KEYS/.test(panel));
check('Panneau : plus aucune carte globale par clé', !/SECTION_CAPABILITIES/.test(panel));

// ── EditableWrapper relaie les capacités ────────────────────────────────────
check('EditableWrapper expose styleCapabilities', /styleCapabilities\?: readonly StyleKey\[\]/.test(wrapper));
check('EditableWrapper transmet capabilities au panneau', /capabilities=\{styleCapabilities\}/.test(wrapper));

// ── useSectionStyle : plus de sortie orpheline ─────────────────────────────
check('useSectionStyle ne retourne plus bgImage (orphelin)', !/bgImage\s*;/.test(wrapper2.split('return')[0]) && !/bgImage,/.test(wrapper2.split('return')[1] || ''));
check('useSectionStyle expose bien hasOverlay + overlayColor',
  /return \{ section: sectionStyle, title: titleStyle, hasOverlay, overlayColor \};/.test(wrapper2));

// ── HomePage : capacités par section + repli pleins ───────────────────────
check('HomePage déclare les caps pour les 4 sections restreintes',
  ['hero', 'markets', 'showreel', 'experience'].every((k) => new RegExp(`${k}:`).test(home.split('HOME_SECTION_STYLE_CAPS')[1] || '')));
check('HomePage passe styleCapabilities au wrapper', /styleCapabilities=\{HOME_SECTION_STYLE_CAPS\[key\] \?\? FULL_STYLE_KEYS\}/.test(home));
check('HomePage ne passe jamais styleCapabilities={undefined} en clair', !/styleCapabilities=\{undefined\}/.test(home));

console.log(failures === 0 ? 'ORPHAN-STYLE-LOCK-PASS' : `ORPHAN-STYLE-LOCK-FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
import React from 'react';
import type { Product, ProductSpecGroup, ProductSpecModel } from '@/lib/products/types';
import { attachSectionMedia } from '@/lib/products/master-template';
import { text, specValue } from '@/lib/products/display';

interface ProductDatasheetPdfDocumentProps {
  product: Product;
  lang?: 'FR' | 'EN';
  companyName?: string;
}

/**
 * Composant de document PDF A4 multipages conforme au modèle officiel :
 * `docs/product-system/fiche-technique-modele.pdf`
 * 
 * Géométrie A4 : 794px × 1123px par page à 96 DPI (ratio exact 210mm × 297mm).
 * Rendu haute résolution capturé page par page via html2canvas (scale: 2) et assemblé en jsPDF.
 */
export const ProductDatasheetPdfDocument: React.FC<ProductDatasheetPdfDocumentProps> = ({
  product: rawProduct,
  lang = 'FR',
  companyName = 'PIXIATECH',
}) => {
  // Attachement automatique des médias conformément au template maître
  const product = attachSectionMedia(rawProduct);

  const productName = text(product.name) || text(product.hero?.title) || 'ÉCRAN GÉANT LED';
  const seriesName = text(product.series) || (lang === 'FR' ? 'SÉRIE PROFESSIONNELLE' : 'PROFESSIONAL SERIES');
  const subtitle = text(product.description?.shortFr) || text(product.hero?.subtitle) || '';
  const cleanCompanyName = (companyName || 'PIXIATECH').toUpperCase();

  // Badges Marchés
  const markets = (product.hero?.tags && product.hero.tags.length > 0)
    ? product.hero.tags.slice(0, 4)
    : [
        lang === 'FR' ? 'ARCHITECTURE' : 'ARCHITECTURE',
        lang === 'FR' ? 'RETAIL & COMMERCE' : 'RETAIL & SHOP',
        lang === 'FR' ? 'CORPORATE & EVENT' : 'CORPORATE & EVENT',
        lang === 'FR' ? 'BROADCAST & SCÈNE' : 'BROADCAST & STAGE',
      ];

  // 4 Badges clés
  const defaultBadges = [
    { label: 'PIXEL PITCH', value: product.specs?.models?.[0]?.specs?.['pitch'] ? `${product.specs.models[0].specs['pitch']} mm` : '1.2 — 3.9 mm' },
    { label: 'LUMINOSITÉ', value: product.specs?.models?.[0]?.specs?.['brightness'] ? `${product.specs.models[0].specs['brightness']} nits` : '800 — 5500 nits' },
    { label: 'FORMAT CABINET', value: product.design?.cabinetDim || '500 × 500 mm' },
    {
      label: 'ENVIRONNEMENT',
      value: product.environment === 'indoor'
        ? (lang === 'FR' ? 'INTÉRIEUR' : 'INDOOR')
        : product.environment === 'outdoor'
          ? (lang === 'FR' ? 'EXTÉRIEUR' : 'OUTDOOR')
          : (lang === 'FR' ? 'INT. & EXT.' : 'IN & OUT'),
    },
  ];

  const heroSpecs = (product.hero?.specs && product.hero.specs.length >= 4)
    ? product.hero.specs.slice(0, 4).map((s) => ({ label: s.label.toUpperCase(), value: s.value }))
    : defaultBadges;

  // Overview Data
  const overviewHook = text(product.overview?.title) || (lang === 'FR' ? 'Précision visuelle absolue et robustesse industrielle' : 'Visual accuracy and industrial reliability');
  const overviewDesc = text(product.overview?.description) || text(product.description?.detailedFr) || text(product.description?.shortFr) || (lang === 'FR' ? "Conçu pour répondre aux exigences les plus strictes des installations modernes, cet écran LED conjugue haute fidélité colorimétrique, fréquence de rafraîchissement élevée et intégration architecturale ultra-fine." : "Engineered to satisfy demanding modern display standards, combining high color accuracy, high refresh rate, and slim integration.");
  
  const stats = (product.overview?.stats && product.overview.stats.length > 0)
    ? product.overview.stats.slice(0, 3)
    : [
        { value: '3840 Hz', label: lang === 'FR' ? 'Rafraîchissement' : 'Refresh rate' },
        { value: '16:9', label: lang === 'FR' ? 'Format natif' : 'Native aspect' },
        { value: '100 000 h', label: lang === 'FR' ? 'Durée de vie LED' : 'LED Lifespan' },
      ];

  const technologies = (product.overview?.technologies && product.overview.technologies.length > 0)
    ? product.overview.technologies.slice(0, 2)
    : [
        { num: '01', title: 'ColdLED™ Technology', description: lang === 'FR' ? 'Dissipation thermique passive sans ventilateur pour un fonctionnement silencieux et durable.' : 'Passive thermal dissipation for silent and extended operation.' },
        { num: '02', title: 'UltraBlack Shield™', description: lang === 'FR' ? 'Traitement de surface antireflet offrant un contraste extrême et des noirs profonds.' : 'Anti-reflective surface treatment delivering deep blacks.' },
      ];

  // Design Data
  const designHook = text(product.design?.title) || (lang === 'FR' ? 'Châssis monobloc en aluminium moulé sous pression' : 'Die-cast aluminum monobloc chassis');
  const dims = [
    { label: 'MODULE', value: product.design?.moduleDim || '250 × 250 mm' },
    { label: 'CABINET', value: product.design?.cabinetDim || '500 × 500 mm' },
    { label: 'PROFONDEUR / POIDS', value: `${product.design?.depth || '38 mm'} · ${product.design?.weight || '6.8 kg/panneau'}` },
  ];

  const configs = (product.design?.configs && product.design.configs.length > 0)
    ? product.design.configs.slice(0, 3)
    : [
        { num: '01', title: lang === 'FR' ? 'Fixation Murale Directe' : 'Direct Wall Mount', description: lang === 'FR' ? 'Structure ultra-fine avec maintenance 100% avant sans déport.' : 'Ultra-slim structure with 100% front maintenance.' },
        { num: '02', title: lang === 'FR' ? 'Accrochage Rigging / Suspendu' : 'Suspended Rigging', description: lang === 'FR' ? 'Verrous rapides haute précision et barres de levage certifiées.' : 'High-precision quick locks and certified fly-bars.' },
        { num: '03', title: lang === 'FR' ? 'Pose Autoportante au Sol' : 'Ground Support System', description: lang === 'FR' ? 'Colonnes de renfort réglables au millimètre pour sols techniques.' : 'Adjustable base columns for quick ground setups.' },
      ];

  // Features Data (Exactement 7 features du gabarit officiel)
  const featuresHook = text(product.features?.title) || (lang === 'FR' ? '7 Points Clés d’Excellence Technologique' : '7 Key Engineering Highlights');
  const defaultFeatures = [
    { num: '01', title: 'Maintenance Frontale Totale', description: lang === 'FR' ? 'Extraction magnétique rapide des modules et de l’électronique en moins de 5 secondes.' : 'Magnetic fast extraction of modules and electronics under 5s.' },
    { num: '02', title: 'Colorimétrie HDR10+ Native', description: lang === 'FR' ? 'Gestion des nuances en 16 bits par canal pour des dégradés parfaits sans banding.' : '16-bit grayscale depth providing smooth gradients without banding.' },
    { num: '03', title: 'Redondance Signal & Alimentation', description: lang === 'FR' ? 'Double boucle réseau et double alimentation pour une diffusion sans interruption.' : 'Dual power and data loop redundancy for zero downtime.' },
    { num: '04', title: 'Haute Fréquence 3840 / 7680 Hz', description: lang === 'FR' ? 'Parfaite compatibilité avec les caméras sans effet de moiré ni scintillement.' : 'Zero scan lines and no moire effect under professional camera capture.' },
    { num: '05', title: 'Structure Ultra-Rigide CNC', description: lang === 'FR' ? 'Précision d’alignement sub-millimétrique (±0.05 mm) entre chaque cabinet.' : 'Sub-millimeter alignment precision between adjacent cabinets.' },
    { num: '06', title: 'Consommation Énergétique Éco-Active', description: lang === 'FR' ? 'Rendement énergétique optimisé réduisant la chaleur et la facture électrique de 35%.' : 'Optimized energy efficiency reducing thermal emission and power by 35%.' },
    { num: '07', title: 'Certification Industrielle Normée', description: lang === 'FR' ? 'Conforme aux normes européennes CE, CEM, LVD et classement feu certifié.' : 'Compliant with European CE, EMC, LVD and certified fire rating.' },
  ];
  const featuresList = (product.features?.items && product.features.items.length > 0)
    ? product.features.items.slice(0, 7)
    : defaultFeatures;

  // Specs Matrix Data
  const models: ProductSpecModel[] = product.specs?.models && product.specs.models.length > 0
    ? product.specs.models
    : [
        { name: 'P1.2', specs: { pitch: '1.25', brightness: '800' } },
        { name: 'P1.5', specs: { pitch: '1.56', brightness: '1000' } },
        { name: 'P1.8', specs: { pitch: '1.87', brightness: '1200' } },
        { name: 'P2.5', specs: { pitch: '2.50', brightness: '1500' } },
      ];

  const groups: ProductSpecGroup[] = product.specs?.groups && product.specs.groups.length > 0
    ? product.specs.groups
    : [
        {
          id: 'opt',
          label: lang === 'FR' ? 'OPTIQUE & VISUEL' : 'OPTICAL & VISUAL',
          rows: [
            { key: 'pitch', label: 'Pixel Pitch (mm)' },
            { key: 'ledType', label: 'Type de LED / Package' },
            { key: 'brightness', label: 'Luminosité (nits)' },
            { key: 'refresh', label: 'Fréquence de rafraîchissement (Hz)' },
            { key: 'viewAngle', label: 'Angle de vision (H / V)' },
          ],
        },
        {
          id: 'phys',
          label: lang === 'FR' ? 'MÉCANIQUE & PHYSIQUE' : 'MECHANICAL & PHYSICAL',
          rows: [
            { key: 'moduleSize', label: 'Dimensions Module (L × H mm)' },
            { key: 'cabinetSize', label: 'Dimensions Cabinet (L × H mm)' },
            { key: 'weight', label: 'Poids par m² / Panneau' },
            { key: 'service', label: 'Type de maintenance' },
          ],
        },
        {
          id: 'elec',
          label: lang === 'FR' ? 'ÉLECTRIQUE & ALIMENTATION' : 'ELECTRICAL & POWER',
          rows: [
            { key: 'powerMax', label: 'Consommation Max (W/m²)' },
            { key: 'powerAvg', label: 'Consommation Moyenne (W/m²)' },
            { key: 'voltage', label: 'Tension d’entrée' },
          ],
        },
        {
          id: 'env',
          label: lang === 'FR' ? 'ENVIRONNEMENT & FIABILITÉ' : 'ENVIRONMENT & RELIABILITY',
          rows: [
            { key: 'ipRating', label: 'Indice de protection (IP)' },
            { key: 'temperature', label: 'Température de fonctionnement' },
            { key: 'lifespan', label: 'Durée de vie typique' },
          ],
        },
      ];

  // Fieldwork Data
  const fieldworkHook = text(product.fieldwork?.title) || (lang === 'FR' ? 'Références & Déploiements Majeurs' : 'Major Reference Deployments');
  const projects = (product.fieldwork?.projects && product.fieldwork.projects.length > 0)
    ? product.fieldwork.projects.slice(0, 3)
    : [
        { title: 'Flagship Store Luxe — Paris', location: 'France · 2025', caption: lang === 'FR' ? 'Mur d’images incurvé 4K haute résolution.' : 'Curved 4K high resolution video wall.' },
        { title: 'Siège Social Groupe Bancaire — Genève', location: 'Suisse · 2024', caption: lang === 'FR' ? 'Salle du conseil et auditorium connecté.' : 'Boardroom and connected auditorium.' },
        { title: 'Centre Commercial & Retail Hub — Lyon', location: 'France · 2024', caption: lang === 'FR' ? 'Signalétique géante ultra-lumineuse.' : 'Ultra-bright architectural signage.' },
      ];

  // Photos de section
  const photoOverview = product.overview?.photo?.url || product.media?.photos?.[0]?.url || product.hero?.image;
  const photoDesign = product.design?.visuals?.[0]?.url || product.media?.photos?.[1]?.url || photoOverview;
  const photoFeatures = product.features?.visual?.url || product.media?.photos?.[2]?.url || photoOverview;

  return (
    <div
      id="pixiatech-product-pdf-root"
      style={{
        width: '794px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: '#111111',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* ==================================================================== */}
      {/* PAGE 1 : Masthead, Badges, 01 Aperçu, Début 02 Conception            */}
      {/* ==================================================================== */}
      <div
        className="page-break-after"
        style={{
          width: '794px',
          height: '1123px',
          maxHeight: '1123px',
          padding: '36px 44px',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          borderBottom: '1px solid #eaeaea',
        }}
      >
        <div>
          {/* Header officiel */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '14px',
              borderBottom: '1.5px solid #111111',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.18em', color: '#000000' }}>
                {cleanCompanyName}
              </span>
              <span style={{ fontSize: '10px', color: '#888888', fontWeight: 600 }}>|</span>
              <span style={{ fontSize: '9px', letterSpacing: '0.12em', color: '#555555', fontWeight: 700 }}>
                ENGINEERING DISPLAY SYSTEMS
              </span>
            </div>
            <div style={{ fontSize: '8.5px', letterSpacing: '0.16em', fontWeight: 700, color: '#444444' }}>
              FICHE TECHNIQUE OFFICIELLE · ÉCRAN LED
            </div>
          </div>

          {/* Masthead Produit */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '8.5px', letterSpacing: '0.2em', fontWeight: 800, color: '#666666', textTransform: 'uppercase' }}>
              {seriesName}
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', color: '#000000', margin: '4px 0 2px', textTransform: 'uppercase' }}>
              {productName}
            </h1>
            {subtitle && (
              <div style={{ fontSize: '10.5px', color: '#444444', fontWeight: 500, lineHeight: '1.35' }}>
                {subtitle}
              </div>
            )}

            {/* Badges marchés */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              {markets.map((m, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '7.5px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '3px 7px',
                    backgroundColor: '#f3f3f2',
                    border: '1px solid #e2e2df',
                    color: '#222222',
                    borderRadius: '2px',
                  }}
                >
                  {m}
                </span>
              ))}
            </div>

            {/* 4 Badges de caractéristiques clés */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginTop: '12px',
              }}
            >
              {heroSpecs.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#fafaf9',
                    border: '1px solid #e5e5e3',
                    padding: '8px 10px',
                    borderRadius: '3px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#000000', letterSpacing: '-0.01em' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '6.8px', fontWeight: 700, letterSpacing: '0.12em', color: '#666666', marginTop: '2px', textTransform: 'uppercase' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 01 : APERÇU PRODUIT */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, lineHeight: 1, color: '#111111' }}>
                01
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px', letterSpacing: '0.18em', fontWeight: 800, color: '#777777', textTransform: 'uppercase' }}>
                  APERÇU PRODUIT
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#000000', marginTop: '2px' }}>
                  {overviewHook}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '9px', lineHeight: '1.45', color: '#333333', marginTop: '8px', textAlign: 'justify' }}>
              {overviewDesc}
            </div>

            {/* Médias & Visuels Aperçu */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
              <div style={{ border: '1px solid #e5e5e5', borderRadius: '3px', overflow: 'hidden', backgroundColor: '#fcfcfc' }}>
                <div style={{ height: '125px', backgroundColor: '#090909', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photoOverview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoOverview}
                      alt={productName}
                      crossOrigin="anonymous"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '8.5px', color: '#666666', letterSpacing: '0.1em' }}>VISUEL PRINCIPAL PRODUIT</span>
                  )}
                </div>
                <div style={{ padding: '6px 8px' }}>
                  <div style={{ fontSize: '8px', fontWeight: 700, color: '#111111' }}>Rendu Scénique & Architecture</div>
                  <div style={{ fontSize: '7px', color: '#666666' }}>Intégration murale haute fidélité</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {/* 3 Stats en colonnes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', backgroundColor: '#fafaf9', border: '1px solid #e8e8e6', padding: '8px', borderRadius: '3px' }}>
                  {stats.map((st, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 900, color: '#000000' }}>{st.value}</div>
                      <div style={{ fontSize: '6.5px', fontWeight: 700, color: '#666666', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>
                        {st.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Technologies embarquées */}
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.12em', color: '#555555', textTransform: 'uppercase', marginBottom: '6px' }}>
                    TECHNOLOGIES EMBARQUÉES
                  </div>
                  {technologies.map((t, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '5px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 900, color: '#111111' }}>{t.num}</span>
                      <div>
                        <div style={{ fontSize: '8px', fontWeight: 800, color: '#000000' }}>{t.title}</div>
                        <div style={{ fontSize: '7.2px', color: '#555555', lineHeight: '1.25' }}>{t.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 02 : CONCEPTION & FORMAT (Début) */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #dcdcd8' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, lineHeight: 1, color: '#111111' }}>
                02
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px', letterSpacing: '0.18em', fontWeight: 800, color: '#777777', textTransform: 'uppercase' }}>
                  CONCEPTION & FORMAT
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#000000', marginTop: '2px' }}>
                  {designHook}
                </div>
              </div>
            </div>

            {/* 3 Blocs dimensions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px' }}>
              {dims.map((d, idx) => (
                <div key={idx} style={{ backgroundColor: '#fafaf9', border: '1px solid #e5e5e3', padding: '8px 10px', borderRadius: '3px' }}>
                  <div style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.12em', color: '#666666', textTransform: 'uppercase' }}>
                    {d.label}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#000000', marginTop: '2px' }}>
                    {d.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Visuel technique Châssis CNC Monobloc & Configurations (Aéré, plein format sans superposition) */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '12px', marginTop: '10px' }}>
              <div style={{ border: '1px solid #e5e5e5', borderRadius: '3px', overflow: 'hidden', backgroundColor: '#fcfcfc' }}>
                <div style={{ height: '120px', backgroundColor: '#090909', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photoDesign ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoDesign}
                      alt="Usinage châssis"
                      crossOrigin="anonymous"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '8.5px', color: '#666666' }}>VISUEL CHÂSSIS & USINAGE CNC</span>
                  )}
                </div>
                <div style={{ padding: '5px 8px' }}>
                  <div style={{ fontSize: '7.8px', fontWeight: 700, color: '#111111' }}>Profil Ultra-Fin & Assemblage Robuste</div>
                  <div style={{ fontSize: '6.8px', color: '#666666' }}>Tolérance mécanique de ±0.05 mm</div>
                </div>
              </div>

              {/* Configurations d'installation : 3 cartes bien aérées */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '7.8px', fontWeight: 800, letterSpacing: '0.12em', color: '#555555', textTransform: 'uppercase', marginBottom: '4px' }}>
                  CONFIGURATIONS D’INSTALLATION
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {configs.map((c, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        backgroundColor: '#fafaf9',
                        border: '1px solid #e9e9e7',
                        padding: '6px 8px',
                        borderRadius: '3px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: 900,
                          backgroundColor: '#111111',
                          color: '#ffffff',
                          padding: '2px 5px',
                          borderRadius: '2px',
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        {c.num}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '8px', fontWeight: 800, color: '#000000' }}>{c.title}</div>
                        <div style={{ fontSize: '7px', color: '#555555', lineHeight: '1.3' }}>{c.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Page 1 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '10px',
            borderTop: '1px solid #e5e5e5',
            fontSize: '7.5px',
            color: '#777777',
            letterSpacing: '0.08em',
          }}
        >
          <span>{cleanCompanyName} · FICHE TECHNIQUE PRODUIT — {productName}</span>
          <span style={{ fontWeight: 800, color: '#111111' }}>PAGE 1 / 4</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PAGE 2 : Section 03 Points Forts Techniques (Plein Format Aéré)      */}
      {/* ==================================================================== */}
      <div
        className="page-break-after"
        style={{
          width: '794px',
          height: '1123px',
          maxHeight: '1123px',
          padding: '36px 44px',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          borderBottom: '1px solid #eaeaea',
        }}
      >
        <div>
          {/* Header officiel */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '14px',
              borderBottom: '1.5px solid #111111',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.18em', color: '#000000' }}>
                {cleanCompanyName}
              </span>
              <span style={{ fontSize: '10px', color: '#888888', fontWeight: 600 }}>|</span>
              <span style={{ fontSize: '9px', letterSpacing: '0.12em', color: '#555555', fontWeight: 700 }}>
                {productName}
              </span>
            </div>
            <div style={{ fontSize: '8.5px', letterSpacing: '0.16em', fontWeight: 700, color: '#444444' }}>
              POINTS FORTS TECHNIQUES & INNOVATIONS
            </div>
          </div>

          {/* Section 03 : POINTS FORTS TECHNIQUES (Plein format majestueux) */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ fontSize: '30px', fontWeight: 900, lineHeight: 1, color: '#111111' }}>
                03
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8.5px', letterSpacing: '0.2em', fontWeight: 800, color: '#777777', textTransform: 'uppercase' }}>
                  POINTS FORTS TECHNIQUES
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#000000', marginTop: '3px' }}>
                  {featuresHook}
                </div>
              </div>
            </div>

            {/* Visuel central & Liste des 7 caractéristiques clés */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', marginTop: '20px' }}>
              {/* Photo centrale du produit - Grand format immersif */}
              <div style={{ border: '1px solid #e5e5e5', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#fcfcfc', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '450px', backgroundColor: '#090909', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photoFeatures ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoFeatures}
                      alt="Détail technique"
                      crossOrigin="anonymous"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '9px', color: '#666666', textAlign: 'center', padding: '16px' }}>VUE DÉTAILLÉE ÉCRAN ET DALLES LED</span>
                  )}
                </div>
                <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: '#111111' }}>Intégration Architectural Grade A</div>
                  <div style={{ fontSize: '7.8px', color: '#666666', marginTop: '2px' }}>Finitions soignées pour espaces d&apos;exception</div>
                </div>
              </div>

              {/* Les 7 Caractéristiques numérotées bien aérées */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {featuresList.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      backgroundColor: '#fafaf9',
                      border: '1px solid #e9e9e7',
                      padding: '10px 12px',
                      borderRadius: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        color: '#000000',
                        backgroundColor: '#eaeae8',
                        padding: '3px 6px',
                        borderRadius: '3px',
                        lineHeight: 1,
                      }}
                    >
                      {f.num || `0${idx + 1}`}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: '#000000' }}>{f.title}</div>
                      <div style={{ fontSize: '7.8px', color: '#555555', lineHeight: '1.4', marginTop: '2px' }}>
                        {f.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Page 2 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '10px',
            borderTop: '1px solid #e5e5e5',
            fontSize: '7.5px',
            color: '#777777',
            letterSpacing: '0.08em',
          }}
        >
          <span>{cleanCompanyName} · FICHE TECHNIQUE PRODUIT — {productName}</span>
          <span style={{ fontWeight: 800, color: '#111111' }}>PAGE 2 / 4</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PAGE 3 : Section 04 Matrice Caractéristiques, Section 05 Projets     */}
      {/* ==================================================================== */}
      <div
        className="page-break-after"
        style={{
          width: '794px',
          height: '1123px',
          maxHeight: '1123px',
          padding: '36px 44px',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          borderBottom: '1px solid #eaeaea',
        }}
      >
        <div>
          {/* Header officiel */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '14px',
              borderBottom: '1.5px solid #111111',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.18em', color: '#000000' }}>
                {cleanCompanyName}
              </span>
              <span style={{ fontSize: '10px', color: '#888888', fontWeight: 600 }}>|</span>
              <span style={{ fontSize: '9px', letterSpacing: '0.12em', color: '#555555', fontWeight: 700 }}>
                {productName}
              </span>
            </div>
            <div style={{ fontSize: '8.5px', letterSpacing: '0.16em', fontWeight: 700, color: '#444444' }}>
              SPÉCIFICATIONS TECHNIQUES COMPARATIVES
            </div>
          </div>

          {/* Section 04 : MATRICE COMPARATIVE */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, lineHeight: 1, color: '#111111' }}>
                04
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px', letterSpacing: '0.18em', fontWeight: 800, color: '#777777', textTransform: 'uppercase' }}>
                  CARACTÉRISTIQUES TECHNIQUES
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#000000', marginTop: '2px' }}>
                  Tableau Comparatif des Modèles & Variantes
                </div>
              </div>
            </div>

            {/* Tableau matriciel */}
            <div style={{ marginTop: '12px', border: '1px solid #e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.2px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#111111', color: '#ffffff' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 800, width: '220px', letterSpacing: '0.06em' }}>
                      CARACTÉRISTIQUE TECHNIQUE
                    </th>
                    {models.map((m, idx) => (
                      <th key={idx} style={{ padding: '6px 6px', textAlign: 'center', fontWeight: 800, letterSpacing: '0.05em' }}>
                        {m.name || `MODÈLE ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group, gIdx) => (
                    <React.Fragment key={gIdx}>
                      <tr style={{ backgroundColor: '#f0f0ee', borderTop: '1px solid #d5d5d5', borderBottom: '1px solid #d5d5d5' }}>
                        <td
                          colSpan={models.length + 1}
                          style={{
                            padding: '4px 8px',
                            fontWeight: 900,
                            fontSize: '6.8px',
                            letterSpacing: '0.14em',
                            color: '#000000',
                            textTransform: 'uppercase',
                          }}
                        >
                          {group.label}
                        </td>
                      </tr>
                      {group.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          style={{
                            backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#fafaf8',
                            borderBottom: '1px solid #ebebeb',
                          }}
                        >
                          <td style={{ padding: '4px 8px', color: '#333333', fontWeight: 600 }}>
                            {row.label}
                          </td>
                          {models.map((m, mIdx) => {
                            // Résolution de valeur selon les clés habituelles
                            const directVal = m.specs?.[row.key];
                            const readVal = specValue(directVal);
                            const val = readVal || '—';
                            return (
                              <td key={mIdx} style={{ padding: '4px 6px', textAlign: 'center', color: '#111111', fontWeight: 700 }}>
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 05 : RÉFÉRENCES TERRAIN */}
          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px dashed #dcdcd8' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, lineHeight: 1, color: '#111111' }}>
                05
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px', letterSpacing: '0.18em', fontWeight: 800, color: '#777777', textTransform: 'uppercase' }}>
                  RÉFÉRENCES TERRAIN & PROJETS
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#000000', marginTop: '2px' }}>
                  {fieldworkHook}
                </div>
              </div>
            </div>

            {/* 3 Cartes projets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
              {projects.map((p, idx) => (
                <div key={idx} style={{ border: '1px solid #e5e5e5', borderRadius: '3px', overflow: 'hidden', backgroundColor: '#fafaf9' }}>
                  <div style={{ height: '78px', backgroundColor: '#111111', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt={p.title}
                        crossOrigin="anonymous"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '7px', color: '#777777' }}>PROJET DÉPLOYÉ</span>
                    )}
                  </div>
                  <div style={{ padding: '6px 8px' }}>
                    <div style={{ fontSize: '7.8px', fontWeight: 800, color: '#000000' }}>{p.title}</div>
                    <div style={{ fontSize: '6.8px', fontWeight: 700, color: '#666666', marginTop: '1px' }}>{p.location}</div>
                    {p.caption && (
                      <div style={{ fontSize: '6.5px', color: '#555555', marginTop: '3px', lineHeight: '1.25' }}>{p.caption}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Page 3 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '10px',
            borderTop: '1px solid #e5e5e5',
            fontSize: '7.5px',
            color: '#777777',
            letterSpacing: '0.08em',
          }}
        >
          <span>{cleanCompanyName} · FICHE TECHNIQUE PRODUIT — {productName}</span>
          <span style={{ fontWeight: 800, color: '#111111' }}>PAGE 3 / 4</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PAGE 4 : Certifications, Garantie & Engagements Fabricant            */}
      {/* ==================================================================== */}
      <div
        className="page-break-after"
        style={{
          width: '794px',
          height: '1123px',
          maxHeight: '1123px',
          padding: '36px 44px',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <div>
          {/* Header officiel */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '14px',
              borderBottom: '1.5px solid #111111',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.18em', color: '#000000' }}>
                {cleanCompanyName}
              </span>
              <span style={{ fontSize: '10px', color: '#888888', fontWeight: 600 }}>|</span>
              <span style={{ fontSize: '9px', letterSpacing: '0.12em', color: '#555555', fontWeight: 700 }}>
                {productName}
              </span>
            </div>
            <div style={{ fontSize: '8.5px', letterSpacing: '0.16em', fontWeight: 700, color: '#444444' }}>
              ENGAGEMENTS FABRICANT & CERTIFICATIONS
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#000000', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
              Garantie Constructeur & Conformité Européenne
            </h2>
            <p style={{ fontSize: '8.5px', color: '#444444', lineHeight: '1.4', marginTop: '4px' }}>
              Tous les matériels d&apos;affichage dynamique et écrans géants LED PixiaTech font l&apos;objet de contrôles qualité stricts en laboratoire et en chaîne de production, garantissant une endurance optimale en conditions d&apos;exploitation intensives 24/7.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '16px' }}>
              {/* Bloc 1 : Normes et Directives */}
              <div style={{ backgroundColor: '#fafaf9', border: '1px solid #e6e6e4', padding: '12px', borderRadius: '3px' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#000000', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  NORMES & DIRECTIVES EUROPÉENNES
                </div>
                <ul style={{ margin: '8px 0 0 14px', padding: 0, fontSize: '7.8px', color: '#444444', lineHeight: '1.5' }}>
                  <li><strong>Compatibilité Électromagnétique (CEM) :</strong> Directive 2014/30/UE (EN 55032 / EN 55035).</li>
                  <li><strong>Basse Tension (LVD) :</strong> Directive 2014/35/UE (Sécurité électrique EN 62368-1).</li>
                  <li><strong>Restriction Substances Dangereuses (RoHS) :</strong> Directive 2011/65/UE & 2015/863.</li>
                  <li><strong>Comportement au Feu :</strong> Matériaux certifiés auto-extinguibles classe UL94-V0.</li>
                  <li><strong>Indice d&apos;Étanchéité IP :</strong> Contrôlé selon norme CEI 60529 (IP30 à IP65).</li>
                </ul>
              </div>

              {/* Bloc 2 : Garantie & Spare Parts */}
              <div style={{ backgroundColor: '#fafaf9', border: '1px solid #e6e6e4', padding: '12px', borderRadius: '3px' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#000000', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  PROGRAMME GARANTIE & MAINTENANCE
                </div>
                <ul style={{ margin: '8px 0 0 14px', padding: 0, fontSize: '7.8px', color: '#444444', lineHeight: '1.5' }}>
                  <li><strong>Garantie Pièces & Main d&apos;œuvre :</strong> 3 à 5 ans selon contrat d&apos;extension.</li>
                  <li><strong>Gestion du Lot de Calibrage :</strong> Dalles et modules de secours issus du même batch d&apos;étalonnage colorimétrique (Spare Parts inclus).</li>
                  <li><strong>Service Technique & SAV :</strong> Diagnostic réactif, échange standard et hotline dédiée en France.</li>
                  <li><strong>Accompagnement Ingénierie :</strong> Fourniture de notes de calculs, plans de pose DWG et synoptiques électriques.</li>
                </ul>
              </div>
            </div>

            {/* Encadré officiel de validation */}
            <div
              style={{
                marginTop: '18px',
                border: '1.5px solid #111111',
                padding: '14px 18px',
                borderRadius: '3px',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '20px',
                backgroundColor: '#ffffff',
              }}
            >
              <div>
                <div style={{ fontSize: '9px', fontWeight: 900, color: '#000000', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  CONSULTATION & ÉTUDE DE PROJET PERSONNALISÉE
                </div>
                <div style={{ fontSize: '7.8px', color: '#444444', lineHeight: '1.45', marginTop: '4px' }}>
                  Chaque projet d&apos;écran géant est unique. Nos équipes d&apos;ingénieurs et techniciens étudient vos contraintes structurelles, de recul visuel, d&apos;ensoleillement et de gestion de flux pour dimensionner la solution LED idéale.
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '7.8px', color: '#222222' }}>
                  <div><strong>Email :</strong> contact@pixiatech.com</div>
                  <div><strong>Web :</strong> www.pixiatech.com</div>
                  <div><strong>Téléphone :</strong> +33 1 89 71 45 30</div>
                </div>
              </div>

              <div style={{ borderLeft: '1px solid #e0e0e0', paddingLeft: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '7.2px', fontWeight: 800, color: '#666666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  RÉFÉRENCE FICHE TECHNIQUE
                </div>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#000000', marginTop: '2px' }}>
                  DOC-{product.slug.toUpperCase()}
                </div>
                <div style={{ fontSize: '6.8px', color: '#888888', marginTop: '4px' }}>
                  Éditée le {new Date().toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US')}
                </div>
                <div style={{ fontSize: '6.8px', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
                  ✓ VALIDÉ DÉPARTEMENT TECHNIQUE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Page 4 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '10px',
            borderTop: '1px solid #e5e5e5',
            fontSize: '7.5px',
            color: '#777777',
            letterSpacing: '0.08em',
          }}
        >
          <span>{cleanCompanyName} · FICHE TECHNIQUE PRODUIT — {productName} · DOCUMENT OFFICIEL</span>
          <span style={{ fontWeight: 800, color: '#111111' }}>PAGE 4 / 4</span>
        </div>
      </div>
    </div>
  );
};

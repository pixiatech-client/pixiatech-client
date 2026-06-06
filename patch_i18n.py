import re

file_path = r'F:\PIXIATECH\new d\Estimation V3\src\app\admin\produits\ProductManagementClient.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useI18n hooks to specific components
hooks_to_add = [
    (
        'const ProductListItem = ({\n  product,\n  selectedIds,\n  toggleSelect,\n  onEditProduct,\n  onDuplicateProduct,\n  onDeleteProduct,\n  setDeletingId,\n  deletingId\n}: any) => {\n  const dragControls = useDragControls();',
        'const ProductListItem = ({\n  product,\n  selectedIds,\n  toggleSelect,\n  onEditProduct,\n  onDuplicateProduct,\n  onDeleteProduct,\n  setDeletingId,\n  deletingId\n}: any) => {\n  const { t } = useI18n();\n  const dragControls = useDragControls();'
    ),
    (
        '  onSave: (s: AISettings) => void\n}) => {\n  const [localSettings, setLocalSettings] = useState<AISettings>(settings);',
        '  onSave: (s: AISettings) => void\n}) => {\n  const { t } = useI18n();\n  const [localSettings, setLocalSettings] = useState<AISettings>(settings);'
    ),
    (
        '}: any) => {\n  const [specPage, setSpecPage] = useState(1);',
        '}: any) => {\n  const { t } = useI18n();\n  const [specPage, setSpecPage] = useState(1);'
    ),
    (
        '}: {\n  products: any[];\n  setProducts: (products: any[]) => void;\n  onAddProduct: () => void;\n  onEditProduct: (product: any) => void;\n  onDuplicateProduct: (product: any) => void;\n  onDeleteProduct: (id: string) => void;\n  onBulkDelete?: (ids: string[]) => void;\n}) => {\n  const [searchQuery, setSearchQuery] = useState(\'\');',
        '}: {\n  products: any[];\n  setProducts: (products: any[]) => void;\n  onAddProduct: () => void;\n  onEditProduct: (product: any) => void;\n  onDuplicateProduct: (product: any) => void;\n  onDeleteProduct: (id: string) => void;\n  onBulkDelete?: (ids: string[]) => void;\n}) => {\n  const { t } = useI18n();\n  const [searchQuery, setSearchQuery] = useState(\'\');'
    ),
]

for old, new in hooks_to_add:
    content = content.replace(old, new)

# French Strings replacements - only exact matches
repls = [
    ('title="Supprimer"', "title={t('admin.products.delete')}"),
    ('Supprimer ce produit ?', "t('admin.products.deleteThisProduct')"),
    ('Cette action est irréversible', "t('admin.products.irreversibleAction')"),
    ('Configuration IA', "t('admin.products.aiSettings.title')"),
    ("Paramètres d'analyse et d'extraction", "t('admin.products.aiSettings.subtitle')"),
    ("Activer l'IA", "t('admin.products.aiSettings.enableAi')"),
    ('Analyse automatique', "t('admin.products.aiSettings.autoAnalysis')"),
    ('Fournisseur', "t('admin.products.aiSettings.provider')"),
    ('Clé API', "t('admin.products.aiSettings.apiKey')"),
    ('Modèle', "t('admin.products.aiSettings.model')"),
    ('Paramètres Avancés', "t('admin.products.aiSettings.advancedSettings')"),
    ('Max Tokens', "t('admin.products.aiSettings.maxTokens')"),
    ('Taille PDF (MB)', "t('admin.products.aiSettings.pdfSize')"),
    ('Auto-création', "t('admin.products.aiSettings.autoCreate')"),
    ('Caractéristiques', "t('admin.products.aiSettings.characteristics')"),
    ("Tester l'IA", "t('admin.products.aiSettings.testAi')"),
    ('Connexion OK', "t('admin.products.aiSettings.connectionOk')"),
    ('Test...', "t('admin.products.aiSettings.testing')"),
    ('Erreur', "t('admin.products.aiSettings.error')"),
    ('Rechercher un produit...', "t('admin.products.gestion.searchProductPlaceholder')"),
    ('Filtrer par type', "t('admin.products.gestion.filterByType')"),
    ('Rechercher une spécification...', "t('admin.products.produit.searchSpecPlaceholder')"),
    ('Nom Du Produits', "t('admin.products.produit.productNamePlaceholder')"),
    ('Ajouter une image/icône', "t('admin.products.produit.addImageIcon')"),
    ('Ajouter un produit', "t('admin.products.gestion.addProduct')"),
    ('Supprimer ?', "t('admin.products.confirmDeleteTitle')"),
    ('Oui', "t('admin.products.confirmDeleteYes')"),
    ('Non', "t('admin.products.confirmDeleteNo')"),
    ('Intérieur', "t('admin.products.produit.environments.indoor')"),
    ('Extérieur', "t('admin.products.produit.environments.outdoor')"),
    ('Vitrine', "t('admin.products.produit.environments.showcase')"),
    ('Achat', "t('admin.products.produit.modeTypes.sale')"),
    ('Location', "t('admin.products.produit.modeTypes.rental')"),
    ('360°', "t('admin.products.produit.screenTypes.360')"),
    ('Incurvé', "t('admin.products.produit.screenTypes.curved')"),
    ('Plat', "t('admin.products.produit.screenTypes.flat')"),
    ('Pitch', "t('admin.products.produit.labels.pitch')"),
    ('Distance', "t('admin.products.produit.labels.distance')"),
    ('Vente /m²', "t('admin.products.produit.labels.salePerSqm')"),
    ('Ajouter', "t('admin.products.produit.addCharacteristicBtn')"),
    ('Caractéristiques disponibles', "t('admin.products.produit.availableCharacteristics')"),
    ('Ajouter une caractéristique', "t('admin.products.produit.addCharacteristic')"),
    ('Verrouiller', "t('admin.products.produit.lock')"),
    ('Empêcher suppression', "t('admin.products.produit.lockDesc')"),
    ('Épingler', "t('admin.products.produit.pin')"),
    ('Ajout par défaut', "t('admin.products.produit.pinDesc')"),
    ("Icône", "t('admin.products.produit.iconLabel')"),
    ('Nom de la caractéristique', "t('admin.products.produit.characteristicNameLabel')"),
    ("Couleur de l'icône", "t('admin.products.produit.iconColorLabel')"),
    ('Variantes de la caractéristique', "t('admin.products.produit.variantsLabel')"),
    ('Caractéristique enregistrée !', "t('admin.products.produit.characteristicSaved')"),
    ('Créer une nouvelle', "t('admin.products.produit.createNew')"),
    ("Continuer l'édition", "t('admin.products.produit.continueEditing')"),
    ('Modifier la caractéristique', "t('admin.products.produit.modifyCharacteristic')"),
    ('Créer une caractéristique', "t('admin.products.produit.createCharacteristic')"),
    ('Ou téléverser une icône personnalisée', "t('admin.products.produit.uploadCustomIcon')"),
    ('Téléverser une icône', "t('admin.products.produit.uploadIcon')"),
    ('Nouveau', "t('admin.products.produit.newCharacteristic')"),
    ('Mettre à jour', "t('admin.products.produit.updateCharacteristic')"),
    ('Enregistrer', "t('admin.products.produit.saveCharacteristic')"),
    ('Rétablir les réglages Pixiatech', "t('admin.products.produit.syncPixiatech')"),
    ('Aucun produit', "t('admin.products.gestion.noProducts')"),
    ('Commencez par créer votre premier produit', "t('admin.products.gestion.createFirstProduct')"),
    ('Créer un produit', "t('admin.products.gestion.createProduct')"),
    ('Ordre Manuel', "t('admin.products.gestion.manualOrder')"),
    ('Par Nom', "t('admin.products.gestion.byName')"),
    ('Par Prix', "t('admin.products.gestion.byPrice')"),
    ('Par Date', "t('admin.products.gestion.byDate')"),
    ('Terminer', "t('admin.products.gestion.finish')"),
    ('Gestion du Catalogue Audiovisuel', "t('admin.products.produit.catalogManagement')"),
    ('Bienvenue', "t('admin.products.produit.welcome')"),
    ('Connectez-vous pour continuer', "t('admin.products.produit.connectToContinue')"),
    ('Accès restreint', "t('admin.products.produit.restrictedAccess')"),
    ('Veuillez vous connecter pour accéder à cette section.', "t('admin.products.produit.loginRequired')"),
    ('Produit mis à jour', "t('admin.products.produit.productUpdated')"),
    ('Produit ajouté', "t('admin.products.produit.productAdded')"),
    ('Supprimer ({count})', "t('admin.products.gestion.bulkDelete')"),
    ('Supprimer {count} ?', "t('admin.products.gestion.bulkDeleteConfirm')"),
]

for old, new in repls:
    if old in content and old != new:
        content = content.replace(old, new)

# Add hook to top-level component
if 'export default function ProductManagementClient() {\n  const { toast } = useToast();' in content:
    content = content.replace(
        'export default function ProductManagementClient() {\n  const { toast } = useToast();',
        'export default function ProductManagementClient() {\n  const { toast } = useToast();\n  const { t } = useI18n();'
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')

# -*- coding: utf-8 -*-
import re, json

TSX = r'F:\PIXIATECH\new d\Estimation V3\src\app\admin\produits\ProductManagementClient.tsx'
FR = r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\fr.json'
EN = r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\en.json'

with open(TSX, encoding='utf-8') as f:
    src = f.read()

with open(FR, encoding='utf-8') as f:
    fr = json.load(f)
with open(EN, encoding='utf-8') as f:
    en = json.load(f)

fr.setdefault('admin', {}).setdefault('products', {})
en.setdefault('admin', {}).setdefault('products', {})

# 1. Add useI18n hooks to each subcomponent
src = src.replace(
    "const GestionProduits = ({\n  products,\n  setProducts,\n  onAddProduct,\n  onEditProduct,\n  onDuplicateProduct,\n  onDeleteProduct,\n  onBulkDelete\n}: {\n  products: any[];\n  setProducts: (products: any[]) => void;\n  onAddProduct: () => void;\n  onEditProduct: (product: any) => void;\n  onDuplicateProduct: (product: any) => void;\n  onDeleteProduct: (id: string) => void;\n  onBulkDelete?: (ids: string[]) => void;\n}) => {",
    "const GestionProduits = ({\n  products,\n  setProducts,\n  onAddProduct,\n  onEditProduct,\n  onDuplicateProduct,\n  onDeleteProduct,\n  onBulkDelete,\n  t\n}: {\n  products: any[];\n  setProducts: (products: any[]) => void;\n  onAddProduct: () => void;\n  onEditProduct: (product: any) => void;\n  onDuplicateProduct: (product: any) => void;\n  onDeleteProduct: (id: string) => void;\n  onBulkDelete?: (ids: string[]) => void;\n  t: (k: string, f?: string) => string;\n}) => {\n  const { __i18n } = require('@/lib/i18n');\n  const t = __i18n.t;",
)

# Add to ProduitPage
src = src.replace(
    "const ProduitPage = ({\n  editingProduct,\n  setEditingProduct,\n  productName,\n  setProductName,\n  mode,\n  setMode,\n  environment,\n  setEnvironment,\n  surface,\n  setSurface,",
    "const ProduitPage = ({\n  editingProduct,\n  setEditingProduct,\n  productName,\n  setProductName,\n  mode,\n  setMode,\n  environment,\n  setEnvironment,\n  surface,\n  setSurface,\n  t"
)
src = src.replace(
    "  user,\n}: {\n  editingProduct: any;\n  setEditingProduct: (p: any) => void;\n  productName: string;\n  setProductName: (v: string) => void;\n  mode: string[];\n  setMode: (v: string[]) => void;\n  environment: string[];\n  setEnvironment: (v: string[]) => void;\n  surface: number;\n  setSurface: (v: number) => void;",
    "  user,\n  t\n}: {\n  editingProduct: any;\n  setEditingProduct: (p: any) => void;\n  productName: string;\n  setProductName: (v: string) => void;\n  mode: string[];\n  setMode: (v: string[]) => void;\n  environment: string[];\n  setEnvironment: (v: string[]) => void;\n  surface: number;\n  setSurface: (v: number) => void;"
)

# Add to CaracteristiquesPage
src = src.replace(
    "const CaracteristiquesPage = ({\n  onBack,\n  characteristics,\n  setCharacteristics,\n  user\n}: {\n  onBack: () => void,\n  characteristics: any[]\n}) => {",
    "const CaracteristiquesPage = ({\n  onBack,\n  characteristics,\n  setCharacteristics,\n  user,\n  t\n}: {\n  onBack: () => void,\n  characteristics: any[]\n}) => {\n  const { __i18n } = require('@/lib/i18n');\n  const t = __i18n.t;"
)

# 2. Replace specific hardcoded French strings in the TSX
replacements = [
    # Tabs
    ("label: 'Gestion des Produits'", "label: t('admin.products.managementTitle')"),
    ("label: 'Fiche Produit'", "label: t('admin.products.productFormTitle')"),
    ("label: 'Caractéristiques'", "label: t('admin.products.characteristicsTitle')"),
    # Product form labels
    ("'Nom du produit'", "t('admin.products.productName')"),
    ("placeholder: 'Nom Du Produits'", "placeholder: t('admin.products.productNamePlaceholder')"),
    ("'Type d'écran'", "t('admin.products.screenType')"),
    ("'Paramètres de commercialisation'", "t('admin.products.marketingSettings')"),
    ("'Prix public conseillé par m².'", "t('admin.products.pricePerSqM')"),
    ("'Saisir un ancien prix pour afficher une réduction barré.'", "t('admin.products.oldPriceHint')"),
    ("'Gérer les dimensions et le prix par dalle'", "t('admin.products.manageDimensions')"),
    ("'Règlages Avancés'", "t('admin.products.advancedSettings')"),
    ("'Spécifications Techniques'", "t('admin.products.specifications')"),
    ("placeholder: 'Rechercher une spécification...'", "placeholder: t('admin.products.searchSpecPlaceholder')"),
    ("'Ajouter une caractéristique'", "t('admin.products.addCharacteristic')"),
    ("'Résultats suggérés'", "t('admin.products.suggestedResults')"),
    ("'Aucun résultat'", "t('admin.products.noResults')"),
    # Media
    ("'Aucune vidéo'", "t('admin.products.noVideo')"),
    ("'Remplacer la vidéo'", "t('admin.products.replaceVideo')"),
    ("'Aperçu du média'", "t('admin.products.mediaPreview')"),
    ("'Type de média visuel'", "t('admin.products.visualMediaType')"),
    ("'Lien du média (URL)'", "t('admin.products.mediaLink')"),
    # Characteristics
    ("'Choisir une icône'", "t('admin.products.chooseIcon')"),
    ("'Ou téléverser une icône personnalisée'", "t('admin.products.orUploadIcon')"),
    ("'Nom de la caractéristique'", "t('admin.products.charName')"),
    ("'Variantes de la caractéristique'", "t('admin.products.charVariants')"),
    ("'Ex: 2 mètres, 4 mètres...'", "t('admin.products.exMeters')"),
    ("'Ajouter une image/icône'", "t('admin.products.addImageIcon')"),
    ("'Caractéristique enregistrée !'", "t('admin.products.charSaved')"),
    ("'Caractéristique système (Verrouillée)'", "t('admin.products.systemCharLocked')"),
    ("'Modifier la caractéristique'", "t('admin.products.editChar')"),
    ("'Créer une caractéristique'", "t('admin.products.createChar')"),
    ("'Épingler'", "t('admin.products.pin')"),
    ("'Empêcher suppression'", "t('admin.products.preventDelete')"),
    ("'Couleur de l'icône'", "t('admin.products.iconColor')"),
    ("'Ajout par défaut'", "t('admin.products.defaultAdd')"),
    ("'Ajouter des caractéristiques'", "t('admin.products.addCharacteristics')"),
    # Toasts
    ('title: "Produit mis à jour"', "title: t('admin.products.productUpdated')"),
    ('title: "Produit ajouté"', "title: t('admin.products.productAdded')"),
    ('title: "Erreur de sauvegarde"', "title: t('admin.products.saveError')"),
    # Auth
    ('title: "Mot de passe oublié ?"', "title: t('admin.products.forgotPassword')"),
    ('"Entrez votre email pour demander une réinitialisation"', 't("admin.products.enterEmailReset")'),
    ('"Email envoyé !"', 't("admin.products.emailSent")'),
    ('"Vérifiez votre boîte de réception pour les instructions."', 't("admin.products.checkInbox")'),
    ('"Email associé au compte"', 't("admin.products.emailAssociated")'),
    ('"Déjà un compte ?"', 't("admin.products.alreadyAccount")'),
    ('"Créer un accès"', 't("admin.products.createAccess")'),
    ('"Retour à la connexion"', 't("admin.products.backToLogin")'),
]

count = 0
for old, new in replacements:
    if old in src:
        src = src.replace(old, new)
        count += 1
    else:
        pass  # skip missing

print(f'Replaced {count} strings')

with open(TSX, 'w', encoding='utf-8') as f:
    f.write(src)

print('TSX updated')

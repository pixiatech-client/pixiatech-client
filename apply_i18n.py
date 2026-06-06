# -*- coding: utf-8 -*-
import re, json

TSX_PATH = r'F:\PIXIATECH\new d\Estimation V3\src\app\admin\produits\ProductManagementClient.tsx'
FR_JSON = r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\fr.json'
EN_JSON = r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\en.json'

with open(TSX_PATH, encoding='utf-8') as f:
    tsx = f.read()

# String replacements: (old, new_tsx, fr_val, en_val)
replacements = [
    # Section tabs
    ("'Gestion des Produits'", "t('admin.products.managementTitle')", 'Gestion des Produits', 'Product Management'),
    ("'Fiche Produit'", "t('admin.products.productFormTitle')", 'Fiche Produit', 'Product Sheet'),
    ("'Caractéristiques'", "t('admin.products.characteristicsTitle')", 'Caractéristiques', 'Characteristics'),
    # Common UI
    ("'Ajouter un produit'", "t('admin.products.addProduct')", 'Ajouter un produit', 'Add product'),
    ("placeholder: 'Rechercher un produit...'", "placeholder: t('admin.products.searchProductPlaceholder')", 'Rechercher un produit...', 'Search a product...'),
    ("placeholder: 'Rechercher...'", "placeholder: t('admin.products.searchPlaceholder')", 'Rechercher...', 'Search...'),
    ("'Filtrer par type'", "t('admin.products.filterByType')", 'Filtrer par type', 'Filter by type'),
    ("'Aucun produit'", "t('admin.products.noProductsTitle')", 'Aucun produit', 'No product'),
    ("'Commencez par créer votre premier produit'", "t('admin.products.noProductsBody')", 'Commencez par créer votre premier produit', 'Start by creating your first product'),
    ("'Créer un produit'", "t('admin.products.createProductButton')", 'Créer un produit', 'Create a product'),
    # Delete confirm
    ("'Supprimer ?'", "t('admin.products.deleteConfirmTitle')", 'Supprimer ?', 'Delete?'),
    ("'Supprimer ce produit ?'", "t('admin.products.deleteConfirmHeading')", 'Supprimer ce produit ?', 'Delete this product?'),
    ("'Cette action est irréversible'", "t('admin.products.irreversibleAction')", 'Cette action est irréversible', 'This action is irreversible'),
    ("'Annuler'", "t('admin.products.cancel')", 'Annuler', 'Cancel'),
    ("'Supprimer'", "t('admin.products.delete')", 'Supprimer', 'Delete'),
    # Product form
    ("'Nom du produit'", "t('admin.products.productName')", 'Nom du produit', 'Product name'),
    ("placeholder: 'Nom Du Produits'", "placeholder: t('admin.products.productNamePlaceholder')", 'Nom Du Produits', 'Product Name'),
    ("'Type d'écran'", "t('admin.products.screenType')", "Type d'écran", 'Screen type'),
    ("'Plat'", "t('admin.products.flat')", 'Plat', 'Flat'),
    ("'Incurvé'", "t('admin.products.curved')", 'Incurvé', 'Curved'),
    ("'360°'", "t('admin.products.360')", '360°', '360°'),
    ("'Paramètres de commercialisation'", "t('admin.products.marketingSettings')", 'Paramètres de commercialisation', 'Marketing settings'),
    ("'Prix public conseillé par m².'", "t('admin.products.pricePerSqM')", 'Prix public conseillé par m².', 'Recommended retail price per m².'),
    ("'Saisir un ancien prix pour afficher une réduction barré.'", "t('admin.products.oldPriceHint')", 'Saisir un ancien prix pour afficher une réduction barré.', 'Enter an old price to show a strikethrough discount.'),
    ("'Gérer les dimensions et le prix par dalle'", "t('admin.products.manageDimensions')", 'Gérer les dimensions et le prix par dalle', 'Manage dimensions and price per tile'),
    ("'Règlages Avancés'", "t('admin.products.advancedSettings')", 'Règlages Avancés', 'Advanced Settings'),
    ("'Spécifications Techniques'", "t('admin.products.specifications')", 'Spécifications Techniques', 'Technical Specifications'),
    ("placeholder: 'Rechercher une spécification...'", "placeholder: t('admin.products.searchSpecPlaceholder')", 'Rechercher une spécification...', 'Search a specification...'),
    ("'Ajouter une caractéristique'", "t('admin.products.addCharacteristic')", 'Ajouter une caractéristique', 'Add a characteristic'),
    ("'Résultats suggérés'", "t('admin.products.suggestedResults')", 'Résultats suggérés', 'Suggested results'),
    ("'Aucun résultat'", "t('admin.products.noResults')", 'Aucun résultat', 'No results'),
    # Media
    ("'Aucune vidéo'", "t('admin.products.noVideo')", 'Aucune vidéo', 'No video'),
    ("'Remplacer la vidéo'", "t('admin.products.replaceVideo')", 'Remplacer la vidéo', 'Replace video'),
    ("'Aperçu du média'", "t('admin.products.mediaPreview')", 'Aperçu du média', 'Media preview'),
    ("'Type de média visuel'", "t('admin.products.visualMediaType')", 'Type de média visuel', 'Visual media type'),
    ("'Lien du média (URL)'", "t('admin.products.mediaLink')", 'Lien du média (URL)', 'Media link (URL)'),
    # Characteristics
    ("'Choisir une icône'", "t('admin.products.chooseIcon')", 'Choisir une icône', 'Choose an icon'),
    ("'Ou téléverser une icône personnalisée'", "t('admin.products.orUploadIcon')", 'Ou téléverser une icône personnalisée', 'Or upload a custom icon'),
    ("'Nom de la caractéristique'", "t('admin.products.charName')", 'Nom de la caractéristique', 'Characteristic name'),
    ("'Variantes de la caractéristique'", "t('admin.products.charVariants')", 'Variantes de la caractéristique', 'Characteristic variants'),
    ("'Ex: 2 mètres, 4 mètres...'", "t('admin.products.exMeters')", 'Ex: 2 mètres, 4 mètres...', 'Ex: 2 meters, 4 meters...'),
    ("'Ajouter une image/icône'", "t('admin.products.addImageIcon')", 'Ajouter une image/icône', 'Add image/icon'),
    ("'Caractéristique enregistrée !'", "t('admin.products.charSaved')", 'Caractéristique enregistrée !', 'Characteristic saved!'),
    ("'Caractéristique système (Verrouillée)'", "t('admin.products.systemCharLocked')", 'Caractéristique système (Verrouillée)', 'System characteristic (Locked)'),
    ("'Modifier la caractéristique'", "t('admin.products.editChar')", 'Modifier la caractéristique', 'Edit characteristic'),
    ("'Créer une caractéristique'", "t('admin.products.createChar')", 'Créer une caractéristique', 'Create a characteristic'),
    ("'Enregistrement...'", "t('admin.products.saving')", 'Enregistrement...', 'Saving...'),
    ("'Mettre à jour'", "t('admin.products.update')", 'Mettre à jour', 'Update'),
    ("'Sauvegarder'", "t('admin.products.save')", 'Sauvegarder', 'Save'),
    ("'Épingler'", "t('admin.products.pin')", 'Épingler', 'Pin'),
    ("'Empêcher suppression'", "t('admin.products.preventDelete')", 'Empêcher suppression', 'Prevent deletion'),
    ("'Couleur de l'icône'", "t('admin.products.iconColor')", "Couleur de l'icône", 'Icon color'),
    ("'Ajout par défaut'", "t('admin.products.defaultAdd')", 'Ajout par défaut', 'Default add'),
    ("'Ajouter des caractéristiques'", "t('admin.products.addCharacteristics')", 'Ajouter des caractéristiques', 'Add characteristics'),
    ("'Continuer l'édition'", "t('admin.products.continueEditing')", "Continuer l'édition", 'Continue editing'),
    ("'Créer une nouvelle'", "t('admin.products.createNew')", 'Créer une nouvelle', 'Create a new one'),
    # Environment labels in badges
    ("label = 'Intérieur';", "label = t('admin.products.indoor');"),
    ("label = 'Semi-extérieur';", "label = t('admin.products.semiOutdoor');"),
    ("label = 'Extérieur';", "label = t('admin.products.outdoor');"),
    ("label = 'Vitrine';", "label = t('admin.products.showcase');"),
    # AI
    ("'Configuration IA'", "t('admin.products.aiConfigTitle')", 'Configuration IA', 'AI Configuration'),
    ("'Paramètres d'analyse et d'extraction'", "t('admin.products.aiConfigDesc')", "Paramètres d'analyse et d'extraction", 'Analysis and extraction settings'),
    ("'Activer l'IA'", "t('admin.products.enableAI')", "Activer l'IA", 'Enable AI'),
    ("'Analyse automatique'", "t('admin.products.automaticAnalysis')", 'Analyse automatique', 'Automatic analysis'),
    ("'Fournisseur'", "t('admin.products.provider')", 'Fournisseur', 'Provider'),
    ("'Clé API'", "t('admin.products.apiKey')", 'Clé API', 'API Key'),
    ("placeholder: `Entrez votre clé ${localSettings.provider}`", "placeholder: t('admin.products.enterApiKeyProvider', { provider: localSettings.provider })", 'Entrez votre clé {provider}', 'Enter your {provider} key'),
    ("'Modèle'", "t('admin.products.model')", 'Modèle', 'Model'),
    ("'Sélectionnez un modèle'", "t('admin.products.selectModel')", 'Sélectionnez un modèle', 'Select a model'),
    ("'Paramètres Avancés'", "t('admin.products.advancedSettings2')", 'Paramètres Avancés', 'Advanced Settings'),
    ("'Max Tokens'", "t('admin.products.maxTokens')", 'Max Tokens', 'Max Tokens'),
    ("'Taille PDF (MB)'", "t('admin.products.pdfSize')", 'Taille PDF (MB)', 'PDF Size (MB)'),
    ("'Auto-création'", "t('admin.products.autoCreate')", 'Auto-création', 'Auto-creation'),
    ("'Caractéristiques'", "t('admin.products.characteristicsLabel')", 'Caractéristiques', 'Characteristics'),
    ("'Tester l'IA'", "t('admin.products.testAI')", "Tester l'IA", 'Test AI'),
    ("'Test...'", "t('admin.products.testing')", 'Test...', 'Testing...'),
    ("'Connexion OK'", "t('admin.products.connectionOk')", 'Connexion OK', 'Connection OK'),
    # Toasts
    ('title: "Produit mis à jour"', "title: t('admin.products.productUpdated')", 'Produit mis à jour', 'Product updated'),
    ('title: "Produit ajouté"', "title: t('admin.products.productAdded')", 'Produit ajouté', 'Product added'),
    ('title: "Erreur de sauvegarde"', "title: t('admin.products.saveError')", 'Erreur de sauvegarde', 'Save error'),
    ('description: error.message || "Une erreur est survenue lors de l\'enregistrement."', "description: error.message || t('admin.products.saveErrorDesc')", "Une erreur est survenue lors de l'enregistrement.", 'An error occurred during saving.'),
    # Auth
    ('"Accès restreint"', 't("admin.products.requestAccess")', 'Accès restreint', 'Restricted access'),
    ('"Veuillez vous connecter pour accéder à cette section."', 't("admin.products.requestAccess")', 'Veuillez vous connecter pour accéder à cette section.', 'Please log in to access this section.'),
    ('title: "Mot de passe oublié ?"', "title: t('admin.products.forgotPassword')", 'Mot de passe oublié ?', 'Forgot password?'),
    ('"Entrez votre email pour demander une réinitialisation"', 't("admin.products.enterEmailReset")', 'Entrez votre email pour demander une réinitialisation', 'Enter your email to request a reset'),
    ('"Email envoyé !"', 't("admin.products.emailSent")', 'Email envoyé !', 'Email sent!'),
    ('"Vérifiez votre boîte de réception pour les instructions."', 't("admin.products.checkInbox")', 'Vérifiez votre boîte de réception pour les instructions.', 'Check your inbox for instructions.'),
    ('"Email associé au compte"', 't("admin.products.emailAssociated")', 'Email associé au compte', 'Email associated with account'),
    ('"Déjà un compte ?"', 't("admin.products.alreadyAccount")', 'Déjà un compte ?', 'Already have an account?'),
    ('"Créer un accès"', 't("admin.products.createAccess")', 'Créer un accès', 'Create an access'),
    ('"Retour à la connexion"', 't("admin.products.backToLogin")', 'Retour à la connexion', 'Back to login'),
]

modified_tsx = tsx
replaced_count = 0
for item in replacements:
    if len(item) == 4:
        old, new_tsx, fr_val, en_val = item
    else:
        old, new_tsx, fr_val = item
        en_val = fr_val
    if old in modified_tsx:
        modified_tsx = modified_tsx.replace(old, new_tsx)
        print(f'REPLACED: {fr_val[:60]}')
        replaced_count += 1
    else:
        print(f'NOT FOUND: {fr_val[:60]}')

print(f'\nTotal replaced: {replaced_count}/{len(replacements)}')

with open(TSX_PATH, 'w', encoding='utf-8') as f:
    f.write(modified_tsx)

# Update locales
with open(FR_JSON, encoding='utf-8') as f:
    fr = json.load(f)
with open(EN_JSON, encoding='utf-8') as f:
    en = json.load(f)

# Ensure admin.products exists
if 'products' not in fr['admin']:
    fr['admin']['products'] = {}
if 'products' not in en['admin']:
    en['admin']['products'] = {}

added = 0
for _, _, fr_val, en_val in replacements:
    key = fr_val  # Use French text as key for simplicity
    if key not in fr['admin']['products']:
        fr['admin']['products'][key] = fr_val
        en['admin']['products'][key] = en_val
        added += 1

with open(FR_JSON, 'w', encoding='utf-8') as f:
    json.dump(fr, f, indent=4, ensure_ascii=False)
with open(EN_JSON, 'w', encoding='utf-8') as f:
    json.dump(en, f, indent=4, ensure_ascii=False)

print(f'\nAdded {added} translation pairs')
print('Done!')

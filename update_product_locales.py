# -*- coding: utf-8 -*-
import json

FR_JSON = r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\fr.json'
EN_JSON = r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\en.json'

with open(FR_JSON, encoding='utf-8') as f:
    fr = json.load(f)
with open(EN_JSON, encoding='utf-8') as f:
    en = json.load(f)

fr.setdefault('admin', {}).setdefault('productPage', {})
en.setdefault('admin', {}).setdefault('productPage', {})

# All product page translations
pairs = {
    # Management list
    'managementTitle': ('Gestion des Produits', 'Product Management'),
    'productFormTitle': ('Fiche Produit', 'Product Sheet'),
    'characteristicsTitle': ('Caractéristiques', 'Characteristics'),
    'addProduct': ('Ajouter un produit', 'Add product'),
    'searchPlaceholder': ('Rechercher...', 'Search...'),
    'searchProductPlaceholder': ('Rechercher un produit...', 'Search a product...'),
    'filterByType': ('Filtrer par type', 'Filter by type'),
    'noProductsTitle': ('Aucun produit', 'No product'),
    'noProductsBody': ('Commencez par créer votre premier produit', 'Start by creating your first product'),
    'createProductButton': ('Créer un produit', 'Create a product'),
    # Cards/list
    'edit': ('Modifier', 'Edit'),
    'duplicate': ('Dupliquer', 'Duplicate'),
    'delete': ('Supprimer', 'Delete'),
    'hiddenProduct': ('Produit masqué', 'Hidden product'),
    # Delete confirmations
    'deleteConfirmTitle': ('Supprimer ?', 'Delete?'),
    'deleteConfirmBody': ('Supprimer ce produit ?', 'Delete this product?'),
    'irreversibleAction': ('Cette action est irréversible', 'This action is irreversible'),
    'cancel': ('Annuler', 'Cancel'),
    # Product form
    'productName': ('Nom du produit', 'Product name'),
    'productNamePlaceholder': ('Nom Du Produits', 'Product Name'),
    'screenType': ("Type d'écran", 'Screen type'),
    'flat': ('Plat', 'Flat'),
    'curved': ('Incurvé', 'Curved'),
    '360': ('360°', '360°'),
    'marketingSettings': ('Paramètres de commercialisation', 'Marketing settings'),
    'pricePerSqM': ('Prix public conseillé par m².', 'Recommended retail price per m².'),
    'oldPriceHint': ('Saisir un ancien prix pour afficher une réduction barré.', 'Enter an old price to show a strikethrough discount.'),
    'manageDimensions': ('Gérer les dimensions et le prix par dalle', 'Manage dimensions and price per tile'),
    'advancedSettings': ('Règlages Avancés', 'Advanced Settings'),
    'specifications': ('Spécifications Techniques', 'Technical Specifications'),
    'searchSpecPlaceholder': ('Rechercher une spécification...', 'Search a specification...'),
    'addCharacteristic': ('Ajouter une caractéristique', 'Add a characteristic'),
    'suggestedResults': ('Résultats suggérés', 'Suggested results'),
    'noResults': ('Aucun résultat', 'No results'),
    # Media
    'noVideo': ('Aucune vidéo', 'No video'),
    'replaceVideo': ('Remplacer la vidéo', 'Replace video'),
    'mediaPreview': ('Aperçu du média', 'Media preview'),
    'visualMediaType': ('Type de média visuel', 'Visual media type'),
    'mediaLink': ('Lien du média (URL)', 'Media link (URL)'),
    # Characteristics
    'chooseIcon': ('Choisir une icône', 'Choose an icon'),
    'orUploadIcon': ('Ou téléverser une icône personnalisée', 'Or upload a custom icon'),
    'charName': ('Nom de la caractéristique', 'Characteristic name'),
    'charVariants': ('Variantes de la caractéristique', 'Characteristic variants'),
    'exMeters': ('Ex: 2 mètres, 4 mètres...', 'Ex: 2 meters, 4 meters...'),
    'addImageIcon': ('Ajouter une image/icône', 'Add image/icon'),
    'charSaved': ('Caractéristique enregistrée !', 'Characteristic saved!'),
    'systemCharLocked': ('Caractéristique système (Verrouillée)', 'System characteristic (Locked)'),
    'editChar': ('Modifier la caractéristique', 'Edit characteristic'),
    'createChar': ('Créer une caractéristique', 'Create a characteristic'),
    'saving': ('Enregistrement...', 'Saving...'),
    'update': ('Mettre à jour', 'Update'),
    'save': ('Sauvegarder', 'Save'),
    'pin': ('Épingler', 'Pin'),
    'preventDelete': ('Empêcher suppression', 'Prevent deletion'),
    'iconColor': ('Couleur de l\'icône', 'Icon color'),
    'defaultAdd': ('Ajout par défaut', 'Default add'),
    'addCharacteristics': ('Ajouter des caractéristiques', 'Add characteristics'),
    'selectElements': ('SÉLECTIONNEZ LES ÉLÉMENTS À AJOUTER À LA FICHE', 'SELECT ITEMS TO ADD TO THE FILE'),
    'allAdded': ('Toutes les caractéristiques sont déjà ajoutées', 'All characteristics already added'),
    'selectedCount': ('{tempSelectedChars.length} sélectionnée(s)', '{tempSelectedChars.length} selected'),
    'continueEditing': ('Continuer l\'édition', 'Continue editing'),
    'createNew': ('Créer une nouvelle', 'Create a new one'),
    # AI Settings
    'aiConfigTitle': ('Configuration IA', 'AI Configuration'),
    'aiConfigDesc': ('Paramètres d\'analyse et d\'extraction', 'Analysis and extraction settings'),
    'enableAI': ('Activer l\'IA', 'Enable AI'),
    'automaticAnalysis': ('Analyse automatique', 'Automatic analysis'),
    'provider': ('Fournisseur', 'Provider'),
    'apiKey': ('Clé API', 'API Key'),
    'enterApiKeyProvider': ('Entrez votre clé {provider}', 'Enter your {provider} key'),
    'model': ('Modèle', 'Model'),
    'selectModel': ('Sélectionnez un modèle', 'Select a model'),
    'advancedSettings2': ('Paramètres Avancés', 'Advanced Settings'),
    'maxTokens': ('Max Tokens', 'Max Tokens'),
    'pdfSize': ('Taille PDF (MB)', 'PDF Size (MB)'),
    'autoCreate': ('Auto-création', 'Auto-creation'),
    'characteristicsLabel': ('Caractéristiques', 'Characteristics'),
    'testAI': ('Tester l\'IA', 'Test AI'),
    'testing': ('Test...', 'Testing...'),
    'connectionOk': ('Connexion OK', 'Connection OK'),
    'error': ('Erreur', 'Error'),
    # Auth
    'requestAccess': ('Demander un accès', 'Request access'),
    'createAdminAccount': ('Créez votre compte administrateur', 'Create your administrator account'),
    'min8chars': ('Minimum 8 caractères', 'Minimum 8 characters'),
    'forgotPassword': ('Mot de passe oublié ?', 'Forgot password?'),
    'enterEmailReset': ('Entrez votre email pour demander une réinitialisation', 'Enter your email to request a reset'),
    'emailSent': ('Email envoyé !', 'Email sent!'),
    'checkInbox': ('Vérifiez votre boîte de réception pour les instructions.', 'Check your inbox for instructions.'),
    'emailAssociated': ('Email associé au compte', 'Email associated with account'),
    'alreadyAccount': ('Déjà un compte ?', 'Already have an account?'),
    'createAccess': ('Créer un accès', 'Create an access'),
    'backToLogin': ('Retour à la connexion', 'Back to login'),
    # Misc
    'datasheetPresent': ('Fiche technique présente', 'Datasheet present'),
    'addDatasheet': ('Ajouter la fiche produit (PDF)', 'Add product datasheet (PDF)'),
    'officialDatasheet': ('Fiche technique officielle', 'Official datasheet'),
    'productUpdated': ('Produit mis à jour', 'Product updated'),
    'productAdded': ('Produit ajouté', 'Product added'),
    'copyOf': ('Copie de ', 'Copy of '),
    'saveError': ('Erreur de sauvegarde', 'Save error'),
    'saveErrorDesc': ('Une erreur est survenue lors de l\'enregistrement.', 'An error occurred during saving.'),
    'resetPixiatech': ('Rétablir les réglages Pixiatech', 'Reset Pixiatech settings'),
    'syncTitle': ('Synchronisation', 'Synchronization'),
    'syncDesc': ('Les réglages Pixiatech et le Wizard ont été synchronisés.', 'Pixiatech settings and Wizard have been synchronized.'),
    'charDetected': ("L'IA a détecté une caractéristique :", 'AI detected a characteristic:'),
    'charModified': ('La caractéristique "{name}" a été {editingId ? "modifiée" : "ajoutée"} avec succès.', 'Characteristic "{name}" was successfully {editingId ? "modified" : "added"}.'),
    'newCharDetected': ('Nouvelle caractéristique détectée !', 'New characteristic detected!'),
    'icon': ('Icône', 'Icon'),
    'uploadIcon': ('Téléverser une icône', 'Upload an icon'),
    'addToFile': ('Ajouter à la fiche', 'Add to file'),
    'availableChars': ('Caractéristiques disponibles ({characteristics.length})', 'Available characteristics ({characteristics.length})'),
    'startFirstProduct': ('Commencez par créer votre premier produit', 'Start by creating your first product'),
    # Environment/screen type labels
    'indoor': ('Intérieur', 'Indoor'),
    'outdoor': ('Extérieur', 'Outdoor'),
    'showcase': ('Vitrine', 'Showcase'),
    'semiOutdoor': ('Semi-extérieur', 'Semi-outdoor'),
    'purchase': ('Achat', 'Purchase'),
    'rental': ('Location', 'Rental'),
    'surfaceMin': ('Définit la surface minimale pour le calcul du devis.', 'Sets the minimum surface for quote calculation.'),
}

added_fr = 0
added_en = 0
for key, (fr_val, en_val) in pairs.items():
    if key not in fr['admin']['productPage']:
        fr['admin']['productPage'][key] = fr_val
        added_fr += 1
    if key not in en['admin']['productPage']:
        en['admin']['productPage'][key] = en_val
        added_en += 1

with open(FR_JSON, 'w', encoding='utf-8') as f:
    json.dump(fr, f, indent=4, ensure_ascii=False)
with open(EN_JSON, 'w', encoding='utf-8') as f:
    json.dump(en, f, indent=4, ensure_ascii=False)

print(f'Added {added_fr} FR keys, {added_en} EN keys to admin.productPage')


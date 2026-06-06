# -*- coding: utf-8 -*-
import json

with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\fr.json', encoding='utf-8') as f:
    fr = json.load(f)
with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\en.json', encoding='utf-8') as f:
    en = json.load(f)

fr_pp = fr.setdefault('admin', {}).setdefault('productPage', {})
en_pp = en.setdefault('admin', {}).setdefault('productPage', {})

missing_en = {
    'addProduct': 'Add product',
    'searchPlaceholder': 'Search...',
    'searchProductPlaceholder': 'Search a product...',
    'filterByType': 'Filter by type',
    'noProductsTitle': 'No product',
    'noProductsBody': 'Start by creating your first product',
    'createProductButton': 'Create a product',
    'edit': 'Edit',
    'duplicate': 'Duplicate',
    'delete': 'Delete',
    'hiddenProduct': 'Hidden product',
    'deleteConfirmTitle': 'Delete?',
    'deleteConfirmBody': 'Delete this product?',
    'irreversibleAction': 'This action is irreversible',
    'cancel': 'Cancel',
    'productName': 'Product name',
    'productNamePlaceholder': 'Product Name',
    'screenType': 'Screen type',
    'flat': 'Flat',
    'curved': 'Curved',
    '360': '360°',
    'marketingSettings': 'Marketing settings',
    'pricePerSqM': 'Recommended retail price per m².',
    'oldPriceHint': 'Enter an old price to show a strikethrough discount.',
    'manageDimensions': 'Manage dimensions and price per tile',
    'advancedSettings': 'Advanced Settings',
    'specifications': 'Technical Specifications',
    'searchSpecPlaceholder': 'Search a specification...',
    'addCharacteristic': 'Add a characteristic',
    'suggestedResults': 'Suggested results',
    'noResults': 'No results',
    'noVideo': 'No video',
    'replaceVideo': 'Replace video',
    'mediaPreview': 'Media preview',
    'visualMediaType': 'Visual media type',
    'mediaLink': 'Media link (URL)',
    'chooseIcon': 'Choose an icon',
    'orUploadIcon': 'Or upload a custom icon',
    'charName': 'Characteristic name',
    'charVariants': 'Characteristic variants',
    'exMeters': 'Ex: 2 meters, 4 meters...',
    'addImageIcon': 'Add image/icon',
    'charSaved': 'Characteristic saved!',
    'systemCharLocked': 'System characteristic (Locked)',
    'editChar': 'Edit characteristic',
    'createChar': 'Create a characteristic',
    'saving': 'Saving...',
    'update': 'Update',
    'save': 'Save',
    'pin': 'Pin',
    'preventDelete': 'Prevent deletion',
    'iconColor': 'Icon color',
    'defaultAdd': 'Default add',
    'addCharacteristics': 'Add characteristics',
    'continueEditing': 'Continue editing',
    'createNew': 'Create a new one',
    'aiConfigTitle': 'AI Configuration',
    'aiConfigDesc': 'Analysis and extraction settings',
    'enableAI': 'Enable AI',
    'automaticAnalysis': 'Automatic analysis',
    'provider': 'Provider',
    'apiKey': 'API Key',
    'enterApiKeyProvider': 'Enter your {provider} key',
    'model': 'Model',
    'selectModel': 'Select a model',
    'advancedSettings2': 'Advanced Settings',
    'maxTokens': 'Max Tokens',
    'pdfSize': 'PDF Size (MB)',
    'autoCreate': 'Auto-creation',
    'characteristicsLabel': 'Characteristics',
    'testAI': 'Test AI',
    'testing': 'Testing...',
    'connectionOk': 'Connection OK',
    'error': 'Error',
    'datasheetPresent': 'Datasheet present',
    'addDatasheet': 'Add product datasheet (PDF)',
    'officialDatasheet': 'Official datasheet',
    'productUpdated': 'Product updated',
    'productAdded': 'Product added',
    'copyOf': 'Copy of ',
    'saveError': 'Save error',
    'saveErrorDesc': 'An error occurred during saving.',
    'resetPixiatech': 'Reset Pixiatech settings',
    'syncTitle': 'Synchronization',
    'syncDesc': 'Pixiatech settings and Wizard have been synchronized.',
    'charDetected': 'AI detected a characteristic:',
    'charModified': 'Characteristic "{name}" was successfully {editingId ? "modified" : "added"}.',
    'newCharDetected': 'New characteristic detected!',
    'icon': 'Icon',
    'uploadIcon': 'Upload an icon',
    'addToFile': 'Add to file',
    'availableChars': 'Available characteristics ({characteristics.length})',
    'startFirstProduct': 'Start by creating your first product',
    'indoor': 'Indoor',
    'outdoor': 'Outdoor',
    'showcase': 'Showcase',
    'semiOutdoor': 'Semi-outdoor',
    'purchase': 'Purchase',
    'rental': 'Rental',
    'surfaceMin': 'Sets the minimum surface for quote calculation.',
}

added = 0
for k, v in missing_en.items():
    if k not in en_pp:
        en_pp[k] = v
        added += 1

with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\fr.json', 'w', encoding='utf-8') as f:
    json.dump(fr, f, indent=4, ensure_ascii=False)
with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\en.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, indent=4, ensure_ascii=False)

print(f'Added {added} missing EN keys to admin.productPage')

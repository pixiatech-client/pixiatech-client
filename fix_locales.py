# -*- coding: utf-8 -*-
import json
import re

with open(r'F:\PIXIATECH\new d\Estimation V3\src\app\admin\produits\ProductManagementClient.tsx', encoding='utf-8') as f:
    tsx = f.read()

with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\fr.json', encoding='utf-8') as f:
    fr = json.load(f)
with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\en.json', encoding='utf-8') as f:
    en = json.load(f)

# Ensure productPage exists
if 'productPage' not in fr['admin']:
    fr['admin']['productPage'] = {}
if 'productPage' not in en['admin']:
    en['admin']['productPage'] = {}

fr_pp = fr['admin']['productPage']
en_pp = en['admin']['productPage']

# Find all strings containing French characters
strings = re.findall(r'[\"\']([^\"\']{2,})[\"\']', tsx)
french_strings = set()
for s in strings:
    if re.search(r'[À-ÿ]', s) and len(s) > 2:
        french_strings.add(s)

print(f"Found {len(french_strings)} unique French strings")

# Translations
translations = {
    'Intérieur': ('Intérieur', 'Indoor'),
    'Semi-extérieur': ('Semi-extérieur', 'Semi-outdoor'),
    'Extérieur': ('Extérieur', 'Outdoor'),
    'Rechercher une spécification...': ('Rechercher une spécification...', 'Search a specification...'),
    'Fiche technique présente': ('Fiche technique présente', 'Datasheet present'),
    'Fichier enregistré': ('Fichier enregistré', 'File saved'),
    'Utilisateur D\u00e9mo': ('Utilisateur D\u00e9mo', 'Demo User'),
    'LuminositГ©': ('LuminositГ©', 'Brightness'),
    'RГ©solution': ('RГ©solution', 'Resolution'),
    'Гcran LED IntГ©rieur P1.2 High-End': ('Гcran LED IntГ©rieur P1.2 High-End', 'LED Screen Indoor P1.2 High-End'),
    'Totem LED ExtГ©rieur P2.5 Publicitaire': ('Totem LED ExtГ©rieur P2.5 Publicitaire', 'LED Totem Outdoor P2.5 Advertising'),
    'Гcran LED Transparent P3.9 Vitrine': ('Гcran LED Transparent P3.9 Vitrine', 'LED Transparent Screen P3.9 Showcase'),
    'BanniГЁre LED Sportive P10': ('BanniГЁre LED Sportive P10', 'LED Sports Banner P10'),
    'Гcran LED Flexible P2.5 Design': ('Гcran LED Flexible P2.5 Design', 'LED Flexible Screen P2.5 Design'),
    'AccГЁs restreint': ('AccГЁs restreint', 'Restricted access'),
    'Veuillez vous connecter pour accГ©der Г  cette section.': ('Veuillez vous connecter pour accГ©der Г  cette section.', 'Please log in to access this section.'),
    'La base de donnГ©es est temporairement indisponible.': ('La base de donnГ©es est temporairement indisponible.', 'Database is temporarily unavailable.'),
    'Erreur Base de donnГ©es': ('Erreur Base de donnГ©es', 'Database error'),
    'La connexion avec Google a Г©chouГ©.': ('La connexion avec Google a Г©chouГ©.', 'Google connection failed.'),
    'email de rГ©initialisation.': ('email de rГ©initialisation.', 'reset email.'),
    'Erreur lors de la crГ©ation du compte.': ('Erreur lors de la crГ©ation du compte.', 'Error creating account.'),
    'Veuillez renseigner une quantitГ© de stock pour la location.': ('Veuillez renseigner une quantitГ© de stock pour la location.', 'Please provide a stock quantity for rental.'),
    'Produit mis Г  jour': ('Produit mis Г  jour', 'Product updated'),
    'Produit ajoutГ©': ('Produit ajoutГ©', 'Product added'),
    'IA est dГ©sactivГ©e dans les paramГЁtres.': ('IA est dГ©sactivГ©e dans les paramГЁtres.', 'AI is disabled in settings.'),
    'Veuillez configurer votre clГ© API dans les paramГЁtres IA.': ('Veuillez configurer votre clГ© API dans les paramГЁtres IA.', 'Please configure your API key in AI settings.'),
    'est pas encore pleinement supportГ© pour l': ('est pas encore pleinement supportГ© pour l', 'is not yet fully supported for'),
    'Veuillez sГ©lectionner un fichier PDF.': ('Veuillez sГ©lectionner un fichier PDF.', 'Please select a PDF file.'),
    'Minimum 8 caractГЁres': ('Minimum 8 caractГЁres', 'Minimum 8 characters'),
    'CrГ©er le compte': ('CrГ©er le compte', 'Create account'),
    'CaractГ©ristiques': ('CaractГ©ristiques', 'Characteristics'),
    'IA a dГ©tectГ© une caractГ©ristique :': ('IA a dГ©tectГ© une caractГ©ristique :', 'AI detected a characteristic:'),
    'Luminosit\u00e9': ('Luminosit\u00e9', 'Brightness'),
    'R\u00e9solution': ('R\u00e9solution', 'Resolution'),
    '\u00c9cran LED Int\u00e9rieur P1.2 High-End': ('\u00c9cran LED Int\u00e9rieur P1.2 High-End', 'LED Screen Indoor P1.2 High-End'),
    'Totem LED Ext\u00e9rieur P2.5 Publicitaire': ('Totem LED Ext\u00e9rieur P2.5 Publicitaire', 'LED Totem Outdoor P2.5 Advertising'),
    '\u00c9cran LED Transparent P3.9 Vitrine': ('\u00c9cran LED Transparent P3.9 Vitrine', 'LED Transparent Screen P3.9 Showcase'),
    'Banni\u00e8re LED Sportive P10': ('Banni\u00e8re LED Sportive P10', 'LED Sports Banner P10'),
    '\u00c9cran LED Flexible P2.5 Design': ('\u00c9cran LED Flexible P2.5 Design', 'LED Flexible Screen P2.5 Design'),
    'Accès restreint': ('Accès restreint', 'Restricted access'),
    'Veuillez vous connecter pour accéder à cette section.': ('Veuillez vous connecter pour accéder à cette section.', 'Please log in to access this section.'),
    'La base de données est temporairement indisponible.': ('La base de données est temporairement indisponible.', 'Database is temporarily unavailable.'),
    'Erreur Base de données': ('Erreur Base de données', 'Database error'),
    'La connexion avec Google a échoué.': ('La connexion avec Google a échoué.', 'Google connection failed.'),
    'email de réinitialisation.': ('email de réinitialisation.', 'reset email.'),
    'Erreur lors de la création du compte.': ('Erreur lors de la création du compte.', 'Error creating account.'),
    'Veuillez renseigner une quantité de stock pour la location.': ('Veuillez renseigner une quantité de stock pour la location.', 'Please provide a stock quantity for rental.'),
    'Produit mis à jour': ('Produit mis à jour', 'Product updated'),
    'Produit ajouté': ('Produit ajouté', 'Product added'),
    'IA est désactivée dans les paramètres.': ('IA est désactivée dans les paramètres.', 'AI is disabled in settings.'),
    'Veuillez configurer votre clé API dans les paramètres IA.': ('Veuillez configurer votre clé API dans les paramètres IA.', 'Please configure your API key in AI settings.'),
    'est pas encore pleinement supporté pour l': ('est pas encore pleinement supporté pour l', 'is not yet fully supported for'),
    'Veuillez sélectionner un fichier PDF.': ('Veuillez sélectionner un fichier PDF.', 'Please select a PDF file.'),
    'Minimum 8 caractères': ('Minimum 8 caractères', 'Minimum 8 characters'),
    'Créer le compte': ('Créer le compte', 'Create account'),
}

added_fr = 0
added_en = 0
for fr_text, (fr_val, en_val) in translations.items():
    if fr_text not in fr_pp:
        fr_pp[fr_text] = fr_val
        added_fr += 1
    if fr_text not in en_pp:
        en_pp[fr_text] = en_val
        added_en += 1

with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\fr.json', 'w', encoding='utf-8') as f:
    json.dump(fr, f, indent=4, ensure_ascii=False)
with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\en.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, indent=4, ensure_ascii=False)

print(f'Added {added_fr} FR keys, {added_en} EN keys')

# Now generate replacements
print("\n=== REPLACEMENTS TO MAKE IN TSX ===")
for fr_text in sorted(translations.keys()):
    en_text = translations[fr_text][1]
    print(f'REPLACE: "{fr_text}" -> t("admin.productPage", {{ fallback: "{en_text}" }})')

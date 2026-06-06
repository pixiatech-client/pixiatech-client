# -*- coding: utf-8 -*-
import json, re

# Read extraction output
strings = []
with open(r'F:\PIXIATECH\new d\Estimation V3\extract_strings_output.txt', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        # Lines are like: "key": "value" or just "value"
        m = re.match(r'"([^"]+)":\s*"([^"]*)"$', line)
        if m:
            strings.append((m.group(1), m.group(2)))
        else:
            # Might be just a value
            if line.startswith('"') and line.endswith('"'):
                strings.append((line[1:-1], line[1:-1]))

print(f"Found {len(strings)} strings")

# English translations mapping
en_translations = {
    # Delete confirmations
    "Supprimer ?": "Delete?",
    "Non": "No",
    "Oui": "Yes",
    "Supprimer ce produit ?": "Delete this product?",
    "Cette action est irréversible": "This action is irreversible",
    "Annuler": "Cancel",
    "Supprimer": "Delete",
    
    # AI Settings
    "Configuration IA": "AI Configuration",
    "Paramètres d'analyse et d'extraction": "Analysis and extraction settings",
    "Activer l'IA": "Enable AI",
    "Analyse automatique": "Automatic analysis",
    "Fournisseur": "Provider",
    "Gemini": "Gemini",
    "OpenAI": "OpenAI",
    "Anthropic": "Anthropic",
    "Clé API": "API Key",
    f"Entrez votre clé {p}": f"Enter your {p} key",
    "Modèle": "Model",
    "Sélectionnez un modèle": "Select a model",
    "Paramètres Avancés": "Advanced Settings",
    "Max Tokens": "Max Tokens",
    "Taille PDF (MB)": "PDF Size (MB)",
    "Auto-création": "Auto-creation",
    "Caractéristiques": "Characteristics",
    "Action impossible": "Action impossible",
    
    # Buttons / actions
    "Tester l'IA": "Test AI",
    "Test...": "Testing...",
    "Connexion OK": "Connection OK",
    "Erreur": "Error",
    "Sauvegarder": "Save",
    "Enregistrer": "Save",
    "Enregistrement...": "Saving...",
    "Mettre à jour": "Update",
    "Modifier": "Edit",
    "Dupliquer": "Duplicate",
    "Éditer": "Edit",
    "Créer": "Create",
    "Créer un produit": "Create product",
    "Créer une nouvelle": "Create new",
    
    # Product form
    "Nom Du Produits": "Product Name",
    "Sélectionner un produit...": "Select a product...",
    "Rechercher une spécification...": "Search a specification...",
    
    # Characteristics
    "Choisir une icône": "Choose an icon",
    "Icône": "Icon",
    "Nom de la caractéristique": "Characteristic name",
    "Variantes de la caractéristique": "Characteristic variants",
    "Ex: 2 mètres, 4 mètres...": "Ex: 2 meters, 4 meters...",
    "Ajouter une image/icône": "Add image/icon",
    "Ajouter une caractérique": "Add a characteristic",
    "Caractéristique enregistrée !": "Characteristic saved!",
    "Caractéristique système (Verrouillée)": "System characteristic (Locked)",
    "Épingler": "Pin",
    "Ajout par défaut": "Default add",
    "Empêcher suppression": "Prevent deletion",
    "Couleur de l'icône": "Icon color",
    "Rétablir les réglages Pixiatech": "Reset Pixiatech settings",
    
    # Media
    "Aucune vidéo": "No video",
    "Remplacer la vidéo": "Replace video",
    "Aperçu du média": "Media preview",
    "Type de média visuel": "Visual media type",
    "Image": "Image",
    "Vidéo": "Video",
    "Lien du média (URL)": "Media link (URL)",
    
    # Pricing
    "Paramètres de commercialisation": "Marketing settings",
    "Prix public conseillé par m².": "Recommended retail price per m².",
    "Saisir un ancien prix pour afficher une réduction barré.": "Enter an old price to show a strikethrough discount.",
    "Gérer les dimensions et le prix par dalle": "Manage dimensions and price per tile",
    "Résultats suggérés": "Suggested results",
    "Aucun résultat": "No results",
    
    # Filters
    "Filtrer par": "Filter by",
    "Filtrer par type": "Filter by type",
    
    # Misc
    "Produit masqué": "Hidden product",
    "Spécifications Techniques": "Technical Specifications",
    "Quantité disponible": "Available quantity",
    "Toutes les caractéristiques sont déjà ajoutées": "All characteristics already added",
    "SÉLECTIONNEZ LES ÉLÉMENTS À AJOUTER À LA FICHE": "SELECT ITEMS TO ADD TO THE FILE",
    "Ajouter des caractéristiques": "Add characteristics",
    "Ajouter à la fiche": "Add to file",
    "{tempSelectedChars.length} sélectionnée(s)": "{tempSelectedChars.length} selected",
    "Continuer l'édition": "Continue editing",
    "Créer une nouvelle": "Create a new one",
    
    # Auth
    "Mot de passe oublié ?": "Forgot password?",
    "Entrez votre email pour demander une réinitialisation": "Enter your email to request a reset",
    "Email envoyé !": "Email sent!",
    "Vérifiez votre boîte de réception pour les instructions.": "Check your inbox for instructions.",
    "Email associé au compte": "Email associated with account",
    
    # Type d'écran
    "Type d'écran": "Screen type",
    "Incurvé": "Curved",
    "360°": "360°",
    "Plat": "Flat",
    "Semi-extérieur": "Semi-outdoor",
    "Intérieur": "Indoor",
    "Extérieur": "Outdoor",
    "Vitrine": "Showcase",
    "Achat": "Purchase",
    "Location": "Rental",
    
    # Other
    "Type de média visuel": "Visual media type",
    "Ou téléverser une icône personnalisée": "Or upload a custom icon",
    "Règlages Avancés": "Advanced settings",
    "Icône": "Icon",
    "Téléverser une icône": "Upload an icon",
    "L'IA a détecté une caractéristique :": "AI detected a characteristic:",
    'La caractéristique "{name}" a été {editingId ? "modifiée" : "ajoutée"} avec succès.': 'Characteristic "{name}" was successfully {editingId ? "modified" : "added"}.',
    "Rechercher une spécification...": "Search a specification...",
    "Type d'écran": "Screen type",
    "Paramètres de commercialisation": "Marketing settings",
    "Prix public conseillé par m².": "Recommended public price per m².",
    "Saisir un ancien prix pour afficher une réduction barré.": "Enter an old price to show a strikethrough discount.",
    "Gérer les dimensions et le prix par dalle": "Manage dimensions and price per tile",
    "Résultats suggérés": "Suggested results",
    "Aucun résultat": "No result",
    "Commencez par créer votre premier produit": "Start by creating your first product",
    "Demander un accès": "Request access",
    "Créez votre compte administrateur": "Create your admin account",
    "Déjà un compte ?": "Already have an account?",
    "Créer un accès": "Create an access",
    "Retour à la connexion": "Back to login",
    "Quantité disponible": "Available quantity",
}

# Translation helper
from deep_translator import GoogleTranslator

# Actually let's just do basic translations directly
translate_map = {
    "Ajout par défaut": "Default add",
    "Ajouter des caractéristiques": "Add characteristics",
    "Ajouter une caractéristique": "Add a characteristic",
    "Ajouter une image/icône": "Add image/icon",
    "Ajouter à la fiche": "Add to file",
    "Aperçu du média": "Media preview",
    "Aucun résultat": "No result",
    "Aucune vidéo": "No video",
    "Auto-création": "Auto-creation",
    "Caractéristique enregistrée !": "Characteristic saved!",
    "Caractéristique système (Verrouillée)": "System characteristic (Locked)",
    "Caractéristiques": "Characteristics",
    "Caractéristiques disponibles ({characteristics.length})": "Available characteristics ({characteristics.length})",
    "Cette action est irréversible": "This action is irreversible",
    "Choisir une icône": "Choose an icon",
    "Clé API": "API key",
    "Commencez par créer votre premier produit": "Start by creating your first product",
    "Continuer l'édition": "Continue editing",
    "Couleur de l'icône": "Icon color",
    "Créer un produit": "Create product",
    "Créer une nouvelle": "Create new",
    "Créez votre compte administrateur": "Create your administrator account",
    "Demander un accès": "Request access",
    "Définit la surface minimale pour le calcul du devis.": "Sets the minimum surface for quote calculation.",
    "Email associé au compte": "Email associated with account",
    "Email envoyé !": "Email sent!",
    "Empêcher suppression": "Prevent deletion",
    "Entrez votre email pour demander une réinitialisation": "Enter your email to request a reset",
    "Gérer les dimensions et le prix par dalle": "Manage dimensions and price per tile",
    "Icône": "Icon",
    "Incurvé": "Curved",
    "L'IA a détecté une caractéristique :": "AI detected a characteristic:",
    "La caractéristique \"{name}\" a été {editingId ? 'modifiée' : 'ajoutée'} avec succès.": "Characteristic \"{name}\" was successfully {editingId ? 'modified' : 'added'}.",
    "Lien du média (URL)": "Media link (URL)",
    "Modèle": "Model",
    "Mot de passe oublié ?": "Forgot password?",
    "Nom de la caractéristique": "Characteristic name",
    "Nouvelle caractéristique détectée !": "New characteristic detected!",
    "Ou téléverser une icône personnalisée": "Or upload a custom icon",
    "Paramètres Avancés": "Advanced Settings",
    "Paramètres d'analyse et d'extraction": "Analysis and extraction settings",
    "Paramètres de commercialisation": "Marketing settings",
    "Prix public conseillé par m².": "Recommended retail price per m².",
    "Produit masqué": "Hidden product",
    "Quantité disponible": "Available quantity",
    "Rechercher une spécification...": "Search specification...",
    "Remplacer la vidéo": "Replace video",
    "Règlages Avancés": "Advanced settings",
    "Résultats suggérés": "Suggested results",
    "Saisir un ancien prix pour afficher une réduction barré.": "Enter an old price to show a strikethrough discount.",
    "Spécifications Techniques": "Technical Specifications",
    "SÉLECTIONNEZ LES ÉLÉMENTS À AJOUTER À LA FICHE": "SELECT ITEMS TO ADD TO THE FILE",
    "Toutes les caractéristiques sont déjà ajoutées": "All characteristics already added",
    "Type d'écran": "Screen type",
    "Type de média visuel": "Visual media type",
    "Téléverser une icône": "Upload an icon",
    "Variantes de la caractéristique": "Characteristic variants",
    "Vérifiez votre boîte de réception pour les instructions.": "Check your inbox for instructions.",
    "Vidéo": "Video",
    "Épingler": "Pin",
    "{tempSelectedChars.length} sélectionnée(s)": "{tempSelectedChars.length} selected",
    "Tester l'IA": "Test AI",
    "Enregistrement...": "Saving...",
    "Produit mis à jour": "Product updated",
    "Produit ajouté": "Product added",
    "Configuration IA": "AI Configuration",
    "Synchronisation": "Synchronization",
    "Les réglages Pixiatech et le Wizard ont été synchronisés.": "Pixiatech settings and Wizard have been synchronized.",
    "Rétablir les réglages Pixiatech": "Reset Pixiatech settings",
    "Copie de ": "Copy of ",
    "Erreur de sauvegarde": "Save error",
    "Une erreur est survenue lors de l'enregistrement.": "An error occurred during saving.",
    "Fiche technique présente": "Datasheet present",
    "Ajouter la fiche produit (PDF)": "Add product datasheet (PDF)",
    "Fiche technique officielle": "Official datasheet",
    "Fichier enregistré": "File saved",
    "Minimum 8 caractères": "Minimum 8 characters",
    "Nouvelle caractéristique détectée !": "New characteristic detected!",
}

# Load locale files
with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\fr.json', 'r', encoding='utf-8') as f:
    fr_data = json.load(f)

with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

# Ensure admin.products exists
if 'products' not in fr_data.get('admin', {}):
    if 'admin' not in fr_data:
        fr_data['admin'] = {}
    fr_data['admin']['products'] = {}

if 'products' not in en_data.get('admin', {}):
    if 'admin' not in en_data:
        en_data['admin'] = {}
    en_data['admin']['products'] = {}

fr_products = fr_data['admin']['products']
en_products = en_data['admin']['products']

added_fr = 0
added_en = 0

for key, val in translate_map.items():
    if key not in fr_products:
        fr_products[key] = key  # Use same text for FR
        added_fr += 1
    if key not in en_products:
        en_products[key] = val
        added_en += 1

print(f"Added {added_fr} to FR, {added_en} to EN")

with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\fr.json', 'w', encoding='utf-8') as f:
    json.dump(fr_data, f, indent=4, ensure_ascii=False)

with open(r'F:\PIXIATECH\new d\Estimation V3\src\lib\locales\en.json', 'w', encoding='utf-8') as f:
    json.dump(en_data, f, indent=4, ensure_ascii=False)

print("Locale files updated successfully!")

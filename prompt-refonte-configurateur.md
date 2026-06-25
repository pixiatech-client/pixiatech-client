# Refonte UX/UI complète de la page de configuration

Analyse la capture d'écran actuelle et réalise une refonte professionnelle complète en utilisant les composants avancés du thème ProMax déjà installé.

## Problèmes identifiés

### 1. Bloc "Je suis une entreprise / Je suis un particulier"

Le sélecteur est actuellement mal positionné.

Actions demandées :

- Déplacer le sélecteur sur la partie gauche de la page.
- L'aligner horizontalement avec le titre principal.
- Le rendre plus visible avec un design moderne de type segmented control.
- Utiliser les composants ProMax existants.
- Ajouter des animations fluides lors du changement de profil.

---

### 2. Espacement vertical excessif

La page contient un grand vide entre :

- le sélecteur Entreprise / Particulier
- les étapes Écran / Livraison / Installation / Estimation

Actions demandées :

- Réduire fortement cet espace.
- Remonter le contenu principal.
- Améliorer la densité visuelle sans surcharger l'interface.
- Optimiser l'affichage desktop et mobile.

---

### 3. Message d'information administrateur

Le message affiché sous le header doit devenir entièrement pilotable depuis le back-office.

Actions demandées :

Créer dans :

Backend → Alertes système → Nouvelle alerte

les paramètres suivants :

- Activer / Désactiver l'affichage
- Titre de l'alerte
- Description
- Couleur principale
- Couleur du texte
- Icône
- Niveau :
  - Information
  - Succès
  - Avertissement
  - Erreur
- Date de début
- Date de fin

Le front-end doit récupérer automatiquement ces informations.

---

### 4. Refonte complète de la fenêtre "Nouvelle alerte"

La fenêtre actuelle est visuellement pauvre et peu professionnelle.

Refaire complètement l'interface en utilisant les composants ProMax.

Objectifs :

- Apparence SaaS premium
- Design moderne 2026
- Cartes élégantes
- Ombres douces
- Coins arrondis cohérents
- Hiérarchie visuelle claire
- Responsive
- Expérience administrateur haut de gamme

Ajouter :

- Prévisualisation temps réel de l'alerte
- Sélecteur de couleurs moderne
- Bibliothèque d'icônes
- Aperçu desktop/mobile
- Sauvegarde automatique des brouillons

---

### 5. Amélioration générale de la page

Objectifs :

- Réduire la sensation de vide.
- Améliorer le parcours utilisateur.
- Renforcer la cohérence visuelle.
- Utiliser au maximum les composants ProMax déjà disponibles.
- Donner une apparence premium comparable aux meilleures plateformes SaaS modernes.

Inspirations :

- Stripe
- Notion
- Linear
- Framer
- Vercel
- Shopify Plus

Important :

Ne pas effectuer de simples ajustements CSS. Réaliser une véritable refonte UX/UI professionnelle en exploitant pleinement les composants, animations et patterns disponibles dans le thème ProMax.

# Estimation V3

Application web Next.js pour la génération de devis et la gestion des clients.

## Stack Technique

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage, Hosting)
- **UI Components**: Radix UI, shadcn/ui
- **Gestion d'état**: React Context, React Hooks
- **PDF**: jsPDF, html2canvas
- **i18n**: Support multilingue (français, anglais)

## Structure du Projet

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── admin/              # Dashboard administrateur
│   │   ├── delivery/       # Gestion des frais de livraison
│   │   ├── labor/          # Configuration main d'œuvre
│   │   ├── quotes/         # Gestion des devis
│   │   ├── users/          # Gestion utilisateurs
│   │   ├── settings/       # Paramètres généraux
│   │   └── login/          # Authentification
│   ├── quote/              # Pages publiques de devis
│   │   ├── success/        # Page de succès
│   │   └── pending-verification/
│   └── embed/              # Mode embeddable
├── components/
│   ├── ui/                 # Composants UI réutilisables
│   ├── configurator.tsx    # Configurator principal
│   ├── quote-builder.tsx   # Constructeur de devis
│   └── ...
├── firebase/               # Configuration Firebase client/serveur
├── hooks/                  # Hooks personnalisés
└── lib/                    # Utilitaires, types, données
```

## Fonctionnalités

### Client
- Wizard de configuration de devis
- Sélection de produits avec options
- Calcul automatique des prix
- Upload d'images
- Génération PDF
- Mode multilingue

### Administrateur
- Dashboard avec statistiques
- Gestion des produits et services
- Configuration des frais de livraison par zone
- Gestion des utilisateurs et rôles
- Historique des devis
- Gestion des paramètres (PDF, thèmes, contenu)

## Commandes

```bash
npm run dev    # Démarrer le serveur de développement
npm run build  # Construire l'application
npm run start  # Démarrer en production
npm run lint   # Linting
```

## Variables d'Environnement

- Firebase configuration (firebase.json)
- API keys dans .env (voir .env.example)
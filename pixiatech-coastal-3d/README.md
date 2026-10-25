# Pixiatech — One Pixel to the City (prototype)

Démonstrateur indépendant React + Vite + Three.js / React Three Fiber.

## Ce que contient le prototype
- Scène 3D générée procéduralement : skyline, mer, front de port et écran LED 16:9.
- Travelling avant piloté par le scroll ; la caméra reste sur l'axe central de l'écran.
- Trafic animé en continu dans des voies opposées.
- Chargement d'une vidéo locale depuis le bouton « Changer la vidéo » ; la vidéo est affichée sur l'écran 16:9.
- Interface éditoriale sombre et mise en page responsive.
- Réglage de la résolution du Canvas selon la taille de l'écran.

## Lancer le projet
Prérequis : Node.js 20.19+ ou 22.12+ recommandé.

```bash
npm install
npm run dev
```

Ouvrir l'URL locale indiquée par Vite.

Build de production :
```bash
npm run build
npm run preview
```

## Notes importantes
C'est un prototype fonctionnel de trajectoire et d'interactivité, pas encore le rendu photoréaliste final. Les bâtiments, voitures et éléments de port sont des objets 3D procéduraux de démonstration. Pour le rendu premium demandé, l'étape suivante est de remplacer ces éléments par des assets PBR de haute qualité, des bâtiments réalistes, des véhicules 3D riggés et des textures photographiques licenciées, puis de profiler les performances sur mobiles réels.

La vidéo est chargée dans le navigateur depuis le fichier sélectionné : elle n'est pas envoyée à un serveur. Pour une intégration CMS, il faudra connecter un champ média existant ou un stockage d'assets de Pixiatech et gérer les URL autorisées.

Le prototype n'utilise pas de backend Node personnalisé : Vite fournit le serveur de développement et la compilation. Le déploiement de production peut être statique, sur un hébergement compatible.

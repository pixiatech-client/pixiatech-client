import type { InsightFaqItem } from './insights-articles-content';

export interface InsightArticleFr {
  contentFr: string;
  faqsFr: InsightFaqItem[];
}

export const INSIGHTS_ARTICLES_FR: Record<string, InsightArticleFr> = {
  'stadium-led-screens': {
    contentFr: `Un écran LED de stade n'est pas un produit unique mais un système de quatre : le tableau d'affichage ou écran vidéo principal, les panneaux de périmètre le long du terrain, les bandeaux (ribbons) sur le bord des tribunes et, dans les salles couvertes, le cube central suspendu au-dessus du terrain. L'un d'eux est jugé par une caméra de télévision plutôt que par le public. Ce guide montre comment spécifier chaque type, du pas de pixel et de la performance broadcast à la luminosité, à la structure et au contrôle, et se termine par deux exemples chiffrés.

## Les quatre types d'écrans LED dans une même enceinte

### Tableau d'affichage et écran vidéo principal

Le tableau principal porte le score, le chronomètre, les compositions, la vidéo en direct et les ralentis. Dans un stade ouvert il s'agit généralement d'une paire d'écrans aux deux extrémités, sur la structure de toiture ou une tour métallique, afin que chaque place voit au moins l'un des deux. À 40 à 120 m² par écran, c'est la plus grande surface de l'enceinte. Un tableau LED traditionnel n'affichait que des chiffres ; aujourd'hui le score n'est qu'une couche graphique sur une surface vidéo complète.

### Panneaux LED de périmètre le long du terrain

Les panneaux LED de périmètre remplacent les panneaux imprimés autour de l'aire de jeu. Ils sont bas, environ 0,9 à 1 m de haut, et longs : sur un terrain de football, la longueur le long de la touche opposée et derrière les deux buts atteint 240 à 260 m. Leur véritable public est à la maison, car ils font face à la caméra principale de diffusion et apparaissent dans chaque plan large. Ils sont donc spécifiés autour de la caméra et de la sécurité des joueurs, et non autour des tribunes.

### Bandeaux et fascia sur le bord des tribunes

Un bandeau (ribbon board), ou affichage fascia, est une bande LED longue et étroite sur le bord avant d'un niveau supérieur ou d'un balcon, de 0,6 à 1,2 m de haut et de plusieurs dizaines ou centaines de mètres de long. Il porte des boucles de sponsors, des statistiques et des messages de sécurité. Les bandeaux se lisent depuis l'autre côté de la cuvette, le pas peut donc être grossier ; suivre la courbe du niveau fait de la géométrie des modules et du câblage les véritables questions de conception.

### Cube central pour les salles couvertes

Une salle couverte n'a pas d'extrémité lointaine pour un écran ; l'écran vidéo est donc suspendu au-dessus du centre du terrain : quatre faces suspendues aux fermes de toiture sur des palans. Cet affichage central est le grand écran le plus proche de son public dans le sport, avec le premier rang à 15 m et le dernier à environ 40 m. C'est aussi une charge suspendue au-dessus des joueurs, ce qui place le poids et le gréage en tête de la spécification.

## Pas de pixel d'un écran LED de stade : partir de la vraie distance de vision

La règle de notre guide sur le pas de pixel vaut aussi en sport : le pas en millimètres correspond à peu près à la distance de vision confortable minimale en mètres, et l'image est la plus belle à deux ou trois fois cette distance. Le spectateur le plus proche d'un écran principal peut être à 50 m, la limite n'est donc pas la visibilité des pixels mais le nombre de pixels disponibles pour la vidéo et la hauteur de caractère lue depuis le siège le plus éloigné. Comme point de départ :

1.   0 1 Tableau d'affichage ou écran vidéo principal, stade ouvert, 50–150 m : P6 à P10.
2.   0 2 Cube central, salle couverte, 15–40 m : P3,9 à P5,9.
3.   0 3 Tableau en mur d'extrémité, salle couverte, 25–60 m : P4,8 à P6,9.
4.   0 4 Panneaux LED de périmètre : P6 à P10, confirmé par un test caméra.
5.   0 5 Bandeau lu depuis l'autre côté de la cuvette : P10 à P16 en extérieur, P6 à P10 en intérieur.

### Tableau vu de 50 à 150 m : P6 à P10

Par la seule règle de distance, un écran de 16 mm suffirait, mais un écran vidéo doit montrer un ralenti qui vaut d'être regardé. Un écran de 12,5 × 6,7 m compte environ 1 560 × 840 pixels en P8 et 1 250 × 670 en P10 ; en P16 la surface tombe à 780 × 420 et les visages deviennent des blocs. Pour le texte, prévoyez une hauteur de caractère d'au moins 1/300 de la distance de lecture la plus longue : 0,5 m à 150 m.

### Cube en salle couverte vu de 15 à 40 m : P3,9 à P5,9

Un cube se lit de 15 à 40 m et ses faces sont petites, souvent 10 à 25 m² chacune ; ces deux faits tirent le pas vers le bas. En P3,9 une face de 4,5 × 2,5 m compte 1 152 × 640 pixels, assez pour le ralenti et les statistiques côte à côte. En P5,9 elle compte environ 760 × 420, ce qui convient à une salle où le cube affiche surtout le score et le chronomètre. Un pas plus fin que P3,9 n'ajoute que du poids et de la puissance à une structure suspendue.

### Les panneaux de périmètre sont jugés par la caméra, pas par le public

Les spectateurs les plus proches sont à 10 à 20 m et regardent le match, pas le panneau. La caméra est à 60 à 90 m, mais elle zoome : dans un plan serré, le panneau peut occuper un tiers de l'image. Les pas de 6 à 10 mm sont courants, et la décision se prend en filmant un échantillon depuis les positions réelles des caméras. Un pas plus fin aide surtout en écartant le moiré des focales habituelles.

## Exigences broadcast : ce que voit la caméra

### Fréquence de rafraîchissement et taux de balayage

Un écran parfait à l'œil peut être inutilisable à la télévision : l'œil intègre la lumière dans le temps, alors qu'une caméra de diffusion l'échantillonne par tranches aussi courtes qu'un millième de seconde. La fréquence de rafraîchissement, la fréquence à laquelle les drivers redessinent les LED, est donc la première donnée à vérifier. À 1 920 Hz, un obturateur rapide surprend l'écran entre deux rafraîchissements et des bandes noires défilent sur le logo du sponsor. Le plancher pour une surface télévisée est de 3 840 Hz, et 7 680 Hz méritent d'être demandés près des positions en super-ralenti. Demandez aussi le taux de balayage : un pilotage statique ou à faible multiplexage garde chaque LED allumée sur une plus grande part de l'image.

### Échelle de gris à faible luminosité, couleur et moiré

Les matchs en soirée se jouent sous projecteurs avec les panneaux atténués à 20 ou 30 pour cent de la sortie de jour. De mauvaises puces de pilotage perdent des niveaux de gris en s'atténuant : les dégradés se cassent en bandes et les teintes de peau d'un ralenti deviennent tachées. La couleur doit être calibrée sur l'espace colorimétrique broadcast avec un point blanc réglable. Le moiré, l'interférence entre la grille LED et le capteur de la caméra, se réduit par un pas plus fin, un masque bien conçu et un test caméra avant commande. Inscrivez ces points dans le cahier des charges :

1.   0 1 Fréquence de rafraîchissement de 3 840 Hz ou plus, mesurée à la luminosité de match, pas à pleine puissance.
2.   0 2 Taux de balayage indiqué sur la fiche technique, avec pilotage à faible multiplexage sur les surfaces face caméra.
3.   0 3 Échelle de gris de 14 à 16 bits, démontrée à 20 pour cent de luminosité.
4.   0 4 Cadence d'image verrouillée sur le standard de diffusion, 50 Hz en Turquie et en Europe, avec une entrée genlock.
5.   0 5 Latence de deux à trois images au plus entre la caméra et le panneau.
6.   0 6 Un test filmé depuis les positions réelles des caméras, zoom serré inclus, avant réception.

## Panneaux LED de périmètre : sécurité des joueurs, inclinaison et publicité virtuelle

### Masque souple, rembourrage et résistance aux chocs

Un panneau de périmètre est le seul écran LED qu'un athlète est censé heurter à pleine vitesse ; il encaisse aussi des tirs de ballon à plus de 100 km/h. Sa face utilise donc un masque souple, une façade en caoutchouc ou polymère flexible sur chaque module au lieu d'un volet rigide, qui cède sous l'impact et ne coupe pas la peau. Le bord supérieur porte un coussin rembourré continu, les angles sont arrondis et rien ne dépasse côté terrain. Demandez le rapport d'essai d'impact.

### Angle d'inclinaison, hauteur et ligne de vue

Les modules de périmètre reposent sur des pieds arrière réglables qui inclinent la face vers l'arrière, typiquement de 0 à 15 degrés. L'inclinaison oriente la partie la plus lumineuse du faisceau LED vers la plateforme de la caméra principale. La hauteur est limitée par les lignes de vue des premiers rangs : 0,9 à 1 m est habituel. La ligne doit laisser des ouvertures pour l'accès d'urgence, les itinéraires de civière et le tunnel des joueurs, chacune fermée par une barrière à ouverture rapide.

### Incrustations de publicité virtuelle et règlements des fédérations

Les détenteurs de droits vendent de plus en plus la même position plusieurs fois, en remplaçant le contenu du panneau dans chaque flux régional par une incrustation virtuelle. Selon la méthode, les panneaux exigent une image sans scintillement verrouillée sur la caméra, une couleur uniforme le long de la ligne ou un mode spécial à cadence élevée : demandez donc quelle méthode utilise la compétition. Les fédérations et les organisateurs encadrent aussi les systèmes de périmètre en termes généraux : distance par rapport aux lignes, hauteur, luminosité et animation pendant le jeu, et rembourrage. Obtenez les règlements en vigueur pour votre sport et votre niveau et faites de la conformité une condition écrite.

## Écran LED de stade : luminosité et orientation par rapport au soleil

Un stade ouvert a besoin de 6 000 à 8 000 nits, une salle couverte de 1 500 à 2 500 nits. Les terrains de football sont souvent orientés nord-sud : l'écran côté nord, tourné vers le sud, fait face au soleil et se spécifie à 8 000 nits avec un masque très sombre, tandis que l'écran côté sud, tourné vers le nord, se contente de 6 500 nits. Les écrans tournés vers l'ouest encaissent le soleil rasant des fins d'après-midi. Le soir, sous les projecteurs, un écran laissé à pleine puissance éblouit le public et surexpose l'image caméra : un capteur de lumière ambiante doit l'atténuer.

## IP65, vent, structure et rapport d'étude

Un écran vidéo est une voile. Un écran de 84 m² monté à 25-30 m du sol subit une pression de vent de calcul de 1,2 à 1,5 kN par mètre carré, soit 100 à 125 kN de force horizontale sur l'acier, plus le poids des modules et, en Turquie, le cas sismique. Si l'écran est suspendu à la toiture, l'ingénieur de la toiture doit confirmer la charge. Un rapport d'étude signé par un ingénieur civil agréé est une condition d'installation. Les modules de périmètre sont scellés sur les deux faces et doivent résister aux jets d'arrosage ; les séries XR Arena et XR Vision couvrent ces cas.

## Salle de contrôle, vidéo en direct, ralenti et intégration du scoring

Les écrans sont la moitié visible du système. L'autre moitié est une salle de contrôle avec vue sur le terrain, où un opérateur mixe les flux caméra en direct, le ralenti instantané, les données de score et les contenus préparés. Le processeur doit mettre à l'échelle des signaux broadcast vers des résolutions inhabituelles : un bandeau de 200 × 1 m fait quelque 20 000 pixels de large en P10, qu'aucun format vidéo standard ne couvre. Le graphisme doit lire directement les consoles officielles de chronométrage et de score, et les affichages réglementaires comme les chronomètres de tir doivent rester allumés même si le système vidéo tombe.

### Redondance : double alimentation et double signal

Un écran noir devant un stade plein et une diffusion en direct, voilà la panne que la conception doit exclure. Chaque module reçoit les données de deux directions, en boucle alimentée par un contrôleur principal et un contrôleur de secours, de sorte qu'un câble rompu ne crée aucun trou visible. L'alimentation est répartie sur au moins deux arrivées indépendantes, de sorte qu'un disjoncteur déclenché éteint des modules alternés, pas tout l'écran. Les contrôleurs sont sur onduleur et la fibre suit deux chemins.

Le premier argument du LED dans une enceinte sportive est l'inventaire : un panneau statique porte un sponsor pour une saison, tandis qu'un panneau LED de périmètre en porte plusieurs en rotation et peut offrir à un partenaire tout l'anneau pour célébrer un but. Ce que cela vaut est un calcul commercial du club, pas une promesse qu'un fournisseur d'écran peut faire. Le second est l'expérience dans les tribunes : ralentis, statistiques, compositions, animations et messages de sécurité sur les mêmes surfaces.

> Un écran LED de stade a deux publics : le public, qui pardonne beaucoup, et la caméra de télévision, qui ne pardonne rien. Spécifiez pour la caméra et le public sera servi aussi.

## Maintenance : passerelles, accès et modules de rechange

Un module tombera en panne pendant la saison, et la question est la vitesse à laquelle un technicien peut l'atteindre. Les grands écrans vidéo sont entretenus par l'arrière depuis des passerelles intégrées à l'acier : un chemin à toutes les deux ou trois rangées de modules, 600 à 800 mm de largeur libre, des garde-corps et des points d'ancrage antichute, intégrés à l'étude structurelle dès le premier dessin. Les cubes centraux sont descendus au sol, les palans exigent donc une inspection et des essais de charge programmés. Un module de périmètre défaillant se remplace en quelques minutes si des rechanges sont sur site. Gardez 3 à 5 pour cent de modules de rechange du même lot.

## Exemple chiffré : un stade ouvert de 20 000 places

Prenez un stade de football ouvert de 20 000 places avec un terrain nord-sud. La place la plus éloignée est à environ 160 m de chaque extrémité en diagonale. Deux écrans principaux de 12,48 × 6,72 m se dressent aux extrémités opposées, chacun composé de 13 × 7 modules de 960 × 960 mm : 84 m² et 1 560 × 840 pixels en P8. L'écran côté nord, tourné vers le sud, est spécifié à 8 000 nits et celui côté sud à 6 500. Chacun culmine à environ 60 kW, moyenne près de 20 kW, et pèse quelque 3,5 tonnes en modules seuls.

Le périmètre court le long de la touche opposée et derrière les deux buts : environ 250 m de panneaux de 0,96 m de haut, 240 m² au total, en P8, avec masques souples, bord supérieur rembourré, rafraîchissement 3 840 Hz, inclinaison réglable jusqu'à 15 degrés et quatre barrières à ouverture rapide. Un bandeau de 1 m de haut sur le fascia du niveau supérieur des deux tribunes longues ajoute 2 × 110 m en P10. Tout est piloté depuis une salle de contrôle avec contrôleurs de secours, données en boucle et alimentations séparées.

## Exemple chiffré : une salle couverte de 5 000 places

Prenez maintenant une salle couverte de 5 000 places pour le basket et le volley, avec des distances de vision de 15 à 38 m. Un cube central de 4,5 × 2,5 m de côté, composé de modules de 960 × 960 mm, offre environ 45 m² de surface totale et 1 152 × 640 pixels par face en P3,9, avec un anneau de 1 m en dessous pour le score et le chronomètre. Chaque face culmine à environ 20 kW. Le cube est suspendu aux fermes de toiture et son poids total, structure et palans compris, atteint environ 3,5 tonnes.

Un écran de périmètre de 0,96 m de haut autour du terrain ajoute 120 m en P6. La salle reçoit les données de deux directions et l'alimentation de deux arrivées indépendantes. Un contrôleur de secours prend le relais en cas de défaillance. Tous les modules sont entretenus par l'arrière depuis des passerelles.

## FAQ — Questions fréquentes

Quel pas de pixel convient à un écran LED de stade ?
Pour un tableau d'affichage ou un écran vidéo lu de 50 à 150 m, choisissez P6 à P10 ; P8 est une réponse courante pour un écran d'environ 80 m². Un cube central en salle couverte lu de 15 à 40 m exige P3,9 à P5,9. Les panneaux de périmètre tournent en P6 à P10, confirmé par un test caméra.

Quelle doit être la luminosité d'un écran LED de stade ?
Un stade ouvert a besoin de 6 000 à 8 000 nits, la valeur la plus haute pour les écrans tournés vers le sud ou l'ouest face au soleil. Une salle couverte a besoin de 1 500 à 2 500 nits. Dans les deux cas, un capteur de lumière ambiante doit atténuer les écrans sous les projecteurs, pour qu'ils n'éblouissent pas le public et ne surexposent pas l'image caméra.

Pourquoi les panneaux LED de périmètre ont-ils besoin de 3 840 Hz ?
Parce que les caméras de diffusion utilisent des obturateurs rapides qui surprennent un écran à rafraîchissement lent entre deux redessins, ce qui apparaît à la télévision sous forme de bandes noires ou de scintillement sur le logo du sponsor. Une fréquence de 3 840 Hz ou plus, un faible taux de balayage et une bonne échelle de gris à luminosité réduite gardent l'image propre à la caméra.

Qu'est-ce qui rend un panneau LED de périmètre sûr pour les joueurs ?
Un masque souple sur chaque module, un bord supérieur rembourré continu, des angles arrondis et aucune partie saillante côté terrain. Le module repose sur des pieds arrière inclinés qui cèdent légèrement à l'impact, et les modules sont testés contre des tirs répétés. La ligne exige aussi des barrières à ouverture rapide sur les voies d'urgence.

Qu'est-ce qu'un cube LED central et combien pèse-t-il ?
Un cube central est un affichage LED à quatre faces suspendu au-dessus du centre d'un terrain couvert, souvent avec un anneau en dessous pour le score et le chronomètre. Pour une salle de 5 000 places, un cube d'environ 45 m² pèse 3 à 4 tonnes, cadre et palans compris, et l'ingénieur de la toiture doit approuver les charges ponctuelles.

Comment un écran LED de stade est-il protégé contre une panne pendant un match ?
Par la redondance à tous les niveaux. Les données atteignent chaque module de deux directions, alimentées par un contrôleur principal et un contrôleur de secours qui prend le relais automatiquement. L'alimentation est répartie sur des arrivées indépendantes, de sorte qu'un disjoncteur déclenché n'éteint jamais tout l'écran. Les contrôleurs tournent sur onduleur, et des modules de rechange du même lot sont gardés sur site.`,
    faqsFr: [
      {
        question: `Quel pas de pixel convient à un écran LED de stade ?`,
        answer: `Pour un tableau d'affichage ou un écran vidéo lu de 50 à 150 m, choisissez P6 à P10 ; P8 est une réponse courante pour un écran d'environ 80 m². Un cube central en salle couverte lu de 15 à 40 m exige P3,9 à P5,9. Les panneaux de périmètre tournent en P6 à P10, confirmé par un test caméra.`,
      },
      {
        question: `Quelle doit être la luminosité d'un écran LED de stade ?`,
        answer: `Un stade ouvert a besoin de 6 000 à 8 000 nits, la valeur la plus haute pour les écrans tournés vers le sud ou l'ouest face au soleil. Une salle couverte a besoin de 1 500 à 2 500 nits. Dans les deux cas, un capteur de lumière ambiante doit atténuer les écrans sous les projecteurs, pour qu'ils n'éblouissent pas le public et ne surexposent pas l'image caméra.`,
      },
      {
        question: `Pourquoi les panneaux LED de périmètre ont-ils besoin de 3 840 Hz ?`,
        answer: `Parce que les caméras de diffusion utilisent des obturateurs rapides qui surprennent un écran à rafraîchissement lent entre deux redessins, ce qui apparaît à la télévision sous forme de bandes noires ou de scintillement sur le logo du sponsor. Une fréquence de 3 840 Hz ou plus, un faible taux de balayage et une bonne échelle de gris à luminosité réduite gardent l'image propre à la caméra.`,
      },
      {
        question: `Qu'est-ce qui rend un panneau LED de périmètre sûr pour les joueurs ?`,
        answer: `Un masque souple sur chaque module, un bord supérieur rembourré continu, des angles arrondis et aucune partie saillante côté terrain. Le module repose sur des pieds arrière inclinés qui cèdent légèrement à l'impact, et les modules sont testés contre des tirs répétés. La ligne exige aussi des barrières à ouverture rapide sur les voies d'urgence.`,
      },
      {
        question: `Qu'est-ce qu'un cube LED central et combien pèse-t-il ?`,
        answer: `Un cube central est un affichage LED à quatre faces suspendu au-dessus du centre d'un terrain couvert, souvent avec un anneau en dessous pour le score et le chronomètre. Pour une salle de 5 000 places, un cube d'environ 45 m² pèse 3 à 4 tonnes, cadre et palans compris, et l'ingénieur de la toiture doit approuver les charges ponctuelles.`,
      },
      {
        question: `Comment un écran LED de stade est-il protégé contre une panne pendant un match ?`,
        answer: `Par la redondance à tous les niveaux. Les données atteignent chaque module de deux directions, alimentées par un contrôleur principal et un contrôleur de secours qui prend le relais automatiquement. L'alimentation est répartie sur des arrivées indépendantes, de sorte qu'un disjoncteur déclenché n'éteint jamais tout l'écran. Contrôleurs sur onduleur et modules de rechange du même lot gardés sur site.`,
      },
    ],
  },
  'led-screen-installation': {
    contentFr: `L'installation d'un écran LED est le moment où un bon produit devient un bon affichage ou une liste permanente de petits défauts : une couture visible à hauteur d'œil, un disjoncteur qui saute sur une diapositive blanche, un module qu'on ne peut atteindre sans échafaudage. Presque aucun de ces défauts ne vient des modules LED. Ils viennent d'un mur que personne n'a vérifié, d'un plan que personne n'a validé ou d'un circuit partagé avec l'éclairage. Ce guide détaille les sept étapes que PixiaTech suit sur chaque projet, de l'étude de site à la mise en service. La pose d'un mur LED en soi prend deux ou trois jours ; l'étude, les plans et l'infrastructure qui précèdent, puis la mise en service qui suit, décident du résultat.

## Étape 1. Étude de site : mur, accès, lumière et alimentation

Tout projet commence par une étude de site, et une visioconférence ne la remplace pas. La première question est : sur quoi l'écran sera-t-il fixé ? Le béton armé et l'acier structurel portent facilement un mur LED ; la brique creuse et le béton cellulaire exigent des tiges traversantes ou un cadre prenant appui du sol au plancher ; une cloison en plaque de plâtre ne porte rien, la charge doit donc atteindre la structure située derrière. L'étude de site doit couvrir les points suivants.

1.   0 1 Le type de mur et sa capacité portante, vérifiés par l'ingénieur du bâtiment ou par des essais d'arrachement sur des ancrages témoins.
2.   0 2 L'accès des modules : largeur des portes, ascenseur et sa charge utile, escaliers et quai de livraison.
3.   0 3 Les distances de vision la plus proche et la plus lointaine, qui déterminent le pas de pixel.
4.   0 4 L'éclairement (en lux) à l'emplacement de l'écran, à la lumière du jour la plus forte.
5.   0 5 L'alimentation : tableau divisionnaire, marge disponible, mise à la terre et cheminement des câbles.
6.   0 6 Les données : distance réelle du câble entre la baie et l'écran.
7.   0 7 L'accès de maintenance, par l'avant ou l'arrière, et ce qui se trouvera devant l'écran.

### Lumière ambiante et accès de maintenance

Un hall d'accueil éclairé à 300 à 500 lux se contente de 1 200 à 2 000 nits ; une vitrine de magasin en plein sud peut en exiger 5 000. En extérieur, la lumière du jour oblige à 5 000 à 8 000 nits et l'écran doit pouvoir chuter à 800 à 1 500 nits la nuit. Plus la distance de vision est courte, plus le pas doit être fin : en dessous de 3 m, P1,2 à P1,9 ; de 3 à 6 m, P2,5 à P4 ; de 6 à 12 m, P4 à P6. L'accès de maintenance fixe la profondeur : un écran entretenu par l'avant se pose à 60 à 100 mm du mur, alors qu'un entretien par l'arrière exige un couloir d'au moins 600 mm.

## Étape 2. Conception et plans : dimensions exactes, cadre et validation

Un mur LED ne se construit pas à une dimension arbitraire. Les dimensions finies sont un multiple entier du module, et les formats courants sont 500 × 500 mm, 500 × 1 000 mm et le module 16:9 de 600 × 337,5 mm. Une niche de 5,0 × 2,8 m accueille donc un écran de 4,8 × 2,7 m en modules 16:9 ou un écran de 5,0 × 2,5 m en modules de 500 mm, et l'architecte doit le savoir avant que la niche soit construite. La conception fixe l'implantation des modules, la dimension exacte, la résolution et chaque point d'entrée d'alimentation et de données.

### Ossature acier ou équerres murales, et calcul structurel

Derrière les modules se trouve soit un jeu d'équerres fixées à un mur sain, soit une ossature acier qui reporte la charge au sol et au plancher. Un calcul structurel couvre la charge permanente, les ancrages et, à Istanbul, l'action sismique ; en extérieur il ajoute le vent. Le plan réserve aussi une lame d'air de ventilation, typiquement 50 à 100 mm d'air libre derrière un mur entretenu par l'avant, avec des ouvertures en bas et en haut, pour que la chaleur s'échappe par convection au lieu de vieillir les alimentations.

### Exemple chiffré : un mur d'accueil fine pitch de 4,8 × 2,7 m

Prenons un mur d'accueil de 4,8 × 2,7 m en XR Fine au pas de 1,25 mm. Avec des modules de 600 × 337,5 mm, c'est 8 colonnes sur 8 rangées : 64 modules et 12,96 m². Chaque module porte 480 × 270 pixels, le mur est donc exactement en 3 840 × 2 160, un canevas 4K natif sans mise à l'échelle. À environ 27 kg/m², les modules pèsent environ 350 kg et le cadre ajoute environ 150 kg. La puissance de pointe approche 6,5 kW et la moyenne 2,2 kW, dont presque tout devient de la chaleur dans le hall.

Les plans d'exécution clôturent l'étape : élévation avec la grille des modules, coupe du mur, détails du cadre et des ancrages, schéma unifilaire et cheminement des données. Le client, l'architecte et l'ingénieur structure valident par écrit avant le lancement de la production, dernier moment où déplacer l'écran de 200 mm n'a aucune conséquence.

## Étape 3. Infrastructure électrique et données

L'alimentation et les données sont normalement achevées avant l'arrivée de l'équipe LED, et c'est là que les installations échouent le plus souvent. La consommation de pointe, 450 à 650 W/m² en intérieur fine pitch et 600 à 800 W/m² en extérieur, dimensionne les câbles et les disjoncteurs ; la consommation moyenne, environ un tiers de la pointe, dimensionne l'énergie et la charge thermique. L'écran reçoit des circuits dédiés depuis son propre tableau divisionnaire, jamais partagés avec l'éclairage ou les prises. Les disjoncteurs sont courbe C, pour absorber le courant d'appel de centaines d'alimentations, et chargés à 80 pour cent de leur calibre au maximum.

### Mise à la terre, protection contre les surtensions et onduleur

Pour le mur du hall, 6,5 kW répartis sur trois phases, c'est moins de 10 A par phase : une alimentation triphasée sur 3 × 16 A disjoncteurs est confortable. Chaque module est mis à la terre et l'ossature acier est reliée à la barre équipotentielle du bâtiment ; un cadre non relié est un défaut de sécurité et une source de bruit d'image. Un parasurtenseur de type 2 se place au tableau de l'écran, de type 1 et 2 combinés en extérieur. Le contrôleur, le lecteur et le switch réseau sont sur un petit onduleur en ligne, environ 1 kVA, pour qu'une chute de tension ne redémarre pas l'écran sur un écran noir.

### Données : CAT6, fibre et boucle de redondance

Chaque liaison gigabit depuis le contrôleur porte environ 650 000 pixels à 60 Hz ; le mur 4K de l'accueil exige donc au moins 13 ports, et nous en prévoyons 16, chacun alimentant quatre modules. Le CAT6 blindé est fiable jusqu'à la limite de 100 m du standard, et nous concevons au plus pour 80 m. Au-delà, en extérieur ou le long de câblages électriques lourds, la liaison passe en fibre : environ 300 m en multimode, des kilomètres en monomode. Une boucle de redondance ramène le dernier module de chaque chaîne vers un port de secours : un câble défaillant en milieu de chaîne fait perdre une ou deux images, pas une colonne noire.

## Étape 4. Structure et pose de l'écran LED

Le cadre est la pièce que personne ne voit et que tout le monde remarque. Les modules LED s'assemblent avec précision, ils reproduisent donc la surface sur laquelle ils sont fixés : un cadre qui se déforme de 3 mm donne un mur qui se déforme de 3 mm, et à un pas de 1,25 mm cela se voit par des coutures qui s'ouvrent et se referment sur l'image. L'objectif est une planéité de ±1 mm sur tout le cadre, et d'aplomb à la même tolérance, vérifiée au niveau laser et à la règle avant de lever le moindre module.

### Pose murale, sur socle ou suspendue

La pose murale est la norme pour les écrans intérieurs permanents : rails ou cadre soudé ancré à la structure, avec des lumières de réglage pour rattraper l'irrégularité du mur. La pose sur socle dresse l'écran sur un châssis de sol, repris au mur uniquement pour la stabilité, et convient aux murs faibles et aux stands. La suspension à une poutre ou au plancher est le langage des systèmes de location XR Event ; elle exige des points de levage certifiés avec une charge de travail connue, jamais une grille de faux plafond.

### Acier extérieur : galvanisation, charge de vent et étanchéité

En extérieur, l'acier est galvanisé à chaud après fabrication, et les assemblages sur site sont boulonnés plutôt que soudés pour préserver la couche de zinc. La charge de vent est calculée selon le lieu, la hauteur et le terrain, et elle gouverne souvent plus le dimensionnement que le poids. L'étanchéité parachève la structure : un habillage supérieur qui jette l'eau à l'écart des modules, des joues latérales fermées, un drainage en bas et des entrées de câbles par le bas via des presse-étoupes étanches.

### Exemple chiffré : un écran de façade de 6 × 4 m

Un écran de façade de 6 × 4 m en XR Vision à un pas de 6,9 mm utilise des modules de 500 × 1 000 mm sur 12 colonnes et 4 rangées : 48 modules, 24 m² et environ 864 × 576 pixels. Les modules pèsent environ 840 kg à 35 kg/m², et cadre, équerres et habillage portent le total près de deux tonnes. Une pression de vent de l'ordre de 1 kN/m² exerce environ 24 kN de force horizontale sur les ancrages. La charge de pointe est d'environ 17 kW et la moyenne d'environ 6 kW, sur une alimentation triphasée dédiée protégée en 3 × 40 A, la fibre portant le signal depuis la salle de contrôle.

## Étape 5. Assemblage des modules

L'ordre du montage compte. Nous commençons en bas au centre et construisons la première rangée vers l'extérieur dans les deux directions, car les erreurs augmentent avec la distance au point de départ. La première rangée est mise de niveau à un demi-millimètre près, car chaque rangée au-dessus hérite de sa ligne. Chaque module est verrouillé à ses voisins à la main, avec la même fermeté, et fixé au cadre avant de lever le suivant. Après chaque rangée, les coutures sont contrôlées à la jauge d'épaisseur sous lumière rasante : jeux et décalages doivent rester près de 0,1 mm, car à un pas de 1,25 mm une erreur de 0,2 mm se lit comme une ligne claire ou sombre.

### Manipulation des modules et précautions ESD

Sur les produits fine pitch, les modules voyagent séparément et se posent en dernier. Les LED des bords sont à une fraction de millimètre du bord, et un pouce négligent les arrache. Les modules restent dans leurs plateaux jusqu'à la pose, sont tenus par les bords avec des gants antistatiques et ne sont jamais posés face contre terre. Les techniciens portent des bracelets antistatiques reliés à la terre, car une décharge électrostatique affaiblit une puce de pilotage qui tombera en panne des semaines plus tard.

## Étape 6. Mapping, configuration et calibrage

Une fois l'écran sous tension, chaque carte de réception est chargée avec le fichier de configuration de son type de module, qui définit le mode de balayage, la fréquence de rafraîchissement et la profondeur d'échelle de gris. L'écran est ensuite mappé : quel port alimente quelle chaîne, dans quel ordre les modules sont reliés et où chacun se situe sur la surface. Une mire de test imprimant le numéro de port et de module sur chaque module confirme que l'écran correspond au plan.

### Calibrage, correction des coutures et mires de test

Une fois l'écran alimenté, le calibrage règle la couleur et l'échelle de gris par module puis sur toute la surface. Un motif de test qui affiche le numéro de port et de module sur chaque module confirme la correspondance entre l'écran et le plan. Le calibrage par module se fait en usine ; la vérification sur site confirme l'uniformité sous la lumière réelle de la pièce.

## Étape 7. Mise en service et réception

La mise en service commence par un rodage. L'écran fonctionne 48 à 72 heures sur un cycle d'images pleine couleur et de vidéo à forte luminosité pendant que l'équipe relève les températures. Les composants électroniques tombent le plus souvent en panne dans leurs premières heures de vie : une alimentation ou une poignée de LED défectueuses se manifestent donc en général pendant cette fenêtre, techniciens sur site et rechanges à portée de main.

Un programme de luminosité piloté par un capteur de lumière, un calendrier ou les deux garde l'écran confortable, peut-être 40 à 50 pour cent par jour clair et 15 à 20 pour cent le soir, ce qui prolonge aussi la durée de vie des LED. Le lecteur de contenu est verrouillé sur la résolution native de l'écran, pixel pour pixel. La formation des opérateurs prend environ deux heures. Des modules de rechange représentant 2 à 3 pour cent, issus du même lot de production, sont remis, car des LED d'un lot ultérieur diffèrent légèrement en couleur et apparaissent comme une tache.

### Le contenu du dossier de réception

1.   0 1 Les plans de récolement avec la grille des modules, les détails d'ancrage et l'étude structurelle.
2.   0 2 Le schéma unifilaire, la liste des disjoncteurs et les mesures de terre.
3.   0 3 Le plan des données avec l'implantation des ports et des modules, et les sauvegardes de configuration.
4.   0 4 Les fichiers de calibrage et le dossier de mise en service avec le journal de burn-in.
5.   0 5 Les modules de rechange, les numéros de série, les lots et les conditions de garantie.
6.   0 6 Le plan d'entretien, avec les intervalles recommandés et le contact du service.

## Combien de temps prend l'installation d'un écran LED ?

Un écran intérieur standard se met en service en deux à trois jours une fois l'infrastructure prête. Les projets extérieurs prennent plus longtemps : la structure, l'étude de vent, les autorisations et la logistique de levage peuvent ajouter plusieurs semaines. L'étude de site et les plans d'exécution qui précèdent la pose pèsent souvent plus lourd que la pose elle-même dans le délai total.

## Installation intérieure et extérieure : ce qui change

Les sept étapes sont les mêmes en intérieur et en extérieur ; leur poids se déplace. En intérieur, les points difficiles sont la précision et la finition : le fine pitch grossit chaque dixième de millimètre, et le mur se pose après le départ des métiers poussiéreux. En extérieur, les points difficiles sont la charge, l'eau et l'accès. Le vent gouverne l'acier, les modules et les connecteurs sont étanches IP65, la luminosité est dix fois celle de l'intérieur, et le soin apporté à l'alimentation et à la protection contre les surtensions l'est aussi. L'accès se fait par nacelle ou grue, souvent de nuit, et le calibrage se fait après la tombée du jour puis se revérifie en plein soleil.

## Les erreurs d'installation les plus courantes

1.   0 1 Fixer le cadre sur du placo, de la brique creuse ou un mur non vérifié.
2.   0 2 Terminer la niche avant d'avoir choisi le format des modules.
3.   0 3 Accepter un cadre non plan en espérant que le calibrage le masquera.
4.   0 4 Alimenter l'écran depuis un circuit partagé, ou dimensionner les disjoncteurs sur la moyenne.
5.   0 5 Laisser le cadre et les modules non reliés à la terre.
6.   0 6 Faire courir le câble cuivre au-delà de sa limite de longueur ou le long de câbles électriques.
7.   0 7 Fermer la cavité derrière l'écran sans chemin de ventilation.
8.   0 8 Poser les modules fine pitch pendant que la peinture ou le ponçage continue dans la pièce.
9.   0 9 Sauter le burn-in pour tenir une date d'ouverture.
10.   0 10 Accepter l'écran sans rechanges du même lot, sans sauvegardes ni plans de récolement.

## Ce qu'il faut préparer avant l'arrivée de l'équipe

La plupart des journées perdues sur site ne sont pas techniques : un ascenseur réservé par un autre corps d'état, un disjoncteur pas encore raccordé, un mur qui attend encore sa peinture. Nous demandons à chaque client de confirmer par écrit une semaine avant le début.

1.   0 1 Les plans d'exécution validés, signés, et un interlocuteur de site habilité à décider.
2.   0 2 Le mur ou la niche aux dimensions convenues, peint et sec, tous travaux poussiéreux terminés.
3.   0 3 Les circuits dédiés, la mise à la terre et le tableau divisionnaire installés, testés et sous tension.
4.   0 4 Le câble de données ou la fibre tiré et testé entre la baie et l'écran, avec un emplacement alimenté pour le contrôleur.
5.   0 5 Un accès dégagé, un monte-charge réservé et un local sec et verrouillable près du mur.
6.   0 6 Les permis de travail et les accueils sécurité ; en extérieur, l'autorisation municipale, le permis d'occupation de voirie et la position de la grue.
7.   0 7 Le contenu définitif ou de test à la résolution native, pour juger l'écran sur du vrai contenu.

## Sécurité : travail en hauteur et plans de levage

Un mur LED s'installe par des personnes travaillant au-dessus du sol, manipulant des charges de 8 à 40 kg près d'équipements électriques sous tension : la sécurité se planifie, elle ne se présume pas. Nous émettons une analyse de risques et un mode opératoire spécifiques au site ; toute personne travaillant en hauteur détient une formation à jour, les plateformes sont conduites par des opérateurs certifiés et les harnais sont ancrés à des points calculés. Les interventions extérieures exigent un plan de levage : charges, positions, capacité de la grue et chemin des câbles. L'écran se met hors tension et se verrouille avant toute intervention.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Combien de temps prend l'installation d'un écran LED ?`,
        answer: `Environ une semaine de travail sur site pour un mur d'accueil intérieur, burn-in de deux à trois jours compris, et six à neuf semaines entre le plan validé et la réception. Une façade extérieure demande deux à trois semaines sur site, et dix à quatorze semaines au total, acier et autorisations compris.`,
      },
      {
        question: `Peut-on monter un écran LED sur n'importe quel mur ?`,
        answer: `Non. Le béton armé et l'acier structurel portent directement un mur LED. La brique creuse et le béton cellulaire exigent des tiges traversantes ou un cadre prenant appui du sol au plancher, et le placo ne porte rien, la charge va donc à la structure derrière. L'étude de site confirme le type de mur et sa capacité portante, avec des essais d'arrachement en cas de doute.`,
      },
      {
        question: `De quelle alimentation un mur LED a-t-il besoin ?`,
        answer: `Des circuits dédiés dimensionnés sur la charge de pointe : 450 à 650 W/m² en intérieur fine pitch et 600 à 800 W/m² en extérieur, la consommation moyenne étant environ un tiers de cela. Les disjoncteurs sont chargés à 80 pour cent au plus, cadre et modules sont reliés à la terre, et la protection contre les surtensions et un petit onduleur protègent le contrôleur.`,
      },
      {
        question: `Quelle planéité doit avoir le cadre d'un mur LED ?`,
        answer: `De ±1 mm sur tout le cadre, et d'aplomb à la même tolérance. Les modules reproduisent la surface sur laquelle ils sont fixés, un cadre bombé produit donc des coutures qui s'ouvrent et se ferment sur l'image. Sur les murs fine pitch, le jeu entre modules doit rester près de 0,1 mm ; la correction logicielle ne fait qu'affiner un bon assemblage.`,
      },
      {
        question: `Que se passe-t-il pendant la mise en service d'un écran LED ?`,
        answer: `L'écran est mappé, calibré et lancé pour 48 à 72 heures de burn-in, afin que les pannes précoces de composants apparaissent pendant que l'équipe est encore sur site. Ensuite, le programme de luminosité et le lecteur de contenu sont réglés, les opérateurs sont formés, et les rechanges du même lot, les sauvegardes de configuration et les plans de récolement sont remis.`,
      },
      {
        question: `Que doit préparer le client avant l'installation d'un écran LED ?`,
        answer: `Un mur ou une niche fini et sans poussière, construit selon les plans validés ; des circuits dédiés et testés avec mise à la terre à l'emplacement de l'écran ; le câble de données ou la fibre testé depuis la baie ; un accès dégagé avec un monte-charge réservé ; et les permis de travail. En extérieur, ajoutez l'autorisation municipale et la position de la grue ou de la nacelle.`,
      },
    ],
  },
  'led-screen-power-consumption': {
    contentFr: `Combien consomme un écran LED est la deuxième question que pose un client après la taille, et la réponse de la fiche technique est presque toujours mal comprise. La valeur de pointe n'est atteinte que sur un signal pleine page blanche à pleine puissance, jamais en usage normal. Ce guide explique la différence entre puissance moyenne et puissance maximale, les ordres de grandeur par type d'écran, la méthode de calcul en kWh et les leviers pour réduire la facture.

## Combien consomme un écran LED : puissance moyenne et puissance maximale

Une fiche technique d'écran LED distingue toujours deux lignes : la consommation maximale et la consommation moyenne (ou typique). La maximale correspond à un contenu pleine page blanche à 100 pour cent de luminosité ; c'est elle qui dimensionne câbles, disjoncteurs et alimentations, car elle doit pouvoir être atteinte à tout moment. La moyenne correspond à un usage réel, avec des contenus variés et une luminosité souvent réduite ; c'est elle qui détermine la facture d'électricité. Confondre les deux revient soit à sous-dimensionner dangereusement l'installation, soit à surestimer fortement la consommation.

### Pourquoi la moyenne se situe autour d'un tiers

Sur un contenu vidéo classique, la luminosité moyenne de l'image tourne autour de 25 à 35 pour cent de la pleine échelle. Beaucoup de contenus sont majoritairement sombres ou de luminosité moyenne, les couleurs saturées n'allument qu'une ou deux des trois LED par pixel, et il y a peu de blanc pur. La puissance moyenne se situe donc le plus souvent autour d'un tiers de la puissance maximale.

## Watts par mètre carré typiques selon le type d'écran

La puissance se cite au mètre carré pour que des écrans de tailles différentes puissent être comparés. Les plages ci-dessous sont ce qu'affichent typiquement les produits actuels à la luminosité nominale ; ce ne sont pas les caractéristiques d'un modèle précis, et la ligne qui compte est celle de la fiche technique du produit qu'on vous propose.

1.   0 1 Intérieur fine pitch, comme XR Fine ou XR Ultra à 600–1 000 nits : maximum 400–650 W/m², moyenne 130–220 W/m².
2.   0 2 Extérieur en pose fixe, comme XR Vision ou XR Rugged à 5 000–8 000 nits : maximum 600–900 W/m², moyenne 200–300 W/m².
3.   0 3 Résille transparente, comme XR Air : plus basse sur les deux lignes, typiquement 200–400 W/m² au maximum et 70–130 W/m² en moyenne, car il y a beaucoup moins de LED au mètre carré et la majeure partie de la surface est ouverte.

Un écran extérieur est cinq à dix fois plus lumineux qu'un écran intérieur mais consomme moins du double par mètre carré, car il compte beaucoup moins de pixels et des LED plus grandes et plus efficaces. Les valeurs intérieures supposent la luminosité nominale : un mur d'accueil nominal à 800 nits mais exploité à 300 reste bien en dessous de la moyenne de sa propre fiche technique.

## La formule en kWh : calculer la consommation d'un écran LED

L'énergie, c'est la puissance multipliée par la durée. Pour un écran LED, la formule pratique est : surface en m² × W/m² en moyenne × heures de fonctionnement ÷ 1 000 = kWh. Les deux exemples ci-dessous utilisent des valeurs médianes où la moyenne vaut exactement un tiers du maximum ; remplacez-les par les lignes de votre propre fiche technique, et gardez le maximum à côté pour la conception électrique.

### Exemple 1 : un mur d'accueil intérieur de 12 m², 12 heures par jour

Prenons un mur d'accueil fine pitch de 12 m², avec un maximum de 450 W/m² et une moyenne de 150 W/m². Charge maximale : 12 × 450 = 5 400 W, soit 5,4 kW ; c'est la valeur pour le disjoncteur et le câble. Charge moyenne : 12 × 150 = 1 800 W, soit 1,8 kW. Allumé de 08h00 à 20h00, le mur consomme 1,8 kW × 12 h = 21,6 kWh par jour, et sur 365 jours 21,6 × 365 = 7 884 kWh par an.

### Exemple 2 : une façade extérieure de 40 m², 18 heures par jour

Prenons maintenant une façade extérieure de 40 m² avec un maximum de 750 W/m² et une moyenne de 250 W/m², allumée de 06h00 à minuit. Charge maximale : 40 × 750 = 30 000 W, soit 30 kW. Charge moyenne : 40 × 250 = 10 000 W, soit 10 kW. Énergie quotidienne : 10 kW × 18 h = 180 kWh. Énergie annuelle : 180 × 365 = 65 700 kWh. Cela suppose une luminosité de jour pendant les dix-huit heures, ce qu'aucun écran extérieur bien configuré ne devrait faire.

Appliquez une gradation nocturne et le chiffre change. Supposez que l'écran conserve la luminosité de jour pendant douze heures puis, après la tombée du jour, consomme 40 pour cent de la moyenne de jour, soit 4 kW au lieu de 10, pendant les six restantes. La journée devient 12 × 10 + 6 × 4 = 144 kWh et l'année 144 × 365 = 52 560 kWh : une réduction de 20 pour cent, 13 140 kWh par an, pour un seul réglage. Multipliez les kWh annuels par votre tarif pour obtenir le coût d'exploitation ; nous nous arrêtons aux kWh car les tarifs diffèrent selon le site, le contrat et l'année.

## Ce qui pilote réellement la consommation d'un écran LED

### Réglage de luminosité : le levier principal

La luminosité d'une LED se règle par la durée pendant laquelle elle reste allumée à chaque cycle de rafraîchissement, la puissance tirée par les LED chute donc presque linéairement avec le réglage de luminosité. Divisez la luminosité par deux et la part des LED dans la charge est divisée par deux ; seule l'électronique fixe demeure. Un mur intérieur qui a besoin de 300 nits en lumière de bureau mais reste à son réglage d'usine de 800 nits consomme plus du double d'énergie pour une image seulement plus fatigante à regarder.

### Contenu : fonds blancs contre fonds sombres

Parce que chaque pixel est sa propre source de lumière, l'image elle-même est une charge. Une diapositive entièrement blanche allume les trois LED de chaque pixel ; une zone noire ne consomme presque rien ; une primaire saturée allume une LED sur trois. Un gabarit à fond blanc peut consommer trois à quatre fois ce que la même information consomme sur fond sombre, sur le même écran et à la même luminosité.

### Pas de pixel, package LED et conception du driver

Le pas de pixel fixe le nombre de LED et de canaux de driver par mètre carré : environ 694 000 pixels à 1,2 mm contre 10 000 à 10 mm. Chaque LED fine pitch fonctionne à un très faible courant, mais les puces de driver qui les desservent ajoutent une charge fixe qui ne baisse pas avec la luminosité, d'où un plancher de consommation sur écran noir plus élevé en fine pitch. Le taux de balayage et la fréquence de rafraîchissement influencent ce plancher, et les drivers actuels à économie dynamique coupent les canaux dont les pixels sont noirs. Les puces LED récentes et les packages flip-chip COB offrent plus de lumière par watt.

### Rendement et facteur de puissance des alimentations

Chaque watt utilisé par les modules traverse une alimentation à découpage qui convertit la tension du réseau vers les 3–5 V nécessaires aux LED, et cette perte de conversion se paie chaque heure. Une alimentation de rendement 85 pour cent tire de la prise environ 8 pour cent de plus qu'une alimentation à 92 pour cent pour la même image. La correction active du facteur de puissance maintient celui-ci à 0,95 ou mieux, ce qui réduit le courant et l'échauffement des câbles.

### Température ambiante, chaleur et durée de vie

La chaleur joue deux fois contre le rendement : les LED émettent moins de lumière par watt à mesure que leur température de jonction s'élève, et les alimentations perdent en rendement en haut de leur plage. Le lien joue aussi dans l'autre sens. Chaque watt qui ne devient pas de la lumière devient de la chaleur à l'intérieur du module, et la chaleur vieillit les LED, dessèche les condensateurs et fatigue les joints de soudure. Un écran exploité à la luminosité dont il a besoin est plus léger sur le compteur et se dégrade plus lentement.

> Dimensionnez le câble sur le maximum, budgétez l'énergie sur la moyenne, et concentrez vos efforts sur le réglage de luminosité : rien d'autre ne fait bouger le compteur autant.

## LED à cathode commune : consommation réduite et écran plus frais

Dans un module à anode commune classique, les LED rouge, verte et bleue partagent une seule tension d'alimentation, généralement entre 4,2 et 5 V. Or une LED rouge n'a besoin que d'environ 2 V pour conduire, et les vertes et bleues d'environ 3 V. La différence doit aller quelque part : elle est dissipée dans l'étage de pilotage et transformée en chaleur à l'arrière du module, sans rien apporter à l'image.

Le pilotage à cathode commune inverse la disposition. Les LED partagent la cathode et chaque couleur reçoit sa propre tension d'alimentation, environ 2,8 V pour le rouge et 3,8 V pour le vert et le bleu, adaptée à ce dont la puce a besoin. Moins de tension est gaspillée, donc moins de puissance est tirée pour la même lumière. Les fabricants annoncent des économies allant jusqu'à environ un quart à la moitié par rapport à un module à anode commune équivalent ; le chiffre réel dépend du contenu, de la luminosité et du produit auquel on le compare, lisez donc la borne haute comme un meilleur cas plutôt qu'une promesse.

Le second bénéfice est la chaleur. L'énergie qui n'est pas gaspillée dans l'étage de pilotage ne réchauffe pas le module, et les écrans à cathode commune fonctionnent typiquement plusieurs degrés, parfois plus de dix, plus frais en surface. Cela aide les murs vus de près, la charge de climatisation et la durée de vie. La contrepartie est un module légèrement plus complexe et une alimentation à deux tensions de sortie, ce qui explique que la technologie apparaisse d'abord en fine pitch et en extérieur haut de gamme.

## Économies d'énergie : réglages et techniques qui marchent

Une fois le matériel choisi, l'essentiel de l'économie restante vient de la configuration de l'écran et de ce qu'il affiche. Aucune des mesures ci-dessous ne dégrade la qualité d'image ; un écran trop lumineux pour son environnement est plus laid, pas plus beau.

1.   0 1 Capteur de luminosité automatique : un capteur de lumière alimente le contrôleur, qui suit la lumière du jour selon une courbe que vous définissez. En extérieur, c'est la mesure la plus efficace, car la pleine luminosité n'est nécessaire que quelques heures autour de midi.
2.   0 2 Gradation nocturne et programmation de luminosité : sans capteur, un calendrier horaire fait l'essentiel du travail. Après la tombée du jour, un écran extérieur a besoin de 10–20 pour cent de sa luminosité de jour ; au-delà, c'est de l'éblouissement, pas de la visibilité.
3.   0 3 Contenus à fond sombre : texte coloré ou blanc sur fond sombre plutôt que l'inverse. Sur la signalétique et les tableaux de bord, cela peut à lui seul diviser la consommation par deux à luminosité égale.
4.   0 4 Alimentations à haut rendement : au-dessus de 90 pour cent de rendement, avec correction active du facteur de puissance, chargées à 80 pour cent au plus de leur puissance nominale.

### Écran noir en veille contre extinction complète

Un écran qui affiche du noir n'est pas éteint. Les alimentations, les cartes de réception et les puces de driver restent alimentées, et la charge à vide est typiquement de l'ordre de 30–80 W par m², plus élevée en fine pitch. Sur le mur d'accueil de 12 m², cela représente plusieurs centaines de watts à chaque heure de fermeture ; un contacteur horaire au tableau la ramène à zéro. En extérieur dans les climats froids ou humides, une nuit en faible luminosité ou en veille garde les modules au chaud et au sec, et la petite charge de veille est un juste échange.

## Infrastructure électrique : dimensionner sur le maximum, budgéter sur la moyenne

La conception électrique utilise l'autre ligne de la fiche technique. Câbles, disjoncteurs et tableaux doivent porter la charge maximale, car une image blanche à pleine luminosité peut survenir à tout moment et les dispositifs de protection ne connaissent pas les moyennes. La pratique courante consiste à prendre le maximum, à ajouter une marge de 20–25 pour cent et à dimensionner l'alimentation à partir de là.

### Disjoncteurs, câbles et distribution triphasée

Le mur d'accueil de 12 m² à 5,4 kW tire environ 25 A sur une seule phase 230 V, ce qui est possible mais laisse peu de marge ; le répartir sur trois phases est plus propre. La façade de 40 m² à 30 kW est une charge triphasée par nécessité : à 400 V avec un facteur de puissance de 0,95 elle tire environ 46 A par phase, contre environ 137 A sur une seule. Les modules sont groupés pour équilibrer les phases, et chaque circuit final n'alimente que le nombre de modules que son disjoncteur autorise à pleine puissance. Sur les longues lignes extérieures, vérifiez aussi la chute de tension.

### Courant d'appel et démarrage échelonné

À la mise sous tension, les condensateurs de chaque alimentation se chargent en même temps, et pendant quelques millisecondes chaque alimentation peut tirer plusieurs fois son courant de fonctionnement. Une alimentation isolée est inoffensive ; deux cents qui démarrent ensemble font sauter un disjoncteur parfaitement adapté à la charge de fonctionnement. Les remèdes sont standards : disjoncteurs à courbe C ou D, alimentations à limitation du courant d'appel, et un tableau qui démarre l'écran par groupes, un contacteur après l'autre à intervalles d'une à deux secondes.

### Charge thermique et climatisation

La quasi-totalité de l'électricité tirée par un écran LED finit en chaleur dans la pièce. Un watt vaut 3,412 BTU par heure, donc le mur d'accueil qui consomme 1,8 kW en moyenne ajoute environ 6 100 BTU/h, et son maximum de 5,4 kW correspond à environ 18 400 BTU/h. Donnez les deux valeurs à l'ingénieur fluides : la moyenne pour la charge de refroidissement saisonnière, le maximum pour une salle de contrôle ou un studio où le mur peut rester lumineux pendant des heures.

### Dimensionnement de l'onduleur : le contrôleur, pas l'écran

Une alimentation sans coupure dimensionnée pour tout le mur serait volumineuse et rarement justifiée. Ce qu'il faut protéger, c'est la chaîne de contrôle : contrôleur vidéo, lecteur multimédia, commutateur réseau et éventuels convertisseurs fibre, soit ensemble quelques centaines de watts. Un petit onduleur en ligne les fait passer les creux de tension et les basculements de groupe, de sorte que le mur retrouve l'image en quelques secondes après le retour du courant au lieu d'attendre un redémarrage.

## Comment lire les lignes de puissance d'une fiche technique

Cherchez quatre lignes : consommation maximale, consommation moyenne ou typique, tension d'entrée, et la luminosité à laquelle la puissance a été mesurée. Vérifiez d'abord l'unité. Certaines fiches citent des watts par module plutôt que par mètre carré ; divisez par la surface du module. Un module de 500 × 500 mm fait 0,25 m², donc 120 W maximum par module équivaut à 480 W/m². Si seul un maximum est donné, un tiers de cette valeur est une moyenne de planification raisonnable, mais demandez la valeur mesurée.

Méfiez-vous des moyennes trop flatteuses. Une moyenne annoncée au quart du maximum ou moins peut avoir été mesurée à luminosité réduite ou avec du contenu sombre. Ces questions remettent deux offres sur un pied d'égalité.

1.   0 1 À quelle luminosité, et avec quel contenu, la puissance moyenne a-t-elle été mesurée ?
2.   0 2 Le module est-il à cathode commune ou à anode commune, et les puces de driver disposent-elles d'une économie dynamique ?
3.   0 3 Quels sont le rendement et le facteur de puissance des alimentations ?
4.   0 4 Que consomme l'écran par m² sur un écran noir, et peut-il être éteint complètement par programmation ?
5.   0 5 Quel est le courant d'appel par module, et combien de modules peuvent partager un disjoncteur ?
6.   0 6 Quelle est la dissipation thermique par m², et quel dégagement le module nécessite-t-il derrière lui ?

## LED face aux murs LCD et à la projection par mètre carré

Un mur d'images LCD produit sa lumière avec un rétroéclairage qui reste allumé derrière tout le panneau et la bloque là où l'image est sombre. Sa consommation est donc presque constante, largement indépendante du contenu, et à 500–700 nits, typiques des dalles de mur d'images, elle est globalement du même ordre par mètre carré que la moyenne d'un mur LED intérieur fine pitch à luminosité nominale. La différence apparaît à l'usage : la consommation d'un LED baisse avec les contenus sombres et à chaque palier de gradation, tandis que le mur LCD change peu.

Un projecteur tire sa puissance nominale quel que soit le contenu, et la lumière doit parcourir la distance jusqu'à un écran et revenir par réflexion, donc la luminosité reçue par le spectateur par watt est très inférieure à celle d'un affichage à vision directe. Dans un hall éclairé, égaler la lisibilité d'un mur LED demande une telle puissance de projection que toute économie sur le papier disparaît. Dans un auditorium sombre, la projection demeure un choix sensé et peu énergivore ; en lumière ambiante, le LED à vision directe offre plus d'image visible par kWh.

## Planifier l'alimentation avec le projet

L'alimentation se conçoit au mieux dès la phase de conception, avec le refroidissement et la stratégie de luminosité. PixiaTech livre chaque proposition avec la charge maximale et moyenne en kW, les kWh annuels attendus pour vos heures de fonctionnement, la charge thermique pour l'ingénieur fluides et un schéma unifilaire pour l'électricien. Si vous planifiez un écran et voulez ces chiffres pour votre site, laissez un bref descriptif sur la page Démarrer un projet et notre équipe reviendra avec un calcul fondé sur vos dimensions, vos horaires et votre contenu.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Combien d'électricité consomme un écran LED ?`,
        answer: `À titre indicatif, un mur intérieur de 12 m² à 150 W/m² en moyenne pendant 12 heures consomme environ 21,6 kWh par jour, soit 7 884 kWh par an ; un écran extérieur de 40 m² à 250 W/m² en moyenne pendant 18 heures consomme environ 180 kWh par jour. La consommation réelle d'un écran LED est typiquement un tiers du maximum de la fiche technique.`,
      },
      {
        question: `Combien de watts par mètre carré consomme un écran LED ?`,
        answer: `Les écrans intérieurs fine pitch tirent typiquement 400–650 W/m² au maximum et 130–220 W/m² en moyenne. Les écrans extérieurs en pose fixe tirent 600–900 W/m² au maximum et 200–300 W/m² en moyenne. La résille transparente est plus basse sur les deux lignes. Le maximum ne s'applique qu'au blanc pur à 100 pour cent de luminosité.`,
      },
      {
        question: `Comment calculer les kWh d'un écran LED ?`,
        answer: `Multipliez la surface de l'écran en m² par la puissance moyenne en W/m² et par les heures de fonctionnement, puis divisez par 1 000. Par exemple, 40 m² × 250 W/m² × 18 h ÷ 1 000 = 180 kWh par jour, et 180 × 365 = 65 700 kWh par an. Utilisez la ligne moyenne pour l'énergie et la ligne maximale pour les câbles et les disjoncteurs.`,
      },
      {
        question: `Qu'est-ce que le LED à cathode commune et combien d'énergie économise-t-il ?`,
        answer: `Le pilotage à cathode commune alimente les LED rouges à une tension plus basse que les vertes et bleues, au lieu d'alimenter les trois depuis une seule tension en dissipant l'excédent en chaleur. Selon le contenu et la luminosité, la consommation baisse jusqu'à environ un quart à la moitié par rapport à un module à anode commune équivalent, et l'écran fonctionne nettement plus frais.`,
      },
      {
        question: `Baisser la luminosité réduit-elle la consommation d'un écran LED ?`,
        answer: `Oui, et c'est le levier le plus efficace. La puissance tirée par les LED chute presque linéairement avec le réglage de luminosité : à 50 pour cent de luminosité, l'étage LED consomme près de la moitié de l'énergie. Un capteur de lumière ambiante ou un calendrier avec gradation nocturne réduit couramment la consommation annuelle d'un écran extérieur d'un cinquième ou plus.`,
      },
      {
        question: `Un écran LED consomme-t-il de l'électricité quand il affiche du noir ?`,
        answer: `Oui. Sur un écran noir, les LED sont éteintes, mais les alimentations, les cartes de réception et les puces de driver restent alimentées, tirant typiquement de l'ordre de 30–80 W par m². Seule une extinction complète, généralement un contacteur horaire au tableau, ramène la consommation à zéro.`,
      },
    ],
  },
  'cob-fine-pitch': {
    contentFr: `Un écran LED à montage direct est une dalle de petites puces rouge, verte et bleue soudées une par une sur le circuit imprimé, protégées par une couche de résine. En dessous d'environ 1,2 mm de pas, les puces sont si proches que ce sont les parois de plastique, et non la lumière, qui dominent la surface — et chaque paquet est un point en relief qu'un doigt, une chaise ou un chiffon peut détacher. Les paquets mini-LED SMD poussent cela jusqu'à 0,9 mm, mais la surface reste une grille de pièces séparées.

## COB : les puces montées sur la carte

Le chip-on-board (COB) monte les puces LED nues directement sur le circuit imprimé et scelle tout le module sous une couche de résine continue. La surface devient un plan : aucun interstice, rien à détacher, des noirs plus profonds grâce à la résine sombre, un angle de vision plus large parce qu'il n'y a pas de parois de paquet, et un module que l'on peut essuyer proprement. Les modules COB répartissent aussi la chaleur sur la carte au lieu de la concentrer dans chaque paquet.

## Flip-chip : moins de fils, plus de lumière

Les puces LED classiques se lient à la carte par de fins fils d'or. Les LED flip-chip retournent la puce face contre la carte et la lient directement, ce qui libère de l'espace, supprime un point de défaillance courant et améliore le chemin thermique. Combiné au COB, le flip-chip est ce qui permet aux écrans de 0,6 à 0,9 mm d'atteindre 600 à 1 000 nits avec une couleur uniforme et une longue durée de vie. Le COB flip-chip est aujourd'hui la construction de référence pour les écrans de classe micro-LED.

> Sous le millimètre, l'écran doit ressembler à une surface, pas à une grille.

## COB contre SMD : ce que vous gagnez

1.   0 1 Résistance aux chocs : une surface scellée survit aux doigts, aux meubles et au nettoyage ; les paquets SMD s'écaillent.
2.   0 2 Contraste : la résine noire et l'absence de parois donnent des noirs plus profonds en pièce éclairée.
3.   0 3 Uniformité : pas de dérive de couleur sur les bords de paquet et un angle de vision plus large et plus régulier.
4.   0 4 Chaleur : un meilleur chemin thermique signifie moins de dérive de luminosité et de vieillissement des couleurs sur des années.
5.   0 5 Humidité et poussière : le joint de résine protège les puces dans les pièces humides ou poussiéreuses.

### Ce à quoi vous renoncez

Les modules COB coûtent plus cher au mètre carré, et une puce défaillante ne peut pas être remplacée individuellement — c'est le module qui est changé. Le COB des débuts avait une texture de résine visible et une surface légèrement plus chaude ; le COB flip-chip actuel a comblé cet écart. Le calibrage couleur se fait par module à l'usine et doit être vérifié sur site.

## Où le COB fine pitch s'utilise

Salles de contrôle, salles de conseil, plateaux de diffusion, salles de marché et tout mur vu à moins de trois mètres, surtout là où le texte et les données dominent. Pour les halls, le commerce et les scènes à 1,5 mm et plus, le SMD reste le meilleur rapport qualité-prix ; la distance de vision masque la structure des paquets et le budget va plus loin.

## Spécifier un écran fine pitch

1.   0 1 Pas selon la distance de vision : 0,7–0,9 mm en dessous de 2 m, 1,2–1,5 mm pour 2–4 m.
2.   0 2 Construction annoncée : SMD, mini-LED SMD, COB ou COB flip-chip.
3.   0 3 Luminosité 600–1 000 nits avec gradation calibrée pour la lumière ambiante de bureau.
4.   0 4 Fréquence de rafraîchissement 3 840 Hz et plus, échelle de gris 14 à 16 bits.
5.   0 5 Rechanges du même lot, calibrage d'usine et cartes de réception redondantes.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Quelle est la différence entre le COB et le SMD ?`,
        answer: `Le SMD utilise des LED encapsulées individuellement et soudées à la carte ; le COB monte les puces nues directement sur la carte sous une couche de résine unique, ce qui donne une surface lisse, résistante et à plus fort contraste aux pas fins.`,
      },
      {
        question: `Le COB est-il meilleur que le SMD ?`,
        answer: `En dessous d'environ 1,2 mm de pas, le COB est meilleur pour la durabilité, le contraste et l'uniformité. À 1,5 mm et plus, le SMD offre un meilleur rapport qualité-prix sans inconvénient visible aux distances de vision normales.`,
      },
      {
        question: `Qu'est-ce qu'une LED flip-chip ?`,
        answer: `Une puce liée face contre la carte sans fil d'or, ce qui améliore la fiabilité, le chemin thermique et la luminosité. Le COB flip-chip est la référence actuelle pour les écrans de moins d'un millimètre.`,
      },
      {
        question: `Quel pas de pixel utilise-t-on dans une salle de contrôle ?`,
        answer: `Typiquement 0,9 à 1,5 mm, choisi selon la distance entre les pupitres des opérateurs et le mur et selon la densité des données affichées.`,
      },
    ],
  },
  'corporate-screens': {
    contentFr: `L'environnement d'entreprise se construit avec la proportion, la matière et la lumière. Un écran LED qui ignore ces règles — un rectangle noir boulonné sur du marbre — se lit comme un ajout, quel que soit la finesse de son pas. Un écran qui les respecte se lit comme une intention. Cet article traite de la conception des murs LED d'entreprise pour les halls, les salles de conseil, les salles de briefing et les espaces ouverts : le choix des formats, les spécifications techniques qui comptent et la stratégie de contenu qui fait d'un écran une affirmation de l'identité de l'entreprise.

## L'écran est une surface, pas un appareil

Les installations d'entreprise les plus réussies traitent la surface LED comme un choix de matériau, au même titre que la pierre, le verre et le bois. Cela suppose une couverture bord à bord sans bord visible, une pose affleurante dans le plan du mur et un contenu conçu pour le rapport d'image exact de l'architecture plutôt qu'un fichier 16:9 étiré sur une surface ultra-large. Une fois l'écran pensé comme une surface, le choix du pas, de la profondeur des modules et de la luminosité devient une question de position du public et d'éclairage de la pièce.

## Trois décisions qui définissent un mur LED d'entreprise

### Proportion

Dimensionnez l'écran selon l'architecture, pas selon un standard de télévision. Les formats ultra-larges, portrait et enveloppants sont naturels en LED, car les modules s'assemblent dans n'importe quelle direction. Un bandeau 9:1 au-dessus d'un comptoir d'accueil ou un panneau portrait 2:3 à côté d'un noyau d'ascenseurs communique souvent plus qu'un grand rectangle 16:9.

### Profondeur

Des modules de moins de 30 mm permettent une pose vraiment affleurante : l'écran disparaît dans le plan du mur et la finition alentour court jusqu'à son bord. Des modules plus profonds exigent une niche ou un coffrage, et c'est là que l'installation commence à paraître rapportée.

### Contenu

Commandez un design d'animation pour l'espace. L'identité d'entreprise en lumière ne se comporte pas comme l'identité imprimée : des pièces lentes, à fort contraste, génératives ou abstraites se lisent mieux dans un hall qu'une vidéo institutionnelle sous-titrée. Prévoyez un calendrier de contenu comme une galerie planifie ses expositions.

> Un écran d'accueil bien conçu ne semble jamais allumé. Il semble intégré à la construction.

## Murs LED d'accueil : luminosité, pas et distance de vision

Les halls sont généralement éclairés par la lumière du jour à travers des façades vitrées, un mur LED d'accueil a donc besoin de plus de marge de luminosité qu'une salle de conseil — 1 000 à 1 500 nits calibrés jusqu'à la lumière ambiante — avec une gradation automatique selon l'heure. La distance de vision va de deux mètres à l'accueil à vingt à l'entrée, et le pas habituel est donc de 1,5 à 1,9 mm : assez fin pour les visiteurs qui s'en approchent, assez efficace pour un mur de 20 m² ou plus.

## Écrans LED de salle de conseil et de briefing

Ici l'écran est fonctionnel : tableurs, visioconférences, tableaux de bord en direct et présentations. Un pas fin de 0,9 à 1,5 mm, une luminosité uniforme calibrée et une fréquence de rafraîchissement supérieure à 3 840 Hz pour les salles face caméra ne se négocient pas. La maintenance par l'avant sort l'entretien des heures ouvrées et du plafond. Recherchez des modules conformes à la CEM classe B pour les bureaux et des processeurs acceptant plusieurs entrées avec image dans l'image sans matrice de commutation séparée.

### LED tout-en-un pour salles de réunion

Pour les salles de 20 à 60 m², les écrans LED tout-en-un de 108 à 136 pouces remplacent projecteur et écran par une seule unité murale à 1,25–1,56 mm de pas, avec traitement intégré et module de présentation sans fil. Ils s'installent en une journée et suppriment le travail d'alignement et de calibrage d'un mur sur mesure.

## Que spécifier dans un appel d'offres LED d'entreprise

1.   0 1 Un pas de pixel adapté à la position de vision la plus proche.
2.   0 2 Une profondeur de module inférieure à 30 mm pour une pose affleurante, avec l'accès de maintenance précisé.
3.   0 3 Une luminosité de 600–1 500 nits avec gradation automatique selon la lumière ambiante et un rapport de calibrage par module.
4.   0 4 Une fréquence de rafraîchissement supérieure à 3 840 Hz et une profondeur de gris de 14 bits ou plus pour un usage caméra.
5.   0 5 Les entrées du processeur, la redondance (double alimentation, données en boucle) et la supervision à distance.
6.   0 6 La production de contenu : qui le réalise, dans quel format et à quelle fréquence il change.

## Coûts d'exploitation et durée de vie

Un mur fine pitch calibré fonctionnant à 30–40 % de luminosité dans un bureau consomme bien moins que sa puissance nominale et atteint 100 000 heures de durée de vie des LED. Les plateformes LED économes — pilotage à cathode commune et packages basse consommation — réduisent le coût d'exploitation et la chaleur, ce qui supprime le besoin de refroidissement supplémentaire dans un hall fermé.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Quel pas de pixel pour un mur LED d'accueil ?`,
        answer: `La plupart des murs d'accueil utilisent 1,5–1,9 mm. Descendez plus fin (1,2 mm) seulement si les visiteurs s'approchent régulièrement à moins de deux mètres ou si le mur affiche du texte ; montez plus gros (2,5 mm) pour de très grands murs vus depuis l'autre côté d'un atrium.`,
      },
      {
        question: `Quelle épaisseur peut avoir un mur LED pour une pose affleurante ?`,
        answer: `Les modules fine pitch modernes font 25–40 mm de profondeur. En dessous de 30 mm, le mur peut être encastré au nu d'une finition en placo ou en pierre.`,
      },
      {
        question: `Mur LED ou mur d'images LCD pour une salle de conseil ?`,
        answer: `Le LED n'a pas de bords, offre plus de luminosité et une durée de vie plus longue ; le LCD est moins cher en dessous de trois mètres de large. Pour les salles qui accueillent des visioconférences, un LED à fréquence supérieure à 3 840 Hz évite le scintillement à la caméra.`,
      },
      {
        question: `Combien coûte l'exploitation d'un mur LED d'entreprise ?`,
        answer: `Un mur fine pitch de 10 m² à la luminosité de bureau habituelle consomme environ 1–1,5 kW, bien en dessous de sa puissance nominale. La gradation automatique et les plateformes LED efficaces réduisent encore ce chiffre.`,
      },
    ],
  },
  'curved-led': {
    contentFr: `Concave, convexe, enveloppant, cylindrique — les surfaces LED incurvées sont le point où la technologie d'affichage devient architecture. C'est aussi là que les projets échouent lorsque le rayon est décidé tard, que la taille des modules est choisie par habitude et que le contenu est conçu sur une chronologie plate. Ce guide explique les deux façons de courber un écran LED, comment le rayon pilote toutes les autres décisions, ce qui change sur le plan structurel et comment penser le contenu pour un mur LED incurvé.

## Deux façons de courber un écran LED

### Modules rigides à verrous d'angle

Les modules standard de 500 × 500 mm ou 500 × 1 000 mm se verrouillent à leurs voisins à des angles fixes — typiquement ±5°, ±10°, ±15° jusqu'à ±30° — formant des courbes facettées qui paraissent lisses à distance de vision. C'est le cheval de trait des murs LED incurvés pour les scènes de location, les halls et les auditoriums, car il utilise le même stock que les murs plats.

### Modules LED flexibles

Des modules souples et pliables sur base caoutchouc ou circuit souple se courbent en continu pour les rayons serrés, les colonnes, les bandeaux et les formes organiques, avec des pas de 1,5 à 4 mm. Ils se montent sur un support incurvé construit par le menuisier. La plupart des grandes installations combinent les deux : modules rigides pour la grande courbure, modules flexibles pour les retours serrés.

## Le rayon pilote tout

Un module de 500 mm par incréments de 10° produit un rayon d'environ 2,9 m ; à 15° environ 1,9 m ; à 30° environ 1 m. Les rayons plus serrés exigent des modules plus petits, plus de paliers d'angle ou des produits flexibles. Décidez le rayon tôt — il détermine la gamme de produits, la sous-structure et la chaîne de contenu. Les courbes convexes (bombées vers le spectateur) pardonnent mieux les coutures de facettes que les courbes concaves, où le spectateur voit chaque joint de profil.

> Le contenu d'une courbe se conçoit dans l'espace, pas sur une chronologie plate.

## Structure et accès de maintenance

Les murs incurvés modifient les chemins de charge. Les systèmes suspendus ont besoin d'un gréage réglable pour ajuster chaque colonne à l'arc ; les montages sur socle exigent des fondations calculées pour la courbe et un contreventement latéral aux extrémités. La maintenance par l'arrière est souvent la seule option pratique sur les murs concaves dont l'avant est une surface finie : prévoyez un couloir de maintenance d'au moins 600 mm derrière les modules. Sur les murs convexes tournés vers un espace public, spécifiez des modules entretenus par l'avant.

## Précision des verrous d'angle et visibilité des coutures

Une couture apparaît dès un degré d'erreur. Les modules doivent se verrouiller mécaniquement à l'angle spécifié, sans dépendre de l'œil de l'installateur, et le cadre doit porter des pions d'alignement qui référencent la surface LED plutôt que le boîtier. Demandez au fabricant la tolérance de l'angle de verrouillage et la compensation des coutures dans le processeur, qui ajuste la luminosité aux joints des facettes.

## Contenu pour murs LED incurvés

Un contenu plat plaqué sur une courbe s'étire sur les bords et brouille la perspective. Concevez dans une scène 3D qui correspond à la géométrie construite, effectuez le rendu depuis la position de vision principale et mappez chaque colonne de modules à son angle réel dans le processeur. Des mouvements de caméra lents et des indices de profondeur exploitent la courbe ; les bords nets et le texte à travers les facettes la combattent.

## Liste de contrôle pour la phase de conception

1.   0 1 Définir le rayon, l'angle d'arc total et le caractère concave ou convexe de la courbe.
2.   0 2 Choisir la taille des modules en fonction du rayon, et non l'inverse ; envisager les modules flexibles sous 1 m de rayon.
3.   0 3 Confirmer la précision du verrouillage d'angle et la compensation des coutures avec le fabricant.
4.   0 4 Concevoir la sous-structure pour la courbe, y compris l'accès de maintenance et les chemins de câbles.
5.   0 5 Concevoir le contenu dans une scène 3D correspondant à la géométrie construite et calibrer sur site après l'installation.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Quel est le rayon minimal d'un mur LED incurvé ?`,
        answer: `Avec des modules rigides de 500 mm à ±30°, le minimum pratique est d'environ 1 m. En dessous, utilisez des modules de 250 mm ou des modules LED flexibles, qui se courbent sur des rayons de quelques centaines de millimètres.`,
      },
      {
        question: `Les modules LED de location peuvent-ils être courbés ?`,
        answer: `Oui. La plupart des plateformes de location se verrouillent de ±5° à ±15° entre voisins, permettant des scènes concaves et convexes à partir du même stock de murs plats.`,
      },
      {
        question: `Concave ou convexe : lequel est le plus facile ?`,
        answer: `Les courbes convexes masquent mieux les coutures de facettes, car le spectateur voit le joint sous un angle. Les courbes concaves exigent une tolérance d'angle plus serrée et une compensation des coutures.`,
      },
      {
        question: `Comment conçoit-on le contenu d'un écran LED incurvé ?`,
        answer: `Construisez la géométrie du mur dans une application 3D, animez dans cette scène, effectuez le rendu depuis la position de vision principale et mappez les colonnes aux angles dans le processeur LED.`,
      },
    ],
  },
  'holographic-displays': {
    contentFr: `Un afficheur à ventilateur holographique — aussi appelé ventilateur holographique 3D — crée l'illusion d'un objet flottant dans l'air, sans écran visible. C'est l'un des moyens les plus rentables d'arrêter le passant devant une vitrine, un stand d'exposition ou un hall d'hôtel, et l'une des technologies d'affichage les plus faciles à mal déployer. Ce guide explique comment fonctionnent les ventilateurs holographiques, les tailles et spécifications qui comptent, comment les unités s'assemblent en murs holographiques, les règles de contenu qui font mouche et où les visuels flottants méritent vraiment leur place.

## Comment fonctionne un ventilateur holographique

Des pales portant des bandes denses de LED RGB tournent à grande vitesse. La persistance rétinienne fusionne la lumière en une image pleine couleur, et comme le fond n'est que de l'air, les pixels sombres disparaissent — l'objet semble flotter. Les unités vont de ventilateurs de bureau de 42 cm à 224 LED jusqu'à des afficheurs extérieurs de 280 cm à plus de 12 000 LED, 16 pales et 4 000 nits. Le contenu se télécharge par Wi-Fi ou dans le cloud, se programme depuis une application ou s'injecte en direct par HDMI sur les modèles temps réel.

### Tailles et usages

1.   0 1 42–50 cm : comptoirs, étagères et accueils, vus de 1–3 m.
2.   0 2 65–80 cm : vitrines, stands d'exposition et bars, vus de 3–8 m.
3.   0 3 100–150 cm : atriums, showrooms et décors de scène, vus de 5–15 m.
4.   0 4 280 cm extérieur : centres commerciaux, parcs et façades avec protection IP65 et 4 000 nits.

## Murs vidéo holographiques

Plusieurs ventilateurs se synchronisent via un contrôleur unique et s'assemblent en réseaux — 1×3, 2×2 et plus grands — de sorte qu'un même objet peut s'étendre sur plusieurs unités ou qu'une scène continue court sur tout un mur. L'assemblage transforme un gadget en affichage grand format avec le même effet flottant, pour une fraction du coût d'un écran LED transparent de même taille.

> Un hologramme attire l'attention. Donnez-lui une seule chose à dire.

## Règles de contenu pour les ventilateurs holographiques

1.   0 1 Fond noir, toujours : tout ce qui est sombre est transparent, l'objet doit donc être lumineux et le champ, noir.
2.   0 2 Un objet vedette, centré, en rotation lente — l'œil lit la profondeur dans le mouvement.
3.   0 3 Fort contraste et couleur saturée ; évitez le texte fin en dessous de 5 % du diamètre.
4.   0 4 Des boucles de 8–15 secondes pour le trafic passant ; des séquences plus longues pour un public assis.
5.   0 5 Concevez en 3D ou utilisez des détourages produits 2D avec une légère ombre portée pour suggérer le volume.

## Où les visuels flottants fonctionnent

Vitrines, stands d'exposition, lancements de produits, halls d'hôtel, bars, musées et scénographie — partout où les gens s'arrêtent un instant. L'effet lutte en pleine lumière du jour en dessous de 3 000 nits et dans les couloirs larges et rapides où le visuel n'a pas le temps de marquer. Pour un usage extérieur, choisissez les unités grand format IP65 et placez-les à l'ombre ou sur un fond sombre.

## Spécifier un afficheur holographique

1.   0 1 Diamètre selon la distance de vision : 65 cm se lit à 3–8 m ; 100 cm et plus pour les atriums.
2.   0 2 Nombre de LED et luminosité : plus de LED donnent des images plus fines ; 2 600–4 000 nits en plein jour.
3.   0 3 Capot acrylique de protection partout où des mains peuvent atteindre les pales, plus un pied ou un caisson.
4.   0 4 Programmation Wi-Fi ou cloud pour les parcs ; entrée HDMI temps réel pour les spectacles interactifs ou en direct.
5.   0 5 Contrôleur d'assemblage si plusieurs unités doivent jouer comme un mur ; mémoire embarquée pour la lecture hors ligne.

## Sécurité et maintenance

Un ventilateur est une machine en mouvement. Dans les espaces publics, montez les unités hors de portée ou derrière un capot acrylique, fixez-les à un mur ou un support calculé pour le poids de l'unité et nettoyez les pales selon un planning — la poussière réduit sensiblement la luminosité. Les moteurs antipincement et à faible bruit valent la peine d'être spécifiés pour les intérieurs commerciaux.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Comment un ventilateur holographique 3D crée-t-il une image flottante ?`,
        answer: `Des bandes LED sur des pales en rotation dessinent l'image ; la persistance rétinienne la fusionne et le fond noir disparaît contre l'air derrière le ventilateur, de sorte que l'objet semble flotter.`,
      },
      {
        question: `Quelle taille de ventilateur holographique pour une vitrine ?`,
        answer: `Une unité de 65–80 cm convient à la plupart des vitrines vues de 3–8 m ; utilisez 100 cm ou un mur assemblé pour les grands atriums.`,
      },
      {
        question: `Les ventilateurs holographiques peuvent-ils être utilisés en extérieur ?`,
        answer: `Oui, avec des modèles grand format IP65 notés à 4 000 nits, placés à l'ombre ou sur fond sombre pour un meilleur contraste.`,
      },
      {
        question: `Quel format de contenu utilisent les ventilateurs holographiques ?`,
        answer: `De la vidéo MP4 à fond noir pur, généralement à la résolution native de l'unité ; plusieurs modèles acceptent une entrée HDMI en direct pour du contenu temps réel.`,
      },
    ],
  },
  'kinetic': {
    contentFr: `Un écran LED cinétique est un affichage dont les pixels bougent physiquement. Des unités de mouvement indépendantes — chacune un petit module LED sur un vérin linéaire — se déplacent d'avant en arrière sur l'axe Z en chorégraphie avec le contenu vidéo, l'image gagne donc une profondeur réelle, des ombres réelles et un mouvement réel. C'est une nouvelle catégorie d'affichage architectural, entre signalétique numérique et sculpture cinétique. Cet article explique comment fonctionnent les murs LED cinétiques, les spécifications qui distinguent les systèmes sérieux des gadgets, où la technologie réussit et comment planifier une installation cinétique.

## Comment fonctionne un mur LED cinétique

Chaque unité de mouvement est un module de 128 à 320 mm de côté, portant une face LED fine pitch à l'avant et un vérin à l'arrière. Les systèmes intérieurs s'étendent jusqu'à 300 mm à des vitesses d'environ 600 mm/s ; les unités extérieures s'étendent de 600 mm ou plus. Un système de contrôle pilote la vidéo et le mouvement depuis une seule chronologie verrouillée image par image, de sorte qu'une vague dans le contenu est aussi une vague dans le mur. Entre les unités, un interstice visuel de 0 mm pendant l'extension garde l'image continue même lorsque des unités voisines sont à des profondeurs différentes.

### Spécifications clés à comparer

1.   0 1 Course d'extension (300 mm en intérieur, 600 mm en extérieur) et vitesse (600–800 mm/s).
2.   0 2 Taille et résolution des unités de mouvement : 128 × 128 mm à 72 × 72 pixels est typique pour une vision rapprochée.
3.   0 3 Interstice visuel en mouvement, et écart entre modules au repos.
4.   0 4 Protection antipincement (vérins à effort limité) pour les espaces publics.
5.   0 5 Maintenance par l'avant et remplacement à chaud d'une unité sans démonter ses voisines.
6.   0 6 Logiciels : plug-ins de contenu pour After Effects, TouchDesigner et Unreal, plus un simulateur pour prévisualiser le mouvement.

## Où le LED cinétique fonctionne

Flagships de vente, halls d'hôtel et d'entreprise, stands d'exposition, musées et scénographie. Les surfaces cinétiques récompensent les publics qui s'arrêtent et regardent ; l'effet marque quand le spectateur peut voir la profondeur changer sur quelques secondes. Elles conviennent moins aux couloirs rapides ou aux longues distances, où le mouvement apparaît plat.

> La profondeur devient une partie de l'image.

## Ce qu'il faut prévoir

1.   0 1 Profondeur de mouvement : le mur a besoin d'un dégagement derrière son plan pour toute la course, plus l'espace de maintenance.
2.   0 2 Structure : une masse en mouvement modifie les charges ; le cadre se calcule pour des efforts dynamiques, pas seulement pour le poids.
3.   0 3 Synchronisation : mouvement et vidéo tournent sur une chronologie verrouillée image par image ; planifiez le réseau de contrôle tôt.
4.   0 4 Contenu : conçu en 3D avec des courbes de mouvement, pas comme une vidéo plate ; l'équipe contenu a besoin du simulateur.
5.   0 5 Maintenance : les vérins sont mécaniques ; précisez les intervalles d'entretien, les unités de rechange et l'accès par l'avant.
6.   0 6 Sécurité : limites antipincement, protections aux hauteurs accessibles et arrêt d'urgence pour les espaces publics.

## LED cinétique intérieur et extérieur

Les systèmes intérieurs visent la vision rapprochée avec des pas de 1,5 à 2,6 mm et de petites unités de mouvement pour une surface fluide. Les murs cinétiques extérieurs utilisent de plus grandes unités de 320 à 500 mm, des pas de 5 à 10 mm, des courses plus longues, une protection IP65 et une luminosité jusqu'à 8 000 nits ; ils s'installent typiquement sur les façades et les places où l'échelle porte l'effet.

## Conception de contenu pour murs cinétiques

Le meilleur contenu cinétique use du mouvement avec parcimonie et à bon escient : un logo qui s'élève du mur, une vague qui voyage avec la vidéo, une grille qui respire avec la musique. Un mouvement constant fatigue le spectateur et le mécanisme. Concevez des cartes de profondeur en parallèle de la vidéo, prévisualisez dans le simulateur et réservez les vitesses de pointe aux moments qui le méritent.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Qu'est-ce qu'un écran LED cinétique ?`,
        answer: `Un mur LED fait d'unités de mouvement indépendantes qui avancent et reculent sur des vérins en synchronisation avec la vidéo, ajoutant une profondeur physique et du mouvement à l'image.`,
      },
      {
        question: `De combien bougent les unités LED cinétiques ?`,
        answer: `Les systèmes intérieurs s'étendent d'environ 300 mm, les systèmes extérieurs de 600 mm ou plus, à des vitesses jusqu'à 600–800 mm/s.`,
      },
      {
        question: `Les murs LED cinétiques sont-ils sûrs dans les espaces publics ?`,
        answer: `Les systèmes sérieux limitent la force des vérins (protection antipincement), protègent les unités accessibles et incluent un arrêt d'urgence. Demandez la limite d'effort et la certification de sécurité.`,
      },
      {
        question: `Comment conçoit-on le contenu d'un écran cinétique ?`,
        answer: `Dans des outils 3D avec des plug-ins pour After Effects, TouchDesigner ou Unreal : la vidéo et un canal de profondeur sont conçus ensemble et prévisualisés dans un simulateur avant lecture.`,
      },
    ],
  },
  'outdoor-brightness': {
    contentFr: `Demandez ce qui fait réussir un écran LED extérieur et la plupart des gens répondent la résolution. Ce n'est pas cela. La caractéristique qui gagne la bataille contre la lumière du jour est la luminosité mesurée en nits, le contraste qui garde le contenu sombre sombre sous un ciel lumineux, et la façon dont le contenu lui-même est étalonné pour la rue. Ce guide couvre les niveaux de luminosité LED extérieure, la différence entre luminosité et contraste, les exigences thermiques et d'indice IP, et les règles de contenu pour les écrans de communication extérieure (DOOH) et les façades média.

## La lumière du jour, c'est 100 000 lux

Un intérieur lumineux est d'environ 500 lux ; un jour couvert en extérieur, 10 000 ; le plein soleil sur une façade dépasse 100 000. Un écran intérieur à 1 000 nits disparaît simplement dans cette lumière. Les surfaces DOOH extérieures sérieuses tournent de 5 000 à 10 000 nits, et la différence entre les deux est la différence entre lisible à midi et lisible au crépuscule. Un écran orienté au sud, avec le soleil derrière le spectateur, a besoin du haut de cette plage ; un écran orienté au nord, sous un auvent, peut vivre en bas de plage.

### De combien de nits a besoin un écran LED extérieur ?

1.   0 1 À l'ombre ou orienté au nord, sous auvent : 4 000–5 000 nits.
2.   0 2 Rue dégagée, orientation mixte : 5 500–7 000 nits.
3.   0 3 Façade orientée au sud ou à l'ouest en plein soleil : 8 000–10 000 nits.
4.   0 4 Résille transparente sur vitrage (la lumière passe) : 5 000–10 000 nits avec une haute transparence.

## Le contraste est ce que l'œil lit réellement

La luminosité attire l'attention ; le contraste délivre le message. Les LED à face noire, les masques à lamelles et les traitements de surface mats réduisent la lumière réfléchie, de sorte que le contenu sombre reste sombre. Un écran de 7 000 nits à surface brillante et grise se lit moins bien à midi qu'un écran de 5 000 nits aux noirs profonds. Pour comparer des produits LED extérieurs, demandez le rapport de contraste mesuré en plein soleil, pas seulement la luminosité de pointe de la fiche technique.

> En extérieur, le soleil est votre concurrent pour chaque pixel. Concevez le contenu pour gagner.

## Étalonner le contenu DOOH pour la rue

1.   0 1 Privilégiez les compositions à fort contraste : texte clair sur fond sombre, ou l'inverse.
2.   0 2 Utilisez de grandes zones de couleur, un texte court et l'image entière, pas de petites fenêtres.
3.   0 3 Évitez le texte fin ou les détails inférieurs à environ 5 % de la hauteur de l'écran, car ils disparaissent dans le Soleil.
4.   0 4 Assurez la lisibilité depuis la distance de vision la plus éloignée, pas seulement de près.
5.   0 5 Testez le contenu sur site à midi, car la lumière du jour change tout.

## Capteurs de lumière ambiante et programmation de luminosité

Un écran extérieur ne devrait jamais tourner à une seule luminosité toute la journée. Un capteur de lumière sur le processeur ajuste la sortie en continu, tandis qu'un planning plafonne la luminosité nocturne. Cela protège les spectateurs, satisfait les autorités d'urbanisme et, parce que le vieillissement des LED s'accélère avec le courant de pilotage et la chaleur, garde le mur uniforme des années de plus.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `De combien de nits ai-je besoin pour un écran LED extérieur ?`,
        answer: `Prévoyez 5 000–7 000 nits sur les écrans de rue classiques et 8 000–10 000 nits sur les façades en plein soleil. En dessous de 4 000 nits, l'image sera délavée à midi.`,
      },
      {
        question: `Luminosité ou contraste : lequel est le plus important en extérieur ?`,
        answer: `Les deux, mais le contraste est souvent déterminant. Les LED à face noire et les masques mats gardent le contenu sombre sombre au soleil, de sorte qu'un écran de 5 000 nits à fort contraste peut surpasser un écran plus lumineux et brillant.`,
      },
      {
        question: `Quel indice IP faut-il pour un écran LED extérieur ?`,
        answer: `IP65 sur l'avant et l'arrière est le standard pour une installation extérieure permanente ; un IP54 à l'arrière n'est acceptable qu'en position totalement abritée.`,
      },
      {
        question: `Les écrans LED extérieurs doivent-ils baisser la nuit ?`,
        answer: `Oui. Une sortie nocturne à 30–40 % évite les plaintes pour éblouissement, respecte la plupart des règles municipales d'éclairage et ralentit le vieillissement des LED.`,
      },
    ],
  },
  'rental-stage-build': {
    contentFr: `Les écrans LED de location sont conçus pour être montés, montrés et démontés des centaines de fois par an. Cela change tout dans leur conception et dans la façon dont une équipe travaille avec eux. Ce guide parcourt le montage d'un mur LED de location, du gréage au contrôle des lignes, explique ce qui rend un module de tournée rapide et sûr, couvre les configurations courbes et créatives, et liste les vérifications avant spectacle utilisées sur les scènes de concert, les conférences et les événements extérieurs.

## L'ordre de montage d'un mur LED de location

1.   0 1 Gréage : les barres de tête volent depuis la poutre sur des points certifiés avec un calcul de charge par point ; les murs posés au sol reçoivent des châssis de base, un contreventement arrière et un lest.
2.   0 2 Modules : les panneaux de location de 500 × 500 mm ou 500 × 1 000 mm se suspendent à la barre de tête et se verrouillent à leurs voisins par verrous quart de tour et pions d'alignement.
3.   0 3 Alimentation et données : chaque colonne est chaînée avec une boucle de données redondante fermée au dernier module, et l'alimentation est distribuée depuis un tableau ou un module de distribution.
4.   0 4 Traitement : le processeur LED mappe le mur, charge le calibrage des modules et se verrouille sur la cadence du spectacle et le serveur média.
5.   0 5 Contrôle des lignes : une mire de test parcourt chaque module avant le chargement du contenu, et le mur est équilibré en blanc sur le jeu d'éclairage.

## Ce qui rend un module de location rapide

Le poids et l'outillage. Un module de 500 × 1 000 mm sous 25 kg permet à une équipe de deux personnes de suspendre un mur de dix mètres en un après-midi. Des verrous sans outil, des modules entretenus par l'avant, des alimentations et des cartes de réception remplaçables à chaud tiennent le planning quand quelque chose lâche à 22h00. Des modules partageant un même cadre entre pas intérieurs et extérieurs permettent à un loueur de monter n'importe quel spectacle à partir d'un seul inventaire.

> Un mur de location se juge à la vitesse à laquelle il redescend, pas seulement à sa beauté une fois monté.

## Courbes, angles et planchers

Les modules de tournée se courbent par paliers verrouillés — typiquement ±10° ou ±15° entre voisins — de sorte que le même stock monte des décors plats, concaves et convexes. Les modules d'angle étendent le système aux angles droits et aux cubes ; les modules plancher porteurs à surface antidérapante supportent les artistes et les chariots ; les modules transparents de location construisent des décors translucides pour les concerts et le sport. Planifiez le support au sol ou la structure pour la géométrie finale, pas pour le dessin plat.

## LED de location en extérieur

Les scènes de festival et extérieures ont besoin de modules IP65, de 4 000 à 5 000 nits, de presse-étoupes arrière et de calculs de charge de vent pour la structure de support au sol. Les pas extérieurs de location de 3,9 à 5,9 mm servent la plupart des scènes principales ; 7,8 à 10,4 mm conviennent aux écrans latéraux et aux tours de rappel vus de loin.

## Contrôles avant spectacle

1.   0 1 Certificats de gréage et calcul de charge par point de poutre, avec sécurités secondaires en place.
2.   0 2 Calibrage de luminosité et de couleur appliqué sur site avec l'éclairage du spectacle, pas seulement à l'usine.
3.   0 3 Fréquence de rafraîchissement supérieure à 3 840 Hz — 7 680 Hz pour la diffusion — pour les spectacles face caméra.
4.   0 4 Boucle de données redondante confirmée en débranchant un câble pendant le contrôle des lignes.
5.   0 5 Indice IP, presse-étoupes et gouttes d'eau sur les dates extérieures.
6.   0 6 Rechanges dans le camion : 5 % du mur en modules, alimentations et cartes de réception.

## Location ou achat

Les événements de quelques semaines par an se louent ; les salles, les studios et les lieux de culte à usage toute l'année achètent. Un module de qualité location acheté pour une installation permanente coûte plus cher qu'un produit fixe mais conserve sa valeur de revente et tolère la reconfiguration. Pour les productions en tournée, la location sèche auprès d'un loueur disposant d'un inventaire assorti évite les lots mélangés et les écarts de couleur sur scène.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Combien de temps faut-il pour monter un mur LED de location ?`,
        answer: `Une équipe de deux personnes suspend environ 20–30 m² de modules de location légers par heure, un écran de scène de 10 × 5 m se monte donc en un après-midi, contrôle des lignes inclus.`,
      },
      {
        question: `Quel pas de pixel utilise-t-on pour les écrans LED de scène ?`,
        answer: `Les scènes intérieures utilisent 2,6–3,9 mm ; les scènes principales extérieures 3,9–5,9 mm ; les écrans latéraux et les tours de rappel 7,8–10,4 mm.`,
      },
      {
        question: `Les écrans LED de location peuvent-ils être utilisés en extérieur ?`,
        answer: `Oui, avec des modules IP65, une luminosité de 4 000–5 000 nits et une structure de support ou un gréage calculé pour la charge de vent.`,
      },
      {
        question: `Quelle fréquence de rafraîchissement faut-il pour le LED à la caméra ?`,
        answer: `Au moins 3 840 Hz pour les vidéos d'entreprise et de concert, et 7 680 Hz ou plus pour la diffusion et le cinéma.`,
      },
    ],
  },
  'transparent-led': {
    contentFr: `Le LED transparent transforme le verre en média sans bloquer la lumière, la vue ou les produits derrière la vitrine. Il est devenu la technologie privilégiée des devantures de commerce, des atriums vitrés, des showrooms et des façades où un écran opaque serait inacceptable. Il existe trois familles de LED transparent, qui diffèrent par la transparence, le pas, la luminosité et le mode d'installation. Ce guide compare la maille LED transparente, le film LED et le LED encapsulé dans le verre, et expose les règles de contenu et de spécification qui font fonctionner les écrans transparents.

## Trois façons de voir à travers un écran

### Maille LED transparente et modules à bandes

Des bandes LED horizontales sur un cadre léger se suspendent derrière un vitrage existant, atteignant 70–90 % de transparence à des pas de 5–10 mm. Ils sont lumineux (jusqu'à 5 000 nits), entretenus par l'intérieur et constituent la voie la plus économique vers les grands affichages en vitrine et les façades en verre.

### Film LED transparent

Un film adhésif flexible de moins de 2 mm d'épaisseur, avec les LED noyées dans un circuit transparent, se colle directement sur un vitrage existant. Des pas de 5 à 10 mm, une transparence d'environ 80 %, aucun cadre ni structure visible — le bon choix pour les rénovations, le verre courbe et les façades patrimoniales où rien ne peut être fixé au bâtiment.

### LED encapsulée dans le verre

La couche LED est laminée à l'intérieur même du vitrage, l'écran est donc la façade ou la cloison. Spécifié avec le vitrier dès la conception, il offre le rendu le plus net — pas de cadre, pas de bord de film — et s'utilise dans les flagships, les showrooms et les boîtes de verre où l'écran doit disparaître éteint.

## La transparence est un compromis avec le pas

Chaque LED supplémentaire coûte de la lumière. Un panneau transparent de 3,9 mm offre environ 65 % de transparence ; à 6,25 mm environ 75 % ; à 10 mm, 85–90 %. Décidez d'abord ce dont l'espace a besoin du verre — lumière du jour, vue, produit exposé derrière la vitrine — et laissez cela fixer le pas, plutôt que de choisir le pas le plus fin et de perdre la transparence qui justifiait le produit.

> Le meilleur écran transparent est celui que personne ne remarque avant qu'il ne joue.

## Luminosité pour LED transparent en plein jour

Les écrans transparents luttent contre la lumière du jour qui les traverse. Les installations face à la rue demandent 3 000 à 5 000 nits avec gradation automatique ; les cloisons intérieures et le verre d'atrium se contentent de 1 000 à 2 000. Comme il n'y a pas de fond noir, le contraste vient de l'obscurité derrière le verre — un intérieur lumineux derrière une vitrine affaiblit l'image.

## Règles de contenu pour le verre

1.   0 1 Concevez sur noir : les pixels noirs sont éteints, donc le noir est transparent. Les fonds sombres préservent la vue et la transparence.
2.   0 2 Gardez un mouvement ample et lent ; le détail fin disparaît devant une rue animée.
3.   0 3 Utilisez des éléments clairs et saturés sur fond sombre — contours, particules, découpes de produits.
4.   0 4 Programmez la luminosité selon la lumière du jour et descendez à 20–30 % la nuit.
5.   0 5 Laissez les 60 cm inférieurs d'une vitrine dégagés si des produits sont sur le rebord.

## Installation et maintenance

Les modules de maille exigent un rail supérieur, une descente d'alimentation par colonne et un chemin de maintenance depuis l'intérieur. Le film nécessite un verre propre, plat ou légèrement courbé, et un connecteur de bord ; une réinstallation prend des heures, pas des jours. Le verre encapsulé remplace le vitrage et suit le programme de façade. Dans les trois cas, planifiez les chemins de câbles et l'emplacement du contrôleur avant la fin de l'agencement.

## Choisir entre maille, film et verre

1.   0 1 Grande façade ou longue devanture à budget serré : maille transparente.
2.   0 2 Réinstallation sur verre existant ou courbé, sans cadre : film LED.
3.   0 3 Flagship neuf ou showroom où l'écran doit disparaître : LED encapsulé dans le verre.
4.   0 4 Location et événements : modules transparents de location à verrous rapides et pas de 3,9–7,8 mm.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Quelle est la transparence d'un écran LED transparent ?`,
        answer: `Entre 65 % et 90 % selon le pas et le type : environ 65 % à 3,9 mm, 75 % à 6,25 mm et 85–90 % à 10 mm en maille ou film.`,
      },
      {
        question: `Un LED transparent peut-il s'installer sur du verre existant ?`,
        answer: `Oui. Le film LED se colle directement sur le vitrage existant et les modules de maille se suspendent derrière ; seul le LED encapsulé dans le verre nécessite de remplacer le vitrage.`,
      },
      {
        question: `Le LED transparent est-il assez lumineux en plein jour ?`,
        answer: `Les produits face à la rue atteignent 3 000–5 000 nits, suffisant en plein jour avec gradation automatique. Les cloisons intérieures demandent 1 000–2 000 nits.`,
      },
      {
        question: `Quel contenu fonctionne le mieux sur LED transparent ?`,
        answer: `Des éléments clairs sur fond noir. Le noir est transparent, la vue reste donc ouverte et l'image semble flotter sur le verre.`,
      },
    ],
  },
  'xr-stages': {
    contentFr: `Un volume LED remplace l'écran vert par un mur de lumière réelle : l'arrière-plan est rendu dans un moteur de jeu, suivi sur la caméra et affiché sur des panneaux LED qui éclairent aussi les acteurs. C'est l'usage le plus exigeant de la technologie d'affichage LED, car le mur n'est pas jugé à l'œil mais par un capteur de caméra à 24 images par seconde. Ce guide explique ce qui rend un mur LED compatible caméra, de la fréquence de rafraîchissement et de l'échelle de gris au gamut couleur, au pas de pixel, à la latence et à la géométrie physique du plafond, du mur et du sol.

## La caméra voit ce que l'œil pardonne

Un écran parfait à l'œil humain peut scintiller, produire des bandes et du moiré à la caméra. La production virtuelle se spécifie pour le capteur : une fréquence de rafraîchissement de 7 680 Hz ou plus pour que les angles d'obturateur ne surprennent pas le balayage, une profondeur de gris de 16 bits pour que les fonds sombres ne se brisent pas en bandes, et un pas de pixel adapté à la distance caméra-mur et à la focale pour que la grille de pixels ne se résolve jamais en moiré.

### Fréquence de rafraîchissement et balayage

Le taux de balayage et la fréquence PWM comptent autant que la fréquence de rafraîchissement affichée. Demandez la fréquence effective à faible luminosité, car la plupart des puces de pilotage réduisent la profondeur PWM en s'atténuant, et les volumes tournent sombres pour les scènes de nuit.

## Science des couleurs pour les volumes LED

Le mur est à la fois une source de lumière et un fond. Des LED à large gamut couvrant le Rec. 2020 ou au moins le DCI-P3, un calibrage par module et un point blanc stable sur toute la plage de luminosité permettent au chef opérateur d'éclairer les acteurs contre le mur sans dérive de couleur. L'infrarouge et le comportement quasi noir comptent aussi : les LED bon marché émettent une traîne rouge que les caméras voient magenta dans les ombres. Une LED à quatre émetteurs (RVB plus blanc) améliore les teintes de peau et la lumière réfléchie sur le plateau.

> Dans un volume, le mur LED est le décor. Il doit se comporter comme tel.

## Pas de pixel et moiré

La règle est que le mur doit être hors mise au point ou au-delà du pouvoir de résolution de l'objectif à la distance de tournage. Pour les murs de fond à quatre à six mètres, 2,3 à 2,9 mm sont courants ; pour les plafonds, rarement dans le champ et servant surtout aux réflexions, 3,9 à 5,9 mm économise du budget ; pour les planchers visibles avec des acteurs dessus, 2,6 à 3,9 mm avec un module porteur. Testez avec les objectifs réels de la production avant de valider le pas.

## Géométrie : mur, plafond et sol

Les volumes combinent un mur de fond incurvé de 180 à 270 degrés, un plafond pour les réflexions et souvent un sol LED porteur. Chaque surface a des exigences différentes — le sol porte des personnes, des chariots et des éléments de décor ; le plafond est éclairé pour le rebond ; le mur est dans le champ. Une plateforme modulaire qui fournit les trois avec une science des couleurs assortie évite la couture entre produits que les caméras repèrent instantanément.

### Courbure et coutures

Le mur de fond se courbe à ±5° à ±10° par module pour que le tronc de cône suive sans facettes visibles. La compensation des coutures dans le processeur et les pions d'alignement mécaniques gardent les joints invisibles sous lumière rasante.

## Latence, genlock et traitement

Le genlock entre la caméra, le système de suivi, le moteur de rendu et le processeur LED garde le tronc de cône et l'arrière-plan alignés. La latence totale du système sous quelques images est l'objectif ; chaque étage de traitement — serveur média, processeur d'image, carte d'envoi — doit être mesuré, pas supposé. Les processeurs qui prennent en charge les pipelines HDR, l'entrée 12 bits et le remappage d'images pour le tournage multi-caméra sont désormais la norme pour les scènes sérieuses.

## Liste de contrôle pour un volume LED

1.   0 1 Rafraîchissement 7 680 Hz ou plus avec comportement PWM à faible luminosité précisé.
2.   0 2 Échelle de gris 16 bits et traitement compatible HDR.
3.   0 3 Large gamut (DCI-P3 ou mieux), rapport de calibrage par module, point blanc stable.
4.   0 4 Pas de pixel testé avec les objectifs de production à la distance de tournage.
5.   0 5 Paliers de courbure, compensation des coutures et couloir de maintenance arrière.
6.   0 6 Modules plancher porteurs notés pour les charges de chariot ; gréage de plafond à réglage ajustable.
7.   0 7 Genlock, latence de bout en bout mesurée et redondance du processeur.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Quelle fréquence de rafraîchissement pour la production virtuelle ?`,
        answer: `Au moins 7 680 Hz, avec des performances confirmées à faible luminosité. Des fréquences plus basses produisent des lignes de balayage et du scintillement aux angles d'obturateur du cinéma.`,
      },
      {
        question: `Quel pas de pixel utilise-t-on dans les volumes LED ?`,
        answer: `Les murs de fond utilisent typiquement 2,3–2,9 mm, les plafonds 3,9–5,9 mm et les planchers 2,6–3,9 mm, toujours testés avec les objectifs réels pour le moiré.`,
      },
      {
        question: `Pourquoi la couleur compte-t-elle plus dans un volume LED ?`,
        answer: `Le mur éclaire les acteurs autant qu'il forme l'arrière-plan : son gamut, son point blanc et son comportement spectral apparaissent directement sur la peau et les costumes.`,
      },
      {
        question: `Quelle taille doit avoir un volume LED ?`,
        answer: `La plupart des plateaux de cinéma utilisent un mur de 180–270° de 6–8 m de haut et 20–30 m de large avec un plafond ; les studios plus petits travaillent avec un mur plat ou légèrement courbé de 10 m pour la publicité et la diffusion.`,
      },
    ],
  },
  'led-vs-projector': {
    contentFr: `Mur LED ou projecteur : la question que tout producteur d'événement, gestionnaire de salle et service technique se pose à un moment, et la réponse dépend en général d'une seule variable : combien de lumière il y a dans la pièce. Dans un auditorium plongé dans le noir, un projecteur reste un choix économique et parfaitement valable ; dans une salle de bal d'hôtel avec l'éclairage du dîner, ou une salle de conférence vitrée d'un côté, même le projecteur le plus puissant paraît délavé. Ce guide commence par un arbre de décision en cinq questions, détaille huit critères chiffrés, compare trois scénarios réels et se termine par une liste honnête des cas où la projection reste le bon choix.

## Un arbre de décision : mur LED ou projecteur en cinq questions

Répondez aux questions dans l'ordre. Les deux premières fixent la limite technique ; les trois dernières tranchent l'économie. Le besoin d'un écran LED ou d'un projecteur pour un événement est généralement clair dès la deuxième question, et les trois restantes ne comptent que pour les projets à la frontière.

1.   0 1 Lumière ambiante : pouvez-vous garder la salle sous environ 50 lux pendant tout le spectacle ? Sinon, LED. Si oui, continuez.
2.   0 2 Largeur d'image : avez-vous besoin d'une image unique sans couture de plus de 5 m ? Si oui, LED. En dessous de 3 m, LCD ou projecteur. Entre les deux, cela dépend du budget.
3.   0 3 Heures d'utilisation par an : un lieu utilisé plus de 1 000 heures par an favorise la possession d'un LED sur le coût d'exploitation ; pour quelques événements, la location a du sens avec l'une ou l'autre technologie.
4.   0 4 Budget : si la salle peut être assombrie et que l'argent est serré, un seul projecteur est l'image la moins chère qui existe. Sinon, le second projecteur, le mélange et l'opérateur comblent l'essentiel de l'écart avec le LED.
5.   0 5 Portabilité et montage : si le cahier des charges tient en deux personnes, une prise et une heure, projection. Si des points de gréage, une alimentation triphasée et une équipe de quatre peuvent être réservés, LED.

## Mur LED ou projecteur sur huit critères

### 1. Luminosité : lumens et nits ne sont pas la même chose

Le nombre de lumens d'un projecteur est la lumière totale quittant l'objectif ; ce que voit le public est la lumière réfléchie par l'écran, mesurée en nits (cd/m²). Pour un écran blanc mat de gain 1,0, la formule est simple : nits ≈ lumens ÷ (surface de l'écran en m² × 3,14). Un écran 16:9 de 6 m de large fait environ 20 m². Un projecteur de 10 000 lumens produit au mieux 10 000 ÷ (20 × 3,14) ≈ 160 nits, et après les pertes d'objectif, le vieillissement de la source et la correction couleur, 100–130 nits en pratique.

Un mur LED de 1 000 nits sur la même surface est six à dix fois plus lumineux. Cet écart est invisible dans le noir : le standard cinéma est de 48 nits, donc 160 nits suffisent largement dans une salle obscurcie. C'est aussi pourquoi un projecteur qui semblait correct à la répétition technique disparaît dès que l'éclairage du dîner monte. Le problème n'est pas le projecteur, c'est l'arithmétique consistant à répartir un nombre fixe de lumens sur vingt mètres carrés.

### 2. Contraste et niveau de noir

Si l'éclairage de la salle dépose 300 lux sur l'écran, un écran mat renvoie 300 ÷ 3,14 ≈ 95 nits vers le public. Le blanc du projecteur devient 160 + 95 = 255 nits et son noir 95 nits : un rapport de contraste de 2,7:1, du gris clair sur gris. Une surface LED masquée en noir ne réfléchit que 3 à 5 % des mêmes 300 lux, le noir se situe donc à 3–5 nits contre un blanc de 1 000 nits et le contraste reste au-dessus de 200:1. Les chiffres de 2 000:1 des brochures de projecteurs sont mesurés dans une pièce sombre et ne s'appliquent plus dès que la salle s'allume ; la fiche technique d'un mur LED et ses performances sur scène ne divergent pas.

### 2bis. Taille et continuité

Au-delà de 6–7 m, un projecteur unique manque soit de luminosité, soit d'une seconde unité avec mélange des bords, et la zone de mélange montre un palier de luminosité et une dérive de couleur visibles de près, même sur des systèmes bien alignés. Un mur LED s'assemble dans toutes les directions à partir de modules de 500 × 500 mm ou 500 × 1 000 mm : 128 petits modules pour 8 × 4 m, 64 pour 4 × 4 m. L'image est d'un seul tenant, et des ratios de scène comme 2:1 ou 3:1 sont produits nativement au lieu d'être réduits sur un écran. Les fonds incurvés ou coudés utilisent les mêmes modules ; en projection, ils signifient correction de géométrie et perte de lumière supplémentaire.

### 4. Temps de montage et gréage

Un projecteur unique se met en place à deux en une heure ; ajouter une seconde unité, le mélange et la géométrie prend une à deux heures de plus et un technicien qui connaît le logiciel. Un mur LED de 32 m² occupe quatre techniciens pendant quatre à six heures, mais exige plus de préparation en amont : à 7–8 kg par module de 500 × 500 mm, 128 modules pèsent environ une tonne, les points de gréage du lieu doivent donc être certifiés pour la charge, ou bien prévoir 1 à 1,2 m de profondeur derrière la scène pour un montage posé au sol. Une fois monté, le rapport s'inverse : sur plusieurs jours, ni recadrage, ni réalignement, ni re-mélange.

### 5. Lignes de vue et ombres

Une projection frontale fait traverser la pièce à la lumière ; à l'arrière, le faisceau arrive depuis l'arrière. Un projecteur frontal d'une puissance normale éclaire l'écran largement, mais dès qu'un artiste, un présentateur ou un élément de décor traverse le faisceau, son ombre apparaît sur l'image. La projection arrière supprime ce problème : le projecteur se place derrière l'écran, l'ombre peut être minimisée et les projections offrent une profondeur d'installation.

### 6. Durée de vie

Les projecteurs à lampe exigent le remplacement périodique des lampes et un entretien régulier des filtres et des optiques ; leur luminosité décroît avec le temps. Les murs LED sont notés pour environ 100 000 heures avec une décroissance lente, et l'image ne se dégrade pas par paliers.

### 7. Coût de location

Le taux de location journalier d'un mur LED dépend du pas, de la surface et de la saison ; il convient donc de comparer le coût total, pas le seul tarif du jour.

### 8. Alimentation

Ce critère revient au projecteur, et il faut le dire clairement. Un projecteur laser de 10 000 lumens tire 1–1,5 kW d'une prise monophasée. Un mur de 32 m² à 2,6 mm peut approcher 20 kW sur une image blanche à pleine puissance ; sur du contenu vidéo typique, il consomme en moyenne 6–9 kW, mais l'installation est dimensionnée sur la pointe.

> Dans une pièce claire, la question n'est pas quelle image est la plus belle. C'est quelle image peut être vue.

## Scénario A : un lancement de 400 invités dans une salle de bal d'hôtel

La scène fait 10 m de large, 400 invités dînent à table, l'éclairage de salle reste entre 150 et 300 lux pendant le repas et l'événement est diffusé. Comme écran de scène, nous proposons un mur XR Event de 8 × 4 m à un pas de 2,6 mm : 32 m², 3 072 × 1 536 pixels, 800–1 200 nits et une fréquence de rafraîchissement supérieure à 3 840 Hz pour les caméras. Le mur se hisse depuis les points de gréage de la salle ou se pose au sol, et quatre techniciens le livrent en cinq heures. Le contenu est produit en 2:1 à la résolution native.

## Scénario B : un auditorium d'entreprise avec lumière du jour

Un auditorium d'entreprise : 300 places, du verre non occulté sur une face, 400–600 lux mesurés sur scène en journée, 1 200 heures d'utilisation par an et la plupart des sessions enregistrées. Un projecteur de 20 000 lumens sur un écran de 7 m produit 230 nits sur le papier ; 500 lux de lumière ambiante renvoient 160 nits depuis l'écran et le contraste tombe à 2,4:1. Le texte des diapositives reste lisible, mais les photographies, la vidéo et les fonds sombres s'effacent.

Comme écran de salle de conférence, un mur XR Fine de 7 × 3,5 m à 1,9–2,5 mm laisse la pièce telle qu'elle a été conçue : 800–1 000 nits, exploité à 50–70 % le jour et à 30 % le soir. Avec le premier rang à 4 m, 2,5 mm est confortable et assez efficace pour le dernier rang à 25 m. L'image est d'un seul tenant, indifférente à l'éclairage de scène et sans scintillement à la caméra.

## Scénario C : une salle de conseil sous 3 m

Toutes les salles ne justifient pas un mur LED. Dans une salle de conseil de douze places avec une image de 2–2,5 m, un projecteur laser à courte focale sur un écran rejetant la lumière ambiante, ou un LCD de 98 pouces, suffit et coûte moins cher. Le coût au pouce du LED perd contre le LCD en dessous de 3 m, et une surface regardée à 1 m exige un pas sous 1 mm.

## Comparaison des coûts de location : le même événement, deux budgets

Parce que les fourchettes bougent avec les taux de change et la saison, cette section donne des ratios, pas des chiffres ; le tarif au mètre carré en vigueur est confirmé au devis. À l'échelle du scénario A, un ensemble projecteur-écran unique se loue environ d'un tiers à la moitié d'un mur LED de même taille d'image. Ajoutez le second projecteur, le mélange, le serveur média et le technicien qu'exige une pièce claire, et l'écart se resserre dans une fourchette de 10–30 %.

## Quand un projecteur reste le bon choix

Le but de ce guide n'est pas d'écarter la projection mais d'en tracer la frontière. Dans les cas suivants, un projecteur n'est pas seulement adéquat, mais généralement la meilleure solution, et nous le disons dans nos propres propositions.

1.   0 1 Les pièces qui peuvent être assombries : cinémas, théâtres et spectacles du soir. En dessous de 50 lux, une image de 100–160 nits dépasse le standard cinéma, et la luminosité du LED n'apporte rien.
2.   0 2 Le mapping sur l'architecture : la projection sur des façades, des dômes et des sculptures ne peut pas être imitée par le LED ; la texture de la surface fait partie de l'image.
3.   0 3 Les budgets très serrés et les petites réunions ponctuelles : une unité, un écran, une prise.
4.   0 4 Les décors qui veulent une image douce et texturée : certaines productions théâtrales et de danse préfèrent le caractère diffus de la projection.
5.   0 5 Les présentations itinérantes où la portabilité décide : pour une équipe qui voyage de ville en ville avec une valise de 20 kg, la logistique LED n'a pas de sens.

## Passer du projecteur à l'écran LED : une liste de contrôle

Lorsqu'on fait passer un lieu ou un événement de la projection au LED, réglez ces points au préalable et le processus de devis se clôt en un seul tour au lieu de trois.

1.   0 1 Mesure de la lumière ambiante : lux à l'emplacement de l'écran en plein jour et sous l'éclairage de l'événement.
2.   0 2 Largeur d'image et rapport d'image : sauf si le 16:9 est obligatoire, un ratio 2:1 ou 3:1 adapté à la scène.
3.   0 3 Distance de vision la plus proche : elle fixe le pas de pixel ; en dessous de 2,5 m, il faut un pas sous 2,5 mm.
4.   0 4 Points de gréage et sol : capacité de gréage certifiée, ou profondeur pour un montage posé au sol.
5.   0 5 Alimentation : arrivée triphasée, cheminement de câbles et distribution, calculés sur la pointe.
6.   0 6 Broadcast : si des caméras sont présentes, rafraîchissement au-dessus de 3 840 Hz et une cible de luminosité pour l'exposition.
7.   0 7 Contenu : production à la résolution native, et entrées du processeur pour la présentation, la caméra et le serveur média.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Mur LED ou projecteur : lequel est meilleur pour les événements ?`,
        answer: `Si la pièce ne peut pas être assombrie ou si l'image dépasse 5 m, un mur LED ; dans une pièce sombre avec une image sous 5 m, un projecteur suffit et coûte moins cher. Pour les lancements, galas et conférences où l'éclairage reste allumé et où des caméras sont présentes, le LED est la référence pour la visibilité, une image sans couture et une scène sans ombre.`,
      },
      {
        question: `Un écran LED est-il visible en plein jour ?`,
        answer: `Oui. Les murs LED intérieurs délivrent 800–1 200 nits et les modèles extérieurs 5 000 nits et plus. Dans une salle de conférence vitrée à 500 lux, un mur LED de 1 000 nits maintient un contraste au-dessus de 100:1, tandis qu'un projecteur de 20 000 lumens dans la même salle avoisine 2,5:1. Les surfaces en plein soleil exigent une luminosité de classe extérieure plutôt qu'un mur intérieur poussé au maximum.`,
      },
      {
        question: `Combien de lumens faut-il à un projecteur pour égaler un mur LED ?`,
        answer: `Règle empirique : lumens nécessaires ≈ nits visés × surface de l'écran en m² × 3,14. Sur un écran de 20 m², 1 000 nits nécessitent plus de 60 000 lumens, soit l'empilement de trois ou quatre des plus gros projecteurs de salle. Même un acceptable 300 nits dans une pièce éclairée demande environ 19 000 lumens et deux unités.`,
      },
      {
        question: `Louer un mur LED coûte-t-il plus cher qu'un projecteur ?`,
        answer: `Par rapport à un projecteur et un écran uniques, oui : le tarif journalier du mur LED est deux à trois fois plus élevé. Pour une visibilité équivalente dans la même salle, ajouter un second projecteur, le mélange, un serveur média, un technicien et l'occultation réduit l'écart à 10–30 %, et sur des événements de plusieurs jours il se referme souvent. La bonne comparaison est le coût total de la même visibilité, pas le tarif du jour.`,
      },
      {
        question: `Un mur LED a-t-il sa place dans une salle de réunion ?`,
        answer: `Oui ; les modules fine pitch de moins de 30 mm de profondeur s'encastrent au nu du mur, et les écrans LED tout-en-un de 108–136 pouces s'installent en une unité en une journée. En dessous de 3 m de largeur d'image, le LCD ou la projection à courte focale sont cependant généralement plus économiques.`,
      },
      {
        question: `À partir de quelle taille le LED devient-il incontournable ?`,
        answer: `Dans une pièce sombre, un projecteur unique sert jusqu'à 6–7 m ; au-delà, le mélange des bords est nécessaire et la zone de mélange devient visible. Dans une pièce éclairée, la limite arrive bien plus tôt, à 3–4 m, car les lumens se divisent par la surface de l'écran. Règle pratique : lumières allumées et image de plus de 4 m signifient que le LED est la seule option réaliste.`,
      },
    ],
  },
  'pixel-pitch': {
    contentFr: `Le pas de pixel est le chiffre qui façonne un projet d'écran LED plus que tout autre. Il fixe la résolution du mur, la distance de vision minimale, le nombre de LED au mètre carré, la consommation et, en définitive, le budget. C'est aussi la caractéristique la plus souvent choisie pour de mauvaises raisons — généralement parce qu'un pas plus fin paraissait mieux en salle d'exposition. Ce guide explique ce qu'est le pas de pixel, comment calculer la distance de vision, la relation entre pas et résolution, et comment choisir un pas adapté au contenu sans payer pour des pixels que personne ne verra.

## Qu'est-ce que le pas de pixel sur un écran LED ?

Le pas de pixel est la distance, en millimètres, entre les centres de deux pixels LED voisins. Un écran P2,6 se lit proprement à partir d'environ 2,6 m ; un écran P6 à partir d'environ 6 m. À cette distance, l'œil ne distingue plus les pixels individuels et l'image paraît continue. La distance de vision optimale se situe à deux ou trois fois le pas, là où le contenu est le plus beau et où la résolution supplémentaire n'est ni gaspillée ni regrettée.

### Pas de pixel, résolution et taille de mur

La résolution découle directement du pas et de la taille. Plus le pas est fin, plus la même surface offre de pixels, mais aussi plus de LED, de canaux de driver, de chaleur et de coût. Un mur de 6 × 3,375 m à P2,5 offre environ 240 × 135 pixels par module selon les formats ; à P1,9, la résolution grimpe fortement. Décidez d'abord le format de contenu (Full HD, 4K, un canevas ultra-large sur mesure), puis trouvez le pas et la taille de mur qui le délivrent.

## La règle empirique de la distance de vision

Le point de départ le plus utile est la règle des dix : la distance de vision confortable minimale en mètres est à peu près le pas de pixel en millimètres. Un écran P2,6 se lit proprement à partir d'environ 2,6 m ; un écran P6 à partir d'environ 6 m. À cette distance, l'œil ne distingue plus les pixels individuels et l'image paraît continue. La distance de vision optimale se situe à deux ou trois fois le pas.

1.   0 1 P0,9 – P1,2 : 1–3 m — salles de contrôle, salles de conseil, plateaux de diffusion, données denses.
2.   0 2 P1,5 – P1,9 : 2–5 m — halls, salles de briefing, flagships de vente, musées.
3.   0 3 P2,5 – P3,9 : 3–10 m — auditoriums, scènes d'événements, grands atriums, showrooms.
4.   0 4 P4 – P6 : 6–20 m — salles de sport couvertes, halls d'exposition, extérieur de champ proche.
5.   0 5 P6,9 – P10,4 : 10–50 m — DOOH extérieur, façades, périmètres de stade.
6.   0 6 P16 et plus : 30 m et plus — résille transparente, très grandes façades, panneaux autoroutiers.

> Achetez le pas dont votre public a besoin, pas celui que la brochure célèbre.

## Pas de pixel en intérieur : salles de conseil, halls et commerce

Les salles de conseil et les salles de contrôle placent les spectateurs à deux à quatre mètres avec du texte dense, des tableurs et des tableaux de bord. C'est le territoire du fine pitch — 0,9 à 1,9 mm — où la différence entre P1,2 et P1,9 se voit dans chaque ligne de texte. Les halls et les flagships de vente tolèrent 1,9 à 2,6 mm, car le contenu est vidéo, les spectateurs passent plutôt qu'ils ne fixent, et le mur est jugé sur l'impact plutôt que sur la lisibilité. Au-dessus de 3 mm en intérieur, les pixels individuels commencent à se voir à distance de conversation et le mur ressemble à de la signalétique plutôt qu'à de l'architecture.

### Le pas fin sous 1 mm

En dessous d'environ 1,2 mm, le package LED lui-même change : le chip-on-board (COB) et le flip-chip remplacent les packages SMD, offrant une surface scellée et mate, à meilleur contraste et résistante aux chocs. Ces écrans coûtent plus cher au mètre carré mais sont le bon choix pour les salles critiques vues à moins de trois mètres.

## Pas de pixel en extérieur : façades et DOOH

Les distances de vision en extérieur commencent à dix mètres et dépassent souvent cinquante. Un pas de 6,9 ou 10,4 mm n'est pas un compromis ici — c'est le bon choix d'ingénierie. Une fois le public de l'autre côté de la rue, la luminosité (5 000–10 000 nits), l'étanchéité (IP65 avant et arrière), la conception thermique et la maintenabilité comptent bien plus que la densité de pixels. Spécifier du P3,9 pour une façade vue de 40 m quadruple le nombre de LED, la puissance et la chaleur pour une résolution que personne ne peut voir.

## Pourquoi le coût et la puissance augmentent avec le carré du pas

Diviser le pas par deux quadruple le nombre de pixels. Passer de 3,9 mm à 1,9 mm quadruple à peu près les LED au mètre carré, avec des augmentations correspondantes des puces de driver, des cartes de réception, des alimentations, de la chaleur et, sur des années d'exploitation, de l'électricité. Un mur de 100 m² qui tire 30 kW en pointe au lieu de 12 kW est un projet mécanique et électrique très différent. Spécifiez le pas le plus serré que la distance de vision exige — et pas plus fin — et mettez les économies dans la marge de luminosité, le calibrage et les rechanges.

## Une méthode en cinq minutes pour choisir le pas de pixel

1.   0 1 Mesurez la position de vision réaliste la plus proche, pas la plus éloignée.
2.   0 2 Divisez cette distance en mètres par 1,5 pour obtenir un pas maximal en millimètres.
3.   0 3 Vérifiez le type de contenu : le texte et les données poussent vers le fin ; la vidéo permet de relâcher d'un cran.
4.   0 4 Vérifiez la lumière ambiante : les espaces éclairés par la lumière du jour et l'extérieur ont besoin de luminosité avant la densité.
5.   0 5 Confirmez le budget contre le carré du pas, puis décidez si un mur légèrement plus grand à un pas plus grossier offre plus d'impact pour le même argent.

## Erreurs courantes de pas de pixel

1.   0 1 Choisir le pas en salle d'exposition à un mètre au lieu de la distance de vision réelle.
2.   0 2 Mélanger les pas au sein d'une même installation et attendre que le contenu corresponde.
3.   0 3 Ignorer la fréquence de rafraîchissement : les murs face caméra ont besoin de 3 840 Hz ou mieux, quel que soit le pas.
4.   0 4 Oublier qu'un pas plus fin suppose un contenu plus fin — un fichier 1080p sur un mur 4K est mis à l'échelle.
5.   0 5 Sous-spécifier la luminosité d'un mur fine pitch dans un hall vitré.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Quel pas de pixel pour un mur d'images LED ?`,
        answer: `Pour les murs intérieurs vus de 2–5 m, 1,5–1,9 mm est le bon compromis ; pour les scènes et auditoriums 2,5–3,9 mm ; pour les façades extérieures et le DOOH 6–10 mm. Adaptez le pas à la distance de vision réaliste la plus proche plutôt que de choisir le pas le plus fin abordable.`,
      },
      {
        question: `Comment calculer la distance de vision à partir du pas de pixel ?`,
        answer: `Utilisez la règle des dix : la distance minimale en mètres égale le pas en millimètres. Un P2,6 se lit proprement à partir d'environ 2,6 m. La distance optimale est de deux à trois fois ce chiffre.`,
      },
      {
        question: `Un pas de pixel plus petit consomme-t-il plus de puissance ?`,
        answer: `Oui. Le nombre de pixels augmente avec le carré de la réduction du pas : diviser le pas par deux quadruple environ le nombre de LED et augmente en conséquence la puissance, la chaleur et le coût.`,
      },
      {
        question: `Quelle est la différence entre un LED P1,9 et P2,5 ?`,
        answer: `Le P1,9 compte environ 277 000 pixels par mètre carré et le P2,5 environ 160 000. Le P1,9 se lit proprement à partir de 2 m, le P2,5 à partir de 2,5 m. Pour les halls dominés par la vidéo, la différence est rarement visible ; pour les salles riches en texte, elle l'est.`,
      },
      {
        question: `Le fine pitch LED est-il meilleur que les murs d'images LCD ?`,
        answer: `Le fine pitch LED n'a pas de bords, offre plus de luminosité, un gamut plus large et une meilleure longévité, et il s'adapte à toutes les tailles. Le LCD reste moins cher pour les petits écrans proches de moins de trois mètres de large.`,
      },
    ],
  },
  'retail-window-led': {
    contentFr: `Un écran LED de vitrine transforme le seul espace publicitaire que chaque passant voit déjà en outil de vente animé plutôt qu'en affiche statique. Le flux à la porte, les heures d'ouverture et le rythme de la rue ou du corridor d'un centre commercial font de la vitrine la surface média la plus précieuse que possède la plupart des détaillants, et le loyer est déjà payé. Ce guide présente les quatre formats d'une vitrine numérique — Poster LED Display, mur fine pitch derrière la vitre, Jellyfish LED Film et Jellyfish Hologram Glass — puis aborde les recommandations par type de boutique, la planification du contenu, l'ensoleillement et la luminosité, l'installation, l'alimentation et le retour sur investissement.

## Pourquoi la vitrine est votre espace publicitaire le plus précieux

La valeur d'un espace publicitaire résulte de deux chiffres : combien de personnes le longent et combien d'heures il est visible. Une vitrine animée de grand axe à Istanbul voit passer 20 000 à 60 000 piétons par jour ; le trafic d'un corridor de grand centre commercial dépasse 30 000 le week-end. La boutique est ouverte douze heures, mais la vitrine est visible en continu, et un écran LED continue de jouer après la fermeture tant que le rideau reste levé. Un média extérieur loué s'arrête à la fin du contrat. La vitrine est à vous : elle travaille chaque heure où elle est allumée et affiche une nouvelle campagne dès que vous la téléchargez.

Une affiche statique est lue une fois puis l'œil passe. Les images en mouvement sont captées en vision périphérique : la tête se tourne, le pas ralentit et un instant de décision s'ouvre. Les études de détail ont maintes fois mesuré une nette hausse du temps d'arrêt devant les vitrines numériques par rapport aux vitrines statiques ; les chiffres varient selon la boutique, mais la tendance ne change jamais. C'est le rôle d'un écran LED de détail en vitrine : convertir les passants en personnes qui s'arrêtent, et celles qui s'arrêtent en personnes qui entrent.

## Quatre formats d'écran LED de vitrine

Les options d'écran LED de détail pour une vitrine se répartissent en quatre formats. Ils diffèrent par le pas de pixel, la luminosité, la transparence et le mode d'installation, et le bon choix dépend de la profondeur de la vitrine, de l'orientation de la vitre et de la présence de produits derrière. Chacun est décrit ci-dessous avec les caractéristiques qui comptent pour une vitrine, suivi d'un guide de sélection rapide.

### Poster LED Display : brancher, poser, vendre

Le Poster LED Display est une affiche LED portrait de 640 × 1920 mm qui tient sur sa propre base, se suspend au plafond ou se fixe au mur. Les pas de 1,53, 1,86 et 2,5 mm restent nets à bout de bras, et 600–700 nits suffisent pour une baie de vitrine ou la surface de vente. Il fonctionne sur une seule prise, prend le contenu par USB ou téléversement sans fil, et plusieurs posters se chaînent en une image haute ou une rangée synchronisée. Sans saignée, sans perçage et sans étude électrique, c'est la voie la plus rapide vers une vitrine en affiche LED, et il vous suit à la fin du bail.

### Le mur derrière la vitrine : XR Fine

Si la vitrine est profonde et que son mur arrière se situe un à trois mètres derrière la vitre, l'image la plus forte vient d'une surface LED fine pitch sur ce mur plutôt que sur la vitre. XR Fine construit un mur sans bord à 1,5–2,5 mm de pas : les produits et les mannequins se tiennent devant, une scène animée joue derrière. Rien n'est fixé à la vitre ; les caissons sont suspendus au mur et entretenus par l'avant. Comme il est aussi vu de l'intérieur, le même mur sert à la fois de signalétique numérique en boutique et de présentoir de vitrine.

### Jellyfish LED Film : un écran transparent collé au verre

Jellyfish LED Film est un film LED transparent de 2 mm qui se colle directement sur un vitrage existant. À 6,25–10 mm de pas, il conserve une transparence supérieure à 90 %, de sorte que les produits en vitrine restent visibles derrière le film tandis que l'image semble flotter sur la vitre. Environ 1 500 nits se lisent depuis la rue en plein jour. Sans cadre, sans perçage, sans nouveau verre : pour les locataires qui ne peuvent pas toucher la façade, c'est la voie la plus pratique vers un écran LED de vitrine transparent. Notre guide des écrans LED transparents compare la technologie en détail.

### Jellyfish Hologram Glass : le verre qui porte les LED

Jellyfish Hologram Glass intègre les LED et les puces de driver dans un vitrage multicouche ; l'écran, c'est le verre lui-même. Des pas de 4 à 20 mm et une luminosité jusqu'à 5 000 nits sont destinés aux grandes devantures plein sud et aux vitrines flagships. Les panneaux s'assemblent sans bord jusqu'à 6 m et suivent les verres courbes. Comme il remplace le vitrage, il s'inscrit dans une construction neuve ou une rénovation complète, et offre le rendu le plus net : éteint, il ressemble à du verre ordinaire. Son frère sans cadre, le Jellyfish Hologram Display, s'applique au verre existant sans toucher à la structure.

1.   0 1 Locataire qui doit démarrer vite : Poster LED Display, une prise, il vous suit.
2.   0 2 Vitrine profonde avec mur arrière : mur XR Fine derrière la vitre, la meilleure résolution.
3.   0 3 Produits devant rester visibles à travers la vitre : Jellyfish LED Film, plus de 90 % de transparence.
4.   0 4 Façade neuve ou flagship avec verre plein sud : Jellyfish Hologram Glass, jusqu'à 5 000 nits.

## Quel écran LED de détail pour quelle boutique

Deux boutiques ne veulent pas le même écran. La taille de ce que vous vendez, le temps que le client met à décider et l'état physique de la vitrine décident du format. Les six scénarios ci-dessous sont les plus fréquents dans les projets de rue et de centre commercial à Istanbul ; à traiter comme points de départ, car un relevé de la vitrine réelle tranche le choix final.

1.   0 1 Mode et prêt-à-porter : un mur XR Fine derrière la vitrine pour les films de collection et les campagnes, ou deux Poster LED Display à côté des mannequins ; le contenu change au fil des saisons, l'écran reste.
2.   0 2 Bijouterie et horlogerie : petits produits, éclairage critique. Un seul Poster LED Display 1,53 mm derrière les plateaux diffuse des images macro ; le film transparent est le second choix car il n'ombre jamais les pièces.
3.   0 3 Téléphonie et électronique : cycles de prix et de promotions rapides. Deux ou trois Poster LED Display chaînés avec gestion centrale affichent le même prix dans chaque agence à la même minute.
4.   0 4 Concessions automobiles : grandes vitres, longue distance de vision. Jellyfish LED Film ou Hologram Glass anime la devanture sans cacher la voiture ; à l'intérieur, un mur XR Fine devient l'écran configurateur.
5.   0 5 Restaurants et cafés : menus et offres selon les moments. Un Poster LED Display portrait près de la porte montre le petit-déjeuner le matin, le menu du midi à midi et les desserts le soir ; sans son.
6.   0 6 Pharmacies et cosmétiques : information et confiance. Un Poster LED Display couvre les horaires de garde, les promotions et les produits saisonniers, baissé à 30 % la nuit.

## Le plan de contenu : combien de secondes, combien de créas

Un piéton passe devant une vitrine en trois à cinq secondes. Chaque scène d'un écran LED de vitrine doit donc durer 6–10 secondes, le message principal doit se lire dans les deux premières, et la boucle doit rester sous 30–60 secondes. Trois à cinq créas suffisent en pratique : une scène de marque, deux campagnes, un focus produit et, au besoin, une carte d'information. Programmez par moment de la journée ; le passant du matin ne magasine pas comme celui du soir. Nourriture à midi, remises en fin d'après-midi et offre familiale le week-end forment un day-parting simple qui booste le même écran sans nouveau contenu.

N'utilisez pas le son : il ne s'entend pas à travers la vitre, les centres commerciaux l'interdisent et il fatigue le personnel. Les règles de mouvement sont claires : grand mouvement lent, un seul point focal, fort contraste, et un texte d'au moins 80–100 pixels de haut pour se lire depuis le trottoir. La cohérence de marque fait de l'écran une partie de la boutique ; logo, typographie et palette doivent correspondre à la vitrine imprimée. Le contenu peut venir de votre agence, de votre équipe ou de l'équipe contenu de PixiaTech. L'essentiel est un calendrier de rafraîchissement mensuel, car une vitrine qui joue la même vidéo depuis six mois est redevenue une affiche statique.

1.   0 1 6–10 secondes par scène, pas plus de 60 secondes par boucle.
2.   0 2 Un message, un prix, un appel à l'action par scène.
3.   0 3 Un design portrait pour un format portrait ; une vidéo paysage n'est ni recadrée ni pivotée.
4.   0 4 Fonds noirs sur les écrans film et verre : un pixel noir est éteint, et ce qui est derrière transparaît.
5.   0 5 Luminosité nocturne et thème de contenu de nuit enregistrés comme programme séparé.

> Un écran de vitrine n'est pas un appareil qu'on achète une fois ; c'est une devanture qu'on réécrit chaque mois.

## Ensoleillement et luminosité : l'écran LED de vitrine plein sud

La plainte la plus fréquente à propos d'un écran LED de vitrine est qu'il ne se voit pas en plein jour, et presque toujours la cause est une mauvaise classe de luminosité. Une vitrine orientée nord ou une unité de centre commercial se contente de 600–1 000 nits. Une vitrine orientée sud ou ouest exposée au soleil direct de l'après-midi a besoin de 2 500–4 000 nits, et dans cette gamme la réponse est Jellyfish LED Film, sur la vitre à 1 500 nits avec peu de perte par réflexion, ou Jellyfish Hologram Glass jusqu'à 5 000 nits. Un Poster LED Display standard dans une telle vitrine est reculé de 1–1,5 m par rapport à la vitre, associé à un film antireflet, ou ombragé par un store.

La réflexion est le second problème. La vitre superpose le trottoir d'en face et le ciel sur l'image ; un contenu à fond sombre et un écran placé au plus près de la vitre réduisent l'effet. La gradation automatique par capteur de lumière économise l'électricité et prolonge la vie des LED : pleine puissance le jour, 50 % le soir, 20–30 % la nuit. Un écran à luminosité fixe toute la nuit est une nuisance et tombe sous le coup des règles des centres commerciaux et des municipalités.

## Installation et alimentation : une seule prise suffit-elle

Pour la plupart des installations de vitrine, oui. Un seul Poster LED Display tire environ 200 W en moyenne et jusqu'à environ 600 W en pointe sur ses 1,23 m² ; une prise standard 220 V, 16 A alimente confortablement trois posters. Un mur XR Fine derrière la vitrine se budgète à 150–250 W par m² en moyenne, donc un mur de 6 m² mérite son propre circuit. Jellyfish LED Film est le plus économe à 40–170 W par m², mais il faut 10–15 cm au bord de la vitre pour le connecteur de bord et le boîtier de driver.

Le tracé des câbles doit être dessiné avant la fin de l'aménagement de la vitrine : la prise sous le plancher de vitrine, les câbles en goulotte, rien en travers d'un passage. Les posters autoportants ont besoin d'une protection anti-basculement ; lorsque le poids de la base ne suffit pas, une fixation cachée au mur ou au sol est ajoutée. La chaleur n'est pas un souci, mais laissez 5 cm d'air derrière un poster et ne scellez pas un volume fermé entre l'écran et la vitre. L'installation prend typiquement une heure pour un poster, une demi-journée pour un film et un à trois jours pour un mur.

## Retour sur investissement : du flux piéton aux entrées

Le retour d'un écran LED de vitrine se mesure via un entonnoir en quatre étapes : passer, s'arrêter, entrer, acheter. Prenez une boutique de rue avec 10 000 piétons par jour. Si 1 % s'arrête devant une vitrine statique, cela fait 100 personnes ; si la vitrine numérique porte cela à 2 %, cela fait 200. Si 15 % d'entre eux entrent, cela fait 30 visiteurs au lieu de 15 ; à 20 % de conversion en boutique, six ventes par jour au lieu de trois. Lisez ces chiffres comme des ordres de grandeur, pas des sommes : trois ventes supplémentaires par jour font environ quatre-vingt-dix par mois, et 450 visiteurs de plus dans la boutique. Ce que vaut un panier moyen dans votre boutique, c'est à vous de le savoir.

Mesurez avant d'installer, sinon la comparaison d'après ne vaut rien. Comptez les piétons passant devant la vitrine pendant une semaine entière, enregistrez les entrées avec un capteur de porte et tirez la même semaine depuis la caisse : nombre de transactions, articles par transaction et heures de la journée où elles se concentrent. Répétez le comptage quatre semaines après la mise en service de l'écran et de nouveau la saison suivante, avec la même méthode et les mêmes jours de la semaine. La météo, les jours fériés et la fermeture d'un voisin déplacent ces chiffres autant que l'écran, donc lisez la tendance sur plusieurs semaines plutôt qu'un seul bon samedi.

Au-delà de l'écran lui-même, trois postes reviennent chaque année : l'électricité, la production de contenu et la maintenance. L'électricité est prévisible à partir des chiffres de puissance ci-dessus et baisse encore avec la gradation par capteur. Le contenu est le poste que la plupart des détaillants sous-estiment, car un rafraîchissement mensuel exige quelqu'un en charge du calendrier, que ce soit votre équipe, votre agence ou la nôtre. La maintenance d'une installation de vitrine est légère : une alimentation et une carte de réception de rechange en réserve, un nettoyage annuel de la surface et des connecteurs, et une vérification que la programmation correspond toujours à vos heures d'ouverture.

## Règles de centre commercial : autorisation et limites de luminosité

Dans une unité de centre commercial, un écran LED de vitrine est soumis à l'approbation de la direction du centre, pas seulement du magasin. La plupart des cahiers de conception de vitrines de centre commercial définissent explicitement les écrans numériques : plafond de luminosité sur la surface côté corridor (généralement 800–1 500 nits), pas de son, pas de contenu clignotant ou à coupes rapides, limites de fixation à la devanture et examen des travaux électriques par l'équipe technique du centre. Le dossier de demande porte les dimensions de l'écran, sa position, sa luminosité, sa consommation et un échantillon de contenu. Le Poster LED Display et le Jellyfish LED Film passent ce processus le plus facilement car ni l'un ni l'autre ne modifie durablement la devanture. Dans la rue, c'est la réglementation municipale de l'enseigne et la ligne du rideau qui s'appliquent.

## Une liste de contrôle avant de commencer

1.   0 1 L'orientation de la vitrine et son exposition au soleil direct dans la journée.
2.   0 2 Les dimensions de la vitre, la profondeur de la vitrine et la présence d'un mur arrière.
3.   0 2 La prise la plus proche et un tracé où le câble peut passer.
4.   0 4 Les documents requis pour l'autorisation du centre commercial ou de la municipalité.
5.   0 5 Un calendrier de contenu et un calendrier de rafraîchissement, avec responsables.

Envoyez-nous la surface, l'orientation et une photo de la vitrine, et l'équipe PixiaTech revient avec un format recommandé, un calcul de luminosité et un plan de contenu. La surface de la vitrine, l'exposition au soleil et le flux devant la porte sont les trois nombres qui décident du format et de la luminosité.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Combien coûte un écran LED de vitrine ?`,
        answer: `PixiaTech chiffre chaque vitrine au projet, il n'y a donc pas de tarif de liste. Ce qui détermine le prix, c'est la surface, le pas de pixel, la classe de luminosité qu'exige l'orientation de la vitre, le mode de fixation et l'inclusion ou non du contenu et de la maintenance. Envoyez les dimensions de la vitrine, son orientation, si elle prend le soleil direct et la distance de vision la plus proche ; vous recevez une proposition et une estimation chiffrée.`,
      },
      {
        question: `Qu'est-ce qu'une affiche LED ?`,
        answer: `Une affiche LED est un écran LED portrait fin de 640 × 1920 mm qui tient sur sa propre base ou se suspend au plafond et fonctionne sur une seule prise. Les pas de 1,53–2,5 mm donnent une image nette à courte distance ; le contenu se charge par USB ou sans fil, et plusieurs affiches se chaînent en une seule image. C'est le format de vitrine numérique le plus rapide à installer pour les boutiques, les halls ou les salons.`,
      },
      {
        question: `Un écran LED peut-il être vu dans une vitrine ensoleillée ?`,
        answer: `Oui, si la bonne classe de luminosité est choisie. Une vitrine orientée sud ou ouest en plein soleil nécessite 2 500–4 000 nits, ce qui oriente vers le Jellyfish LED Film appliqué à la vitre ou le Jellyfish Hologram Glass jusqu'à 5 000 nits. Une affiche LED standard de 600–700 nits fonctionne dans les vitrines ombragées lorsqu'elle est reculée de 1–1,5 m de la vitre, avec un contenu à fond sombre et un film antireflet.`,
      },
      {
        question: `Peut-on monter des LED sur du verre ?`,
        answer: `Oui, de deux façons. Le Jellyfish LED Film est un film adhésif de 2 mm qui s'applique directement sur le verre existant, conserve une transparence supérieure à 90 % et ne demande aucun nouveau vitrage. Le Jellyfish Hologram Glass est un vitrage neuf avec les LED intégrées à l'intérieur ; il offre le rendu le plus net mais se planifie avec une rénovation de façade. Dans les deux cas, les produits en vitrine restent visibles.`,
      },
      {
        question: `Qui produit le contenu d'un écran de vitrine ?`,
        answer: `Trois options : l'équipe design du magasin, l'agence publicitaire avec laquelle vous travaillez déjà, ou l'équipe contenu de PixiaTech. Qui que ce soit, les mêmes règles s'appliquent : un design portrait aux dimensions en pixels de l'écran, 6–10 secondes par scène et un message par scène. Un pack de démarrage de trois à cinq créas est préparé avec l'installation, et un calendrier de rafraîchissement mensuel maintient l'écran vivant.`,
      },
      {
        question: `Combien d'électricité consomme un écran LED de vitrine ?`,
        answer: `Un seul Poster LED Display tire environ 200 W en moyenne et jusqu'à 600 W en pointe ; utilisé douze heures par jour, cela représente environ 70–80 kWh par mois. Un film LED transparent consomme en moyenne 40–170 W par m² et un mur fine pitch derrière la vitrine 150–250 W par m². La gradation automatique par capteur de lumière réduit la consommation nocturne de 60–70 %.`,
      },
    ],
  },
  'led-floor-screens': {
    contentFr: `Un écran de sol LED est le seul écran d'un spectacle sur lequel on se tient debout, on danse, on fait glisser des flight cases et où l'on renverse parfois un verre, aussi se choisit-il selon des règles différentes du mur derrière lui. La capacité de charge, la surface et la mise à niveau passent en premier ; le pas de pixel et la luminosité viennent ensuite. Ce guide couvre la structure d'un caisson de sol, la signification réelle de kg/m², le bon pas pour une surface vue d'en haut, les sols LED interactifs, et des exemples concrets pour mariages, scènes, studios XR, showrooms et musées.

## Ce qui distingue un écran de sol LED d'un caisson mural

Un caisson mural n'a qu'à se porter lui-même et les caissons suspendus en dessous. Un caisson de sol travaille en compression : la charge arrive d'en haut, traverse le masque et le module jusqu'à un cadre en métal moulé, et sort par les pieds dans le plancher support. Le cadre est donc une pièce structurelle avec une capacité publiée plutôt qu'un boîtier, et tous les autres composants sont construits autour de ce chemin de charge. C'est le produit que le marché appelle aussi écran LED praticable.

1.   0 1 Cadre porteur : une structure métallique nervurée qui transmet le poids aux pieds sans faire plier les modules.
2.   0 2 Masque : une couche supérieure mate et antidérapante en verre trempé ou polycarbonate qui protège les LED et répartit la pression d'un talon ou d'une roue.
3.   0 3 Surface scellée : des joints autour de chaque module tiennent poussière, confettis et liquide renversé à l'écart des cartes.
4.   0 4 Pieds réglables : des pieds de mise à niveau indépendants rattrapent un plancher inégal et ménagent un passage pour les câbles sous le plancher.
5.   0 5 Rampes et profils de bord : des profils en pente ferment le côté ouvert, suppriment l'arête de trébuchement et protègent les caissons extérieurs.

Dans notre gamme, ce produit est XR Floor : un caisson de 500 × 500 mm composé de quatre modules magnétiques de 250 × 250 mm, pesant 10,5–11,5 kg grâce à un cadre creux, avec des pieds indépendants réglables sur 60–75 mm. Il est noté à 1 500 kg/m² avec un coefficient de sécurité de trois, possède une surface antidérapante et antireflet et peut être commandé avec des capteurs de mouvement. Configuré pour la production virtuelle aux côtés du mur et du plafond de studio, le même sol s'appelle XR Deck. Il partage la grille d'un demi-mètre des murs de location, de sorte que sol et mur s'alignent sans pièces de remplissage.

## Capacité de charge : ce que signifie kg/m² sur un sol LED

La capacité de charge est le premier chiffre à demander et le plus souvent mal interprété. Un chiffre comme 1 500 kg/m² décrit une charge statique uniformément répartie : un poids réparti régulièrement sur la surface et à l'arrêt. Les sols du marché sont généralement notés entre 1 500 et 2 000 kg/m², les versions pour véhicules au-delà. Trois charges différentes agissent sur un sol réel, et une seule figure sur la fiche technique.

### Charge répartie : personnes debout et danse

Une foule serrée atteint quatre à cinq personnes par mètre carré, soit 320–400 kg/m² à 80 kg par personne. La danse ajoute un facteur dynamique : un saut retombe avec deux à trois fois le poids du corps, de sorte qu'un sol entier en mouvement au rythme peut approcher momentanément 1 000–1 200 kg/m². Une note de 1 500 kg/m² avec un coefficient de sécurité de trois couvre cela avec marge, c'est pourquoi cette classe est la norme admise pour une piste de danse LED ou une scène.

### Charge ponctuelle : talons, flight cases et pneus

La charge ponctuelle est un poids concentré sur une petite surface de contact. Un caisson de 500 × 500 mm noté 1 500 kg/m² porte l'équivalent de 375 kg répartis sur sa surface ; il n'accepte pas 375 kg sur une roulette de la taille d'une pièce. Un talon aiguille transmet peu de force mais une très haute pression, et c'est le masque, non le cadre, qui y résiste. Un flight case chargé pose 100–150 kg sur chaque roue ; une voiture électrique de 2 200 kg pose environ 550 kg sur chaque pneu, sur une surface d'environ 15 × 20 cm. Ce cas exige le chiffre de charge ponctuelle, pas celui de charge répartie.

### Le plancher support porte tout

Le sol transmet chaque charge, plus 42–46 kg/m² de son propre poids, à ce qui se trouve en dessous. Les planchers de scène de location sont couramment notés à 500–750 kg/m², et les parquets de salle de bal sont souvent inférieurs ; un sol à 1 500 kg/m² reste un sol à 500 kg/m² s'il repose sur un plancher à 500 kg/m². C'est pourquoi l'ouvrage support est examiné en même temps que l'écran.

## Pas de pixel pour un écran de sol vu d'en haut

Un sol se regarde sous des angles inhabituels. Un danseur debout regarde sous 3–4 m ; les invités assis, de 3–10 m sous un angle rasant ; une caméra sur perche, de 5–6 m d'en haut. C'est pourquoi le P3,9 domine les sols de spectacle, et pourquoi le P2,6 sert aux studios diffusant des caméras proches. Un pas plus fin qu'exigé place seulement des LED plus petites et plus fragiles sous les pieds des gens.

## Sols LED interactifs : détection, latence et moteurs de contenu

Un sol LED interactif réagit aux personnes présentes : des ondulations partent d'un pas, des dalles s'allument sous un enfant, un produit apparaît là où un visiteur s'arrête. Les usages typiques sont les activations de marque, les expositions de musée, les entrées de magasin, les espaces enfants et les jeux lors d'événements d'entreprise. L'écran est le même ; ce qui s'ajoute est une couche de détection et un moteur de contenu temps réel.

### Détection par pression ou infrarouge

Deux méthodes sont intégrées aux modules de sol. La détection par pression enregistre le poids sur un module ; elle est robuste, indifférente à l'éclairage et ne signale qu'un contact réel. La détection infrarouge place des paires émetteur-récepteur entre les LED et détecte la réflexion d'une chaussure juste au-dessus de la surface ; elle offre une grille plus fine, mais des projecteurs tungstène ou le soleil direct peuvent la perturber, elle est donc testée sous l'éclairage du spectacle. Les grandes salles permanentes peuvent plutôt suivre les personnes d'en haut avec des caméras de profondeur.

### Latence et moteur de contenu

Les données des capteurs arrivent à un serveur média, où un moteur temps réel calcule la réponse et l'envoie via le processeur LED aux caissons. Un balayage de capteur à 30–60 Hz coûte 17–33 ms, une image rendue environ 17 ms, et le processeur et les cartes de réception une à deux images de plus. Un total sous 100 ms paraît immédiat ; au-delà de 150 ms, l'effet traîne visiblement derrière le pied. Un point de détection par module de 250 mm suffit pour les pas et les jeux.

## Où sont utilisés les écrans de sol LED : cinq exemples concrets

### Piste de danse LED de mariage et de gala, 6 × 6 m

Une piste de danse LED de mariage de 6 × 6 m fait 36 m², soit 144 caissons, et convient à une salle de bal de 250–400 invités. À P3,9, le canevas fait 1 536 × 1 536 pixels. Le sol pèse environ 11 kg par caisson, soit près de 1,6 t au total. Il est choisi dans la classe IP65 car les boissons sont renversées, il a besoin d'une alimentation triphasée pour la pointe, et sa surface antidérapante reste praticable en talons. La lumière au sol est baissée à 20–40 %, sophistiquée et jamais scintillante.

### Sol de mur arrière de concert et de télévision

Un sol LED de scène de concert de 10 × 6 m fait 60 m², entre 150 et 180 caissons. À P3,9, le canevas fait environ 2 560 × 1 536 pixels, aligné sur le mur arrière de 10 × 6 m. Des caméras peuvent être utilisées, donc la version à fréquence élevée et au pas adapté est choisie ; une rampe mène au sol surélevé.

### Sol XR et production virtuelle accordé au mur

Un sol XR et un mur XR se règlent sur le même pas et la même fréquence de rafraîchissement pour éviter le décalage visible en caméra. Un sol de studio de 7 × 7 m fait 49 m², soit près de 200 caissons à P2,6 ; le budget et le portage se vérifient sur la base d'un module d'environ 11 kg.

### Showroom automobile et zone tournante

Un concessionnaire peut vouloir un sol LED autour d'un véhicule de 2 200 kg mis en avant. Un sol LED autour d'un anneau XR Fine offre un fond mouvant ; la voiture pèse plus que la charge concentrée d'un caisson, un plateau support dédié est donc nécessaire, et le sol ne peut pas la porter directement.

### Musées et centres d'expérience

Un musée utilise un sol LED de 4 × 3 m, 48 caissons, à P1,9–2,6, à des fins de contenu doux. Les sols de musée tournent souvent dix à douze heures par jour, ce qui impose la qualité de service décrite dans le guide LED Screens Lifespan & Maintenance.

## Surface et sécurité : classe antidérapante, éblouissement, talons et liquides

La surface est un composant de sécurité avant d'être un composant optique. Demandez la classe antidérapante documentée du masque, testée selon une norme reconnue comme l'échelle R des revêtements de sol ; les sols d'événement intérieurs secs se situent typiquement autour de R9–R10, et les surfaces humides ou extérieures ont besoin de plus. L'éblouissement est la seconde propriété : sous des lumières mobiles, un masque brillant renvoie des reflets dans les caméras et les premiers rangs et remonte le niveau de noir, aussi une finition mate et antireflet est-elle standard sur les sols de scène et de studio.

Les masques en polycarbonate sont robustes et légers mais se marquent avec le temps ; attention aux verres de montre et aux bagues sur les sols à trafic dense. Les talons aiguilles sont fragiles sur le verre ; les tabourets, trépieds et poteaux doivent être posés sur des plaques de répartition.

## Installer un écran de sol LED : planéité, mise à niveau, câbles et rampes

L'installation commence par le plancher support. La moquette est retirée ou recouverte de contreplaqué, car les pieds s'y enfoncent. La première rangée est posée sur une ligne de référence au niveau laser et chaque caisson est mis à hauteur par ses pieds indépendants ; la plage de 60–75 mm du XR Floor absorbe l'inégalité de la plupart des sols de salle de bal, de scène et d'exposition. La cible est une arête de moins d'un demi-millimètre entre caissons. Les bords ouverts reçoivent des rampes ou des profils : fauteuils roulants et chariots de traiteur ont besoin d'une pente proche de 1:12, ce qui pour un plancher d'environ 10 cm de haut signifie une rampe d'environ 1,2 m de long dans le plan de la salle.

L'alimentation et les données passent sous le plancher par le cadre creux, jamais en travers d'un passage. Les alimentations sont dimensionnées pour la pointe : le XR Floor tire 60–80 W par caisson en moyenne et 180 W en pointe.

## Contenu pour un sol : perspective, ralenti et luminosité réduite

Un contenu conçu pour debout est souvent mal adapté. Un graphique conçu pour cette perspective doit être réalisé en gardant à l'esprit que le spectateur regarde le sol sous un angle rasant et que les éléments éloignés paraissent comprimés. Les meilleurs contenus de sol sont des mouvements lents, des vagues, de la fumée colorée, des particules et des visuels réactifs au rythme ; les visuels à défilement rapide se dégradent et déçoivent. La luminosité est maintenue autour de 20–40 % pour ne pas éblouir les danseurs regardant vers le bas et ne pas délaver les photos.

> Sur un sol, la capacité de charge et la surface se choisissent d'abord et le pas de pixel ensuite ; personne ne se soucie de l'image sur un plancher où il n'est pas sûr de se tenir.

## Sol LED en location ou permanent

La plupart des pistes de danse LED et des sols de scène se louent : l'événement dure une nuit ou une tournée, le sol arrive dans des flight cases de six caissons, et le fournisseur assure l'équipe, les rampes, le processeur et un technicien de spectacle. Ce qui détermine le coût, c'est la surface, le pas de pixel, le nombre de jours de spectacle, l'option interactive, les heures de montage autorisées par le lieu et l'inclusion ou non du contenu. Notre guide de location d'écran LED liste les questions à régler avant de signer. Les sols permanents sont encastrés dans une fosse pour affleurer et se passer de rampe ; la fosse se conçoit avec l'architecte (profondeur, drainage, ventilation, conduits).

## Erreurs courantes avec les écrans de sol LED

La plupart des problèmes de sols se décident avant la pose du premier caisson. Voici les erreurs les plus fréquentes que nous voyons dans les cahiers des charges et sur site ; chacune est facile à éviter en planification et difficile à corriger le jour J.

1.   0 1 Lire kg/m² comme une charge ponctuelle et garer un véhicule ou une nacelle sur un sol noté pour des personnes.
2.   0 2 Oublier le plancher support : un écran à 1 500 kg/m² sur un plancher de scène à 500 kg/m² est un sol à 500 kg/m².
3.   0 3 Utiliser un sol intérieur non scellé là où l'on sert des boissons.
4.   0 4 Faire tourner le sol à la luminosité d'un mur, ce qui éblouit les danseurs et délaie chaque photo.
5.   0 5 Poser le sol sur de la moquette sans contreplaqué, ou ne laisser aucune place aux rampes dans le plan des tables.
6.   0 6 Traiter le contenu interactif comme un réglage d'écran plutôt qu'un logiciel qui demande du temps, des tests et un repli.

Envoyez-nous la surface, ce qui se tiendra sur le sol, le plancher support et si des caméras sont impliquées ; l'équipe PixiaTech renvoie une proposition avec vérification de charge, pas de pixel, nombre de caissons, alimentation et plan de rampes.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Quel poids un écran de sol LED peut-il supporter ?`,
        answer: `Les écrans de sol LED professionnels supportent 1 500–2 000 kg/m² en charge statique uniformément répartie ; le XR Floor est noté à 1 500 kg/m² avec un coefficient de sécurité de trois. Cela couvre une foule dense qui danse, qui culmine vers 1 000–1 200 kg/m². Véhicules, nacelles et pianos sont vérifiés séparément selon la charge ponctuelle et le plancher support.`,
      },
      {
        question: `Quel pas de pixel pour une piste de danse LED ?`,
        answer: `Le P3,9 est la référence pour une piste de danse LED. Les danseurs voient la surface de 3–4 m et les invités assis de 3–10 m sous un angle rasant, où un pas plus fin n'est pas visible. Un 6 × 6 m à P2,6 même convient quand des caméras diffusent depuis le sol.`,
      },
      {
        question: `Peut-on garer une voiture sur un sol LED ?`,
        answer: `Seulement après une vérification propre au projet. Une voiture de 2 200 kg pose environ 550 kg sur chaque pneu, plus que les 375 kg qu'un caisson de 500 × 500 mm supporte en charge répartie. La solution habituelle est un plateau tournant sur sa propre structure avec le sol LED autour ; sinon, des plaques de répartition et une capacité de charge ponctuelle vérifiée sont nécessaires.`,
      },
      {
        question: `Comment fonctionne un sol LED interactif ?`,
        answer: `Des capteurs de pression ou infrarouges dans les modules signalent où sont les pieds ; un moteur de contenu en temps réel sur un serveur média rend la réaction et le processeur LED l'affiche. La chaîne doit répondre en moins de 100 ms pour paraître immédiate. Un point de détection par module de 250 mm suffit pour les pas, les jeux et les activations de marque.`,
      },
      {
        question: `Un sol LED est-il glissant ou fragile sous les talons ?`,
        answer: `Non, s'il s'agit d'un vrai produit de sol. Le masque possède une classe antidérapante documentée et une texture mate, et il répartit la pression d'un talon aiguille de sorte que les LED dessous ne sont jamais touchées. Essuyez immédiatement les boissons renversées et choisissez une surface supérieure IP65 partout où l'on sert des liquides.`,
      },
      {
        question: `Combien de temps prend l'installation d'un sol LED ?`,
        answer: `Une équipe de quatre personnes pose et met à niveau un sol de 6 × 6 m de 144 caissons en trois à quatre heures sur un plancher plat et dur, plus le temps des rampes, du câblage et d'un test de contenu. La moquette et les sols inégaux ajoutent du temps. Le sol se pose avant les tables et se retire en dernier.`,
      },
    ],
  },
  'led-in-outdoor-advertising': {
    contentFr: `Un écran LED publicitaire extérieur fait ce qu'un panneau imprimé n'a jamais pu faire : il change de message en quelques minutes, partage sa face entre huit ou dix annonceurs et reste lisible à midi. C'est pourquoi le digital out-of-home, ou DOOH, est passé des marges des plans média au centre de ceux-ci dans la plupart des grandes villes, Istanbul comprise. Ce guide s'adresse aux annonceurs, aux agences et aux propriétaires d'Immeubles et de centres commerciaux qui envisagent un panneau numérique : ce qui sépare le LED du statique, ce qu'un site rapporte, ce qu'une campagne rend et ce que la municipalité demandera.

## Des panneaux imprimés au DOOH : comment la publicité extérieure a changé

Pendant la majeure partie du vingtième siècle, la publicité extérieure signifiait papier. Une affiche était imprimée, collée sur un panneau par une équipe et laissée deux ou quatre semaines ; le vinyle rétroéclairé et les cadres défilants ont affiné le format au fil des décennies, mais l'économie sous-jacente n'a jamais bougé : un message, un annonceur, une longue réservation, et un camion à chaque changement.

Le LED a changé l'unité de vente. Une fois qu'une surface pouvait afficher n'importe quel contenu à n'importe quel moment, le panneau a cessé d'être une affiche pour devenir une programmation. Les tarifs sont passés d'une location mensuelle forfaitaire à une part de boucle, puis à une tarification selon l'heure, puis à l'achat à la diffusion via des plateformes programmatiques, et une luminosité qui bat enfin le soleil a fait du LED la norme pour les nouveaux sites sur les grands axes et les extérieurs de centres commerciaux.

### Qu'est-ce que le DOOH ?

Le digital out-of-home est toute publicité diffusée sur un écran dans un espace public : panneaux LED en bord de route, façades de centres commerciaux, écrans de transport, auvents de stations-service, routes d'accès des aéroports. Ce qui le distingue de la signalétique numérique en général, c'est que l'inventaire est vendu à des tiers comme média. Lorsqu'un propriétaire vend la boucle d'un écran LED à des annonceurs, le site devient un inventaire DOOH, et les métriques appliquées — impressions, portée, fréquence et CPM — sont les mêmes qu'en ligne.

## Sept différences entre un panneau statique et un écran publicitaire LED

### Le contenu change en minutes, pas en semaines

Une affiche statique est engagée chez l'imprimeur ; un changement de créa implique une réimpression, une équipe et une semaine de délai. Sur un écran LED, un nouveau fichier est téléchargé sur le lecteur et diffusé en minutes, généralement à distance. Un détaillant peut passer d'un message café du matin à une offre dîner le soir, et une banque peut réagir à une annonce de taux le jour même.

Un panneau imprimé a un seul client pour toute la réservation. Une boucle LED porte typiquement six à dix annonceurs, chacun avec un spot de dix secondes, répété en continu toute la journée. Pour le propriétaire, cela signifie plusieurs lignes de revenus sur une seule surface ; pour l'annonceur, un emplacement emblématique sans devoir tenir toute la surface, en échange du partage de l'audience avec d'autres marques.

### Visibilité en plein jour à 5 000–8 000 nits

Un panneau vinyle rétroéclairé est une source de lumière la nuit et une surface réfléchissante le jour. Un écran LED extérieur tourne à 5 000–8 000 nits sur un site type face à la rue et jusqu'à 10 000 nits sur une façade plein sud, donc il reste lisible à midi quand une affiche imprimée a viré au rectangle pâle. Le LED gagne la journée, quand l'essentiel du trafic passe ; notre guide de luminosité extérieure couvre les chiffres.

### Mesure et impressions

Un site statique se vend sur un comptage de trafic issu d'une étude qui peut avoir des années. Les sites numériques se vendent sur des impressions calculées à partir de données de trafic, de modèles d'angle de vue et de la part de boucle de l'annonceur, actualisées à mesure que les comptages changent. Cela ne rend pas le DOOH aussi mesurable qu'une page web, mais place le média sur la même feuille de reporting que les budgets numériques, avec un CPM qu'une agence peut comparer entre canaux.

### Achat programmatique

Parce que chaque diffusion sur un écran LED est un événement discret, elle peut s'acheter comme tel. Le DOOH programmatique permet à un annonceur d'acheter des diffusions sur de nombreux écrans via une plateforme, de définir des règles comme la météo, l'heure ou la densité d'audience, et de changer le mix quotidiennement. En Turquie, cela reste une petite part des dépenses DOOH, mais c'est là qu'arrive la demande des acheteurs axés sur la performance, et un site non connecté ne peut pas y vendre.

### Day-parting

L'audience devant un écran change au fil de la journée : navetteurs le matin, acheteurs à midi, familles le soir, vie nocturne après dix heures. Une affiche statique leur montre le même message. Un écran LED peut diffuser une marque de café jusqu'à onze heures, une offre déjeuner jusqu'à quinze heures et une séance de cinéma après la tombée du jour, et le propriétaire peut tarifer ces fenêtres différemment. Le day-parting est la raison la plus simple pour laquelle une boucle LED rapporte plus qu'une affiche dans le même cadre.

### Aucun coût d'impression ou de pose par campagne

Chaque campagne statique porte une chaîne de production : impression grand format, transport, une équipe avec nacelle et élimination du vieux vinyle. En LED, le coût de production est un fichier animé. Pour un annonceur qui change souvent ses créas, l'économie est importante ; pour le propriétaire, cela supprime les visites d'équipe, les retards météo et le panneau vide entre deux clients. Un panneau numérique n'est jamais vide, sauf si le propriétaire le veut.

## Le modèle de revenus pour un propriétaire de bâtiment ou de centre commercial

Pour un propriétaire, la question est simple : l'écran est-il rentable. La mécanique de revenus est une boucle de spots vendus au mois. Une configuration courante réunit huit annonceurs avec des spots de dix secondes dans une boucle de quatre-vingts secondes, de sorte que chaque annonceur apparaît quarante-cinq fois par heure. Le propriétaire vend les huit emplacements, en garde un ou deux pour sa propre promotion s'il s'agit d'un centre commercial, et suit le taux d'occupation, la part d'emplacements vendus, mois par mois.

### Comment construire le modèle annuel

Construisez l'année à partir de quatre termes et remplissez-les avec vos propres tarifs locaux plutôt que ceux d'un autre. Comptez les emplacements vendables, prenez le tarif mensuel que l'inventaire comparable du même quartier atteint réellement, multipliez par douze mois, puis décotez le résultat par l'occupation que vous pouvez tenir sur l'année plutôt que celle que vous espérez au premier mois. La saisonnalité vit dans cette décote : la plupart des inventaires d'Istanbul sont calmes en plein hiver et en fin d'été et tendus dans les semaines précédant un jour férié. Emplacements, tarif, mois, occupation. Chacun des quatre est une décision que le propriétaire contrôle.

Deux de ces termes dépendent de qui vend la boucle. Vendre en direct conserve le plein tarif mais exige quelqu'un qui appelle les agences chaque semaine. Confier l'inventaire à une régie média le remplit plus vite et coûte une commission, couramment 15 % à 30 % de ce que rapporte l'emplacement. Réglez les termes avant de construire l'écran : exclusivité ou non, occupation minimale que le vendeur doit atteindre, qui possède la relation client, et à quelle vitesse un emplacement invendu revient au propriétaire. Un contrat qui laisse un vendeur camper sur un inventaire vide est la clause la plus dommageable du modèle, et elle n'apparaît jamais comme une ligne dans le tableur.

Face au revenu se tiennent les coûts d'exploitation, et chacun doit être chiffré localement avant toute commande. L'électricité, que la gradation automatique maintient à quelques pour cent du revenu sur un écran bien configuré. Un service de contenu et de programmation, interne ou sous-traité. La taxe municipale sur la publicité, que chaque district fixe et publie annuellement. L'assurance d'une structure montée en façade. Un contrat de maintenance couvrant les modules de rechange, les alimentations et un délai d'intervention. Et le dossier de permis lui-même, incluant les rapports structurels et électriques exigés par la demande.

Le retour sur investissement devient alors une division plutôt qu'une affirmation. Mettez le coût installé de l'écran sur la marge annuelle que produisent vos quatre termes, et refaites la division à 50 %, 60 % et 70 % d'occupation pour voir combien dépend de vos hypothèses. Le seuil de rentabilité se calcule en divisant le coût installé par le revenu net annuel, et le test à faire est une occupation prudente. Les quatre termes sont des décisions ; le coût est une estimation. Un taux d'occupation prudent au départ et une montée progressive valent mieux qu'une projection agressive.

1.   0 1 5 à 15 m, rues piétonnes et entrées de centre commercial : pas de 3,9 à 6 mm, où le texte fin et les photos produit doivent tenir.
2.   0 2 15 à 30 m, rues urbaines et carrefours : pas de 6 à 8 mm, le choix le plus courant pour le DOOH au niveau de la rue.
3.   0 3 30 à 60 m, grands axes et périphériques : pas de 8 à 10 mm, où un pas plus grossier baisse le coût sans perte à cette distance.
4.   0 4 Au-delà de 60 m, autoroutes et grandes places : 10 mm et plus, la taille faisant le travail que la résolution ne peut pas faire.

## Portée et ROI pour l'annonceur : ce que livre un écran LED publicitaire extérieur

Pour l'annonceur, l'arithmétique va dans l'autre sens : la réservation est fixée dès l'emplacement pris, et la question est combien de personnes elle atteint et à quel coût pour mille impressions. Un modèle utile multiplie le trafic quotidien passant par la part de ce trafic ayant une ligne de vue claire sur l'écran et par la part de boucle de l'annonceur ; les agences affinent cela par des ajustements d'angle de vue et de vitesse, mais ces trois facteurs expliquent l'essentiel du résultat.

Prenez un grand axe ou une entrée de centre commercial à Istanbul où environ 120 000 personnes passent par jour en véhicule et à pied. Si la moitié peut voir l'écran et que l'annonceur détient un des huit emplacements, la campagne livre environ 225 000 impressions qualifiées par mois. Divisez la réservation par ces impressions en milliers et le résultat est le coût pour mille, le chiffre unique qui place un écran sur la même feuille que la télévision, la radio et l'affichage en ligne. Faites cette division vous-même plutôt que d'accepter la version du site.

Les données d'entrée sont ce qui diffère d'un site à l'autre, donc posez à chacun les trois mêmes questions : d'où vient le comptage de trafic et quelle est sa fraîcheur, quelle part a une ligne de vue claire, et quelle est la longueur de la boucle. Une fois ces trois données connues de la même manière, le coût pour mille est une base saine pour comparer les sites entre eux.

## Choix du site : trafic, angle de vue, distance et pas de pixel

La plupart des déceptions en DOOH viennent du site, pas de l'écran. Commencez par un vrai comptage de trafic sur plusieurs jours et créneaux, et séparez véhicules et piétons car ils voient l'écran différemment. Vérifiez ensuite l'angle de vue : un écran parallèle à la route est vu brièvement et de biais, tandis qu'un écran incliné de dix à vingt degrés vers le trafic entrant est vu de face sur toute l'approche. Arbres, signalétique, ponts et constructions futures peuvent tous retirer la ligne de vue.

Le temps d'arrêt est le multiplicateur. Un feu rouge, un arrêt de bus, un passage piéton ou une entrée de centre commercial retiennent l'audience assez longtemps pour voir toute la boucle, donc chaque annonceur y est vu, ce qui explique qu'un tel site porte un tarif d'emplacement plus élevé à trafic égal. Sur une route fluide, chaque passant voit une diffusion au hasard : bon pour la portée, faible pour la fréquence. La distance fixe le pas de pixel : plus le spectateur est proche, plus le pas est fin, et plus le pas est fin, plus le coût au mètre carré est élevé.

### Pas de pixel selon la distance de vision

1.   0 1 5 à 15 m, rues piétonnes et entrées de centre commercial : pas de 3,9 à 6 mm, où le texte fin et les photos produit doivent tenir.
2.   0 2 15 à 30 m, rues urbaines et carrefours : pas de 6 à 8 mm, le choix le plus courant pour le DOOH au niveau de la rue.
3.   0 3 30 à 60 m, grands axes et périphériques : pas de 8 à 10 mm, où un pas plus grossier baisse le coût sans perte à cette distance.
4.   0 4 Au-delà de 60 m, autoroutes et grandes places : 10 mm et plus, la taille faisant le travail que la résolution ne peut pas faire.

La série XR Vision couvre cette gamme pour l'installation extérieure fixe, avec la luminosité et l'étanchéité IP65 qu'exige un site permanent en bord de route. Là où la profondeur de montage est limitée, sur une façade fine ou un auvent, XR Edge fait le même travail dans un caisson plus mince. Les façades vitrées de centres commerciaux et de showrooms appellent XR Air, une résille transparente qui conserve la lumière du jour et la vue de l'intérieur tout en montrant le contenu à la rue, et les sites exposés aux chocs ou au climat côtier conviennent à XR Bastion. Notre guide du pas de pixel couvre le calcul de distance.

## Règles municipales et pollution lumineuse

La publicité extérieure en Turquie est réglementée au niveau municipal. Les municipalités métropolitaines et de district publient des règlements sur la publicité et la signalétique qui définissent où un écran peut être placé, sa taille relative à la façade, sa distance des carrefours et des feux, et les permis nécessaires. Un écran LED permanent exige généralement un permis publicitaire, un examen structurel et électrique du support, le consentement des propriétaires de l'immeuble et la taxe annuelle sur la publicité ; les sites en bord de route interurbaine relèvent aussi de l'autorité des autoroutes.

La lumière est le second dossier. Les règlements fixent des limites de luminance, interdisent le contenu clignotant près des carrefours et imposent une réduction de luminosité après la tombée du jour. En pratique, cela signifie un capteur de lumière ambiante sur le processeur, une programmation qui baisse la sortie à 30–40 % du niveau diurne la nuit, et des règles de contenu empêchant l'écran de distraire les conducteurs. Ce ne sont pas des contraintes à contourner : l'écran qui gradue correctement est aussi celui qui dure le plus longtemps et attire le moins de plaintes.

> Un panneau numérique n'est pas une affiche plus grande. C'est une programmation avec un emplacement, vendue, mesurée et réglementée comme telle.

## Où le DOOH fonctionne en Turquie

Les sites DOOH turcs les plus solides partagent deux choses : un trafic élevé et répétitif et un lieu que l'audience associe déjà à quelque chose. Les façades de centres commerciaux mènent : une grande surface LED à l'entrée ou sur l'élévation face à la route vend de la publicité à des marques nationales tout en promouvant les locataires et événements du centre, et le propriétaire contrôle à la fois le site et le permis. Les panneaux de rue sur les grands axes et aux carrefours fréquentés sont l'inventaire classique, surtout là où un feu rouge donne une audience à toute la boucle.

Les stations-service sont un cas sous-utilisé : un bandeau d'auvent ou un écran de cour atteint des conducteurs immobilisés plusieurs minutes, et la station utilise les emplacements pour les prix des carburants et les promotions de la boutique. Autour des stades, l'audience arrive en vagues denses les jours de match, ce qui convient à du contenu sponsor vendu à la rencontre plutôt qu'au mois. Les aéroports combinent un long temps d'arrêt avec une audience à forte valeur sur la route d'accès, les itinéraires de parking et le parvis du terminal. Dans tous les cas, l'écran rapporte le plus là où les gens s'arrêtent.

## Passer du statique au LED

Si vous possédez un site, commencez par le comptage de trafic, un photomontage et un modèle de revenus prudent à 60 % d'occupation, et vérifiez le parcours de permis avant de choisir le matériel ; une demande incluant déjà un rapport structurel, un projet électrique et un programme de luminosité avance des mois plus vite. Si vous annoncez, demandez à chaque site sa méthodologie d'impressions et la longueur de sa boucle, et achetez du temps d'arrêt plutôt que des mètres carrés.

PixiaTech conçoit, fournit et installe des écrans LED extérieurs pour le DOOH dans toute la Turquie, du panneau de rue unique à la façade complète de centre commercial, et accompagne la documentation de permis, le pipeline de contenu et le contrat de maintenance. Envoyez l'adresse et une photographie et nous renverrons une recommandation de pas, de taille et de luminosité ainsi que les documents nécessaires à la demande de permis.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Qu'est-ce que le DOOH, ou digital out-of-home ?`,
        answer: `Le DOOH est la publicité diffusée sur des écrans dans des espaces publics et vendue à des tiers comme média : panneaux LED en bord de route, façades de centres commerciaux, écrans de transport et d'aéroport, auvents de stations-service. Contrairement à une affiche imprimée, il diffuse une boucle de plusieurs annonceurs, change de contenu à distance et s'achète sur les impressions, la portée et le CPM, les mêmes métriques qu'en ligne.`,
      },
      {
        question: `Un écran publicitaire LED génère-t-il des revenus pour un propriétaire de bâtiment ?`,
        answer: `Oui, lorsque le site a du trafic. Le propriétaire vend une boucle de six à dix emplacements de dix secondes au mois, et le retour vient de l'occupation sur l'année plutôt que d'une seule réservation. Construisez le modèle avec des tarifs locaux : emplacements vendables, tarif mensuel, douze mois, occupation réaliste, moins électricité, contenu, taxe, assurance et maintenance. Modélisez-le prudemment avant de construire.`,
      },
      {
        question: `Ai-je besoin d'un permis pour un écran LED publicitaire extérieur en Turquie ?`,
        answer: `Oui. Les règlements municipaux sur la publicité exigent un permis pour un écran permanent, généralement avec un examen structurel et électrique, le consentement des propriétaires de l'immeuble et la taxe annuelle sur la publicité ; les sites en bord de route interurbaine impliquent aussi l'autorité des autoroutes. Les limites de luminosité et la gradation nocturne font partie des conditions, donc prévoyez le capteur de lumière et le programme dès le départ.`,
      },
      {
        question: `Combien d'annonceurs peuvent tourner sur un panneau LED ?`,
        answer: `La plupart des boucles comptent six à dix annonceurs avec des spots de dix secondes, soit une boucle de soixante à cent secondes. Moins d'emplacements signifient que chaque annonceur est vu plus souvent et une boucle plus facile à remplir ; plus d'emplacements augmentent le plafond mais diluent la fréquence. Là où le trafic est fluide, gardez une boucle courte pour que chaque passant voie un spot complet.`,
      },
      {
        question: `À quels moments de la journée un écran LED extérieur est-il le plus efficace ?`,
        answer: `Les trajets matin et soir apportent le plus de trafic véhicule, le midi et le week-end apportent des acheteurs, et le soir une audience de loisirs. Parce que le LED est assez lumineux pour le plein jour, il fonctionne sur toute la journée, et le day-parting permet à un annonceur de n'acheter que les fenêtres correspondant à son audience, comme les offres déjeuner avant midi ou les séances de cinéma après la tombée du jour.`,
      },
      {
        question: `Quel pas de pixel pour un écran LED publicitaire extérieur ?`,
        answer: `Il découle du spectateur type le plus proche : 3,9 à 6 mm pour des distances piétonnes de 5 à 15 m, 6 à 8 mm pour les rues urbaines à 15–30 m, 8 à 10 mm pour les grands axes à 30–60 m, et 10 mm ou plus grossier pour les autoroutes. Un pas plus fin que la distance ne l'exige ajoute du coût sans ajouter de lisibilité.`,
      },
    ],
  },
  'led-screen-lifespan-maintenance': {
    contentFr: `La durée de vie d'un écran LED a une réponse courte imprimée dans chaque fiche technique : 100 000 heures. La réponse longue dépend de l'endroit où l'écran est installé, de sa luminosité de fonctionnement, de son refroidissement et de qui s'en occupe. Deux murs construits à partir du même module peuvent accuser des années d'écart : l'un encore lisible après douze ans, l'autre à demi-luminosité dans sa cinquième année. Ce guide couvre ce que signifient réellement 100 000 heures, les durées de vie réalistes en intérieur et en extérieur, les habitudes qui les raccourcissent, un calendrier de maintenance, les pannes courantes d'un mur LED et leurs solutions, les pièces de rechange, la garantie et le moment de remplacer.

## Ce que signifient réellement 100 000 heures de durée de vie

Le chiffre de 100 000 heures n'est pas le temps avant que la LED s'éteigne. L'industrie mesure la durée de vie d'une LED comme le temps jusqu'à ce que la luminosité descende à une fraction définie de sa valeur initiale : L70 est le point où la sortie est tombée à 70 pour cent, L50 à 50 pour cent. Une LED notée à 100 000 heures s'éclairera presque certainement encore au terme de cette période, mais aura perdu un tiers à une moitié de sa luminosité du premier jour. Tout calcul qui l'ignore trompe, car les écrans LED ne tombent pas en panne soudainement ; ils s'estompent.

Convertir des heures en années est simple. Un écran fonctionnant 24 heures par jour accumule 8 760 heures par an, donc 100 000 heures font environ 11 ans. Un écran de détail allumé 12 heures par jour atteint le même point en un peu plus de 22 ans. Ces chiffres s'appliquent à la puce LED. Les alimentations, les cartes de réception et les connecteurs vivent moins longtemps, et en pratique c'est souvent l'un d'eux, et non les LED, qui amène un écran en service après-vente.

### Pourquoi la vie réelle est plus courte que la fiche technique

Les notations des fabricants sont mesurées en laboratoire à température fixe et courant nominal. Sur site, quatre facteurs tirent la courbe vers le bas. La chaleur : chaque hausse de 10 °C à la jonction LED accélère sensiblement le vieillissement, et l'intérieur d'un caisson peut être 15–20 °C au-dessus de l'ambiant. L'humidité : corrosion sur le PCB et fuites aux joints de soudure. La poussière : elle piège la chaleur, étouffe les ventilateurs et absorbe la lumière en surface. Une luminosité poussée à la limite et une tension instable poussent les LED et les alimentations au-delà de leur point nominal. Traitez 100 000 heures comme un plafond ; un objectif réaliste pour un écran bien entretenu est de 8–12 ans.

## Durée de vie d'un écran LED en intérieur et en extérieur

Les écrans intérieurs sont les plus proches de la théorie. Température maîtrisée, faible humidité et besoins de luminosité modestes font que les LED passent leur vie bien en dessous du courant nominal. Un mur fine pitch tel que XR Fine ou XR Ultra dans une salle de conseil, un hall ou un magasin peut être noté à 600–1 000 nits mais est typiquement piloté à 200–400, et le vieillissement ralentit d'autant. Plus de dix ans de service est une attente raisonnable ; ce qui retire un mur intérieur, c'est généralement la technologie qui avance, pas les LED qui s'usent.

En extérieur, le tableau change. Sous le soleil d'été, une face de caisson peut dépasser 60 °C, les matins d'hiver déposent de la condensation sur les cartes, et le vent porte poussière et sel. L'écran tourne à 5 000–8 000 nits pour la visibilité de jour et ses alimentations sont sous charge continue. Un affichage extérieur bien conçu, XR Vision pour les installations fixes ou XR Rugged là où le climat est rude et la poussière constante, avec étanchéité IP65, connecteurs scellés et refroidissement adéquat, servira 7–10 ans. Sans maintenance, le même écran s'estompe visiblement dès la cinquième année et commence à tomber module par module.

## Cinq choses qui raccourcissent la durée de vie d'un écran LED

Dans les dossiers de service, la plupart des défaillances précoces remontent à l'usage et au logement de l'écran plutôt qu'au produit. Ces cinq habitudes expliquent pourquoi deux sites avec le même matériel peuvent différer de plusieurs années.

1.   0 1 Fonctionner à pleine luminosité en intérieur : la lumière d'un bureau demande environ 300 nits, et pousser un écran à 800 augmente le courant des LED et la température du caisson sans gain visible. Programmer la luminosité selon la lumière ambiante est le réglage qui prolonge le plus la vie.
2.   0 2 Mauvaise ventilation : un caisson encastré dans un renfoncement en placoplâtre sans lame d'air derrière, ou une pièce sans refroidissement, cuit dans sa propre chaleur. Les condensateurs d'alimentation se dégradent en premier.
3.   0 3 Humidité, condensation et démarrages à froid : l'humidité qui s'accumule dans un écran éteint toute la nuit risque un court-circuit sur les cartes au retour du courant. En extérieur, maintenir l'écran allumé à faible luminosité la nuit ou installer des résistances chauffantes l'évite.
4.   0 4 Alimentation sale et absence de protection contre les surtensions : variations de tension, basculements de groupe électrogène et surtensions d'origine foudre tuent purement et simplement alimentations et cartes de réception. Une protection contre les surtensions et un test de mise à la terre périodique sont une assurance bon marché.
5.   0 5 Impact physique : les packages LED SMD sont des points en relief, et un choc accidentel retire une LED et laisse un pixel mort. Sur les murs à portée du public, des modules COB scellés à la résine ou un masque de protection écartent la plupart de ce risque.

> Un écran LED ne meurt pas ; il s'estompe. La maintenance est la routine qui mesure l'estompage et le ralentit.

## Calendrier de maintenance d'un écran LED : quotidien, mensuel, semestriel, annuel

Un bon programme de maintenance ne signifie pas poster quelqu'un devant l'écran. La plupart des étapes prennent quelques minutes et peuvent se faire à distance depuis le logiciel de contrôle. Le but est d'attraper les petits signaux avant qu'ils ne deviennent des pannes : un module tournant un degré plus chaud que ses voisins, une courbe de luminosité qui ne baisse pas comme prévu, une seule LED qui s'éteint. Le calendrier ci-dessous convient aux écrans intérieurs comme extérieurs ; en extérieur, raccourcissez les intervalles.

### Quotidien

1.   0 1 Contrôle visuel : tout l'écran est-il allumé, y a-t-il un module sombre, une dominante de couleur ou un contenu figé ? Sur les sites distants, une vue caméra suffit.
2.   0 2 Santé du contenu et du contrôleur : le lecteur a-t-il démarré à l'heure, la playlist programmée tourne-t-elle, la carte d'envoi ou de réception signale-t-elle un avertissement de liaison ?
3.   0 3 Programme de luminosité : la gradation par capteur ou par horaire est-elle active ? Un écran extérieur laissé à pleine luminosité toute la nuit dérange les voisins et vieillit pour rien.

### Mensuel

1.   0 1 Filtres à poussière et ventilateurs : nettoyez ou remplacez les filtres aux entrées d'air, confirmez que les ventilateurs tournent et ne cliquettent pas.
2.   0 2 Températures des modules : tirez le rapport par caisson depuis le logiciel de contrôle ; un caisson à 5 °C ou plus au-dessus de la moyenne est le premier signe d'un problème de refroidissement ou d'alimentation.
3.   0 3 Luminosité et plan de contenu : la lumière du jour change avec la saison, donc mettez à jour la courbe de gradation et révisez les éléments statiques comme les logos ou les horloges.
4.   0 4 Derrière les caissons : traces de chaleur ou desserrage aux connexions de câbles, dégâts de rongeurs, et joints de portes bien en place.

### Tous les six mois

Tous les six mois, la surface de l'écran et l'intérieur des caissons sont nettoyés. En intérieur, une brosse douce antistatique et de l'air à basse pression suffisent ; un chiffon humide ne convient qu'aux surfaces scellées comme le COB. Sur les modules SMD, gardez la brosse parallèle à la surface pour que les fibres n'accrochent pas les packages LED. En extérieur, le nettoyage à haute pression n'est jamais acceptable ; l'eau peut être forcée dans des caissons qui paraissent scellés. Balayez avec une brosse douce, rincez au besoin avec un jet basse pression et non gouttant d'eau propre, puis inspectez les joints silicone, les loquets de porte et les presse-étoupes. Le silicone fissuré est remplacé sur place ; une infiltration d'eau coûte un module.

### Annuel : le service professionnel

Une fois par an, l'écran doit être vu par une équipe spécialisée. Une visite de service couvre typiquement un étalonnage caméra de la luminosité et de la couleur sur tout le mur, afin d'égaliser en logiciel les écarts de vieillissement entre modules ; la mesure de la sortie d'alimentation sous charge et de la santé des condensateurs ; le nettoyage et le réenclenchement des connecteurs de données et d'alimentation ; l'inspection de la structure support, des soudures, des ancrages et des couples de boulons ; et une mise à jour du firmware des cartes de réception et du contrôleur, suivie d'une sauvegarde de configuration. En extérieur, un test de résistance de terre et une vérification du parasurtenseur s'ajoutent. PixiaTech planifie et rapporte cette visite dans le cadre de son contrat de maintenance.

## Pannes courantes d'un mur LED et comment les réparer

### Pixel mort ou LED unique

Un point unique qui reste sombre, reste allumé ou affiche la mauvaise couleur est presque toujours le package LED lui-même : impact, joint de soudure fissuré ou défaillance de puce. Sur les modules SMD, la LED peut être ressoudée, mais cela exige une station à air chaud et de l'expérience ; la réparation pratique sur site est de remplacer le module. Sur COB, une LED unique ne peut pas être remplacée et le module est renouvelé. Des pixels morts dispersés sur un module signifient généralement humidité ou chaleur.

### Module sombre

Un module devenant complètement sombre indique un fil d'alimentation desserré, un circuit de driver défaillant sur le module lui-même, ou une nappe de données rompue depuis la carte hub. Réenclenchez d'abord les câbles ; si le défaut persiste, échangez le module avec son voisin. Si la zone sombre se déplace, le module est défectueux ; si elle reste, le problème est le port de la carte hub ou le câble.

### Dominante de couleur ou bandes de luminosité entre modules

Un module paraissant légèrement rose, vert ou terne par rapport au reste relève généralement du vieillissement plutôt que d'une panne : un rechange d'un lot de production différent, ou une zone ayant tourné plus chaud. La solution est l'étalonnage par caméra, qui ajuste chaque module pour correspondre à son voisin le plus faible. Un banding suivant les limites des caissons suggère une différence de tension d'alimentation ; un décalage confiné à un seul module suggère ses puces de driver.

### Scintillement et faible fréquence de rafraîchissement

Un scintillement visible à l'œil est le plus souvent un problème de données : câble endommagé, connecteur desserré ou mauvaise configuration de carte de réception. Les bandes et scintillements vus uniquement à la caméra relèvent de la fréquence de rafraîchissement ; un écran sous 1 920 Hz paraît instable à l'objectif, et c'est une limite de spécification plutôt qu'une panne. Si le scintillement persiste après remplacement du câble et de la carte, rechargez les réglages de balayage sur le contrôleur depuis le fichier du fabricant.

### Un demi-caisson sombre

Quand exactement la moitié d'un caisson, ou un groupe défini de modules, s'éteint d'un coup, la cause est un composant partagé. La plupart des caissons portent deux alimentations et une carte hub ; quand une alimentation cesse de débiter, les modules qu'elle alimente s'éteignent ensemble. Mesurez la sortie de l'alimentation ; hors de la bande 4,2–5 V, remplacez-la. Si l'alimentation paraît normale, le port correspondant de la carte hub a échoué.

### Ligne de données et carte de réception

Tout ce qui suit un caisson devenant noir ou affichant du bruit signifie une rupture dans la chaîne de données. Parce que les caissons sont chaînés en câble réseau, un câble ou une carte de réception défectueux affecte chaque caisson en aval. Procédez caisson par caisson en échangeant le câble ; après remplacement d'une carte de réception, rechargez la configuration. Une carte de réception de rechange et quelques mètres de câble devraient vivre à côté de chaque écran.

### Infiltration d'humidité et contrôleur

Des marques blanches aux bords des modules, des pixels morts apparaissant sur plusieurs modules à la fois, ou des défauts qui se montrent le matin et disparaissent l'après-midi sont la signature d'une infiltration d'eau. Réchauffer l'écran masque le symptôme mais n'arrête pas la corrosion ; le joint ou le presse-étoupe doit être trouvé et refermé. Côté contrôleur, un mur qui devient noir, se fige ou affiche la mauvaise résolution remonte généralement à la source, à la carte d'envoi ou à son logiciel ; un redémarrage et une sauvegarde de configuration à jour le résolvent normalement.

## Modules de rechange et garantie

Chaque projet devrait inclure des modules de rechange représentant 2–3 % du total, quelques alimentations, une carte de réception et une carte hub, tous du même lot de production. Le même lot compte : les puces LED varient de façon mesurable en température de couleur entre lots, et un rechange acheté deux ans plus tard ressort comme un carré différent jusqu'à ce que l'étalonnage le corrige. Stockez les rechanges au sec et à température ambiante, et allumez-les brièvement tous les six mois pour que les condensateurs ne sèchent pas.

La garantie d'un écran LED professionnel va typiquement de 2 à 5 ans, 3 ans étant une référence courante en extérieur. La couverture s'étend généralement aux défauts de fabrication de l'électronique : LED, modules, alimentations, cartes de réception et hub. Sont exclus l'impact physique et le vandalisme, la foudre et les surtensions du réseau, les inondations, la réparation ou modification non autorisée, et l'usage hors spécification. La protection contre les surtensions, un rapport de mise à la terre et les dossiers de maintenance protègent donc non seulement la vie de l'écran mais l'acceptation d'une réclamation. Faites inscrire le délai d'intervention et le délai de pièces dans l'accord.

## Quand remplacer un vieil écran LED

Trois signes disent qu'un écran doit être remplacé. La luminosité : si la sortie maximale est tombée sous 50 % de la valeur de mise en service malgré l'étalonnage, la lisibilité de jour et la fidélité des couleurs sont perdues ensemble ; en extérieur, cela arrive généralement entre la septième et la neuvième année. Les pièces : lorsque le module ou la carte de réception n'est plus fabriqué, chaque panne devient un trou permanent dans le mur. L'usage : un écran installé à 10 mm de pas qui fait désormais face à un chemin piéton et à des spectateurs plus proches ne peut pas porter le contenu d'aujourd'hui. À ce stade, le budget de réparation approche le coût annuel d'un écran neuf ; les fourchettes au m² de notre article sur les prix des écrans LED sont un bon point de départ.

Le remplacement coûte souvent moins cher qu'une démolition complète : la charpente métallique existante, l'alimentation et l'infrastructure de données sont généralement conservées et seuls les caissons changent. Un écran au pas plus fin, plus efficace et plus frais sur la même structure réduit le coût d'exploitation tout en donnant plus de place au contenu. Notre liste de contrôle d'achat d'écran LED extérieur rassemble en une page ce qu'il faut regarder à cette étape.

## Planifier la maintenance dès le premier jour

L'essentiel de la durée de vie d'un écran se décide le jour de l'installation : la bonne classe de luminosité, une ventilation adéquate, une protection contre les surtensions, des connecteurs scellés et des rechanges du même lot. PixiaTech livre le calendrier de maintenance, la liste des pièces de rechange et les conditions de garantie dans un seul document à chaque installation. Si vous préparez un nouvel écran ou souhaitez prolonger la vie d'un écran existant, laissez un court brief sur la page Démarrer un projet et notre équipe reviendra avec un plan de maintenance et de renouvellement pour votre site.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Combien d'années dure un écran LED ?`,
        answer: `Les fiches techniques notent la durée de vie d'un écran LED à 100 000 heures, le temps jusqu'à ce que la luminosité tombe à la moitié de sa valeur initiale : environ 11 ans à 24 heures par jour ou 22 ans à 12 heures par jour. Sur site, comptez plus de 10 ans pour un écran intérieur bien entretenu et 7–10 ans en extérieur ; chaleur, humidité et forte luminosité la raccourcissent.`,
      },
      {
        question: `Comment réparer un pixel mort sur un écran LED ?`,
        answer: `Un pixel mort unique est généralement un package LED défaillant par impact ou joint de soudure fissuré. Sur les modules SMD, la LED peut être ressoudée à la station à air chaud ; la réparation pratique sur site est de remplacer le module par un rechange du même lot. Sur COB, tout le module est remplacé.`,
      },
      {
        question: `Comment nettoyer un écran LED extérieur ?`,
        answer: `Écran éteint et froid, et jamais au nettoyeur haute pression. Retirez la poussière avec une brosse douce antistatique ou de l'air basse pression ; au besoin, essuyez avec un jet non gouttant d'eau propre. Évitez solvants, produits chimiques agressifs et chiffons abrasifs, et inspectez joints silicone, loquets de porte et presse-étoupes pendant le nettoyage. Tous les six mois suffisent, plus souvent en milieu poussiéreux ou côtier.`,
      },
      {
        question: `Laisser un écran LED allumé en permanence l'abîme-t-il ?`,
        answer: `Non. Les écrans LED sont conçus pour un fonctionnement continu, et à la bonne luminosité avec un refroidissement adéquat ils ne sont pas abîmés par un usage 24 h/24. Ce qui les abîme, c'est la pleine luminosité nocturne et une mauvaise ventilation. En extérieur, garder l'écran allumé à faible luminosité la nuit maintient les caissons au chaud, évite la condensation et les démarrages à froid.`,
      },
      {
        question: `Que couvre la garantie d'un écran LED ?`,
        answer: `La garantie d'un écran LED professionnel va typiquement de 2 à 5 ans et couvre les défauts de fabrication de l'électronique : LED, modules, alimentations, cartes de réception et hub. Sont exclus l'impact physique et le vandalisme, la foudre et les surtensions du réseau, les inondations, la réparation non autorisée et l'usage hors spécification. Protection contre les surtensions, rapport de mise à la terre et dossiers de maintenance protègent à la fois l'écran et l'acceptation d'une réclamation.`,
      },
      {
        question: `Combien de modules de rechange dois-je garder ?`,
        answer: `Gardez des modules de rechange égaux à 2–3 % du total, plus quelques alimentations, une carte de réception et une carte hub, tous du même lot de production. Le même lot compte pour la correspondance des couleurs ; un module acheté plus tard paraît différent sur le mur jusqu'à son étalonnage. Stockez les rechanges au sec à température ambiante et allumez-les brièvement tous les six mois.`,
      },
    ],
  },
  'led-screen-prices': {
    contentFr: `Deux murs de même surface peuvent coûter des montants très différents, et presque rien de cet écart ne tient à la surface. Le coût d'un écran LED est décidé par huit choix faits au stade de la spécification : le pas de pixel, l'intérieur ou l'extérieur, la luminosité, le package LED, le caisson, le système de contrôle, la structure acier et l'installation, et la garantie. Parmi eux, le pas de pixel domine tout le reste. Ce guide explique ce que chacun fait au coût au mètre carré, ce que l'écran coûte après son installation, et comment lire deux devis pour le même mur afin qu'ils puissent réellement être comparés.

## Pourquoi un écran LED n'a pas de prix catalogue

Un écran LED est un assemblage, pas une référence. Deux murs de même surface peuvent coûter du simple au double parce que leurs spécifications diffèrent, pas seulement leur pas. C'est pourquoi une grille de prix type « au mètre carré » n'existe pas ; le prix dépend entièrement de ce que vous demandez, et deux écrans de mêmes dimensions peuvent différer de plusieurs fois selon leur contenu technique.

## Les 8 facteurs derrière le coût au mètre carré

### 1. Le pas de pixel et la règle du carré

Le pas de pixel est la distance en millimètres entre les centres de deux pixels voisins, et c'est la plus grande influence sur le coût. Parce que le pas s'applique dans les deux directions, le nombre de LED varie avec le carré du pas : diviser le pas par deux quadruple à peu près le nombre de LED au mètre carré. Un écran P3,9 compte environ 65 700 pixels par m², un P1,9 environ 277 000 et un P1,2 environ 694 000. Chaque pixel, c'est trois LED, une part de driver IC, de la puissance et de la chaleur, et tout ce qui suit se cale sur ce nombre.

Cette relation au carré explique pourquoi un cran de pas n'est jamais un petit changement. Un pas plus fin signifie plus de drivers, des cartes plus denses, des tolérances de placement plus serrées, plus de capacité de carte de réception pour la même surface, des fréquences de rafraîchissement plus élevées pour garder l'image propre à la caméra, et plus de chaleur à évacuer d'un caisson plus mince. Cela pèse aussi sur chaque réparation ultérieure, car un module de remplacement porte la même densité. Choisir un pas un cran plus fin que l'exige la distance de vision est la décision la plus lourde que la plupart des acheteurs prennent sans s'en rendre compte.

### 2. Intérieur ou extérieur

Les écrans extérieurs utilisent des pas plus grossiers, donc ils portent bien moins de LED au mètre carré, et pourtant leurs caissons sont la moitié la plus exigeante de la fabrication. Ils ont besoin d'une étanchéité IP65 avant et arrière, de masques résistants aux UV, de cartes enrobées, d'une gestion thermique contre la chaleur d'été comme le gel d'hiver, et d'alimentations plus grosses pour soutenir une luminosité au-delà de 5 000 nits. Un caisson extérieur pèse typiquement 30 à 60 % de plus qu'un caisson intérieur de même pas, et ce poids se retrouve directement dans l'acier et le plan de levage. Les écrans intérieurs consacrent leur ingénierie aux qualités opposées : finesse, légèreté, fonctionnement silencieux et surface sans bord.

### 3. La luminosité

La luminosité se mesure en nits et dicte à la fois la gamme de LED et la capacité d'alimentation. Les murs intérieurs ont besoin de 600 à 1 500 nits ; les façades exposées au soleil de 5 000 à 10 000. À pas égal, un module de 8 000 nits utilise des packages LED à courant plus élevé, des alimentations plus lourdes et une gestion de la chaleur plus agressive qu'un module de 5 000 nits. Spécifier plus de luminosité que le site n'en utilisera jamais alourdit la spécification et la consommation annuelle sans améliorer l'image ; en spécifier trop peu rend l'écran illisible à midi. Notre guide de luminosité extérieure couvre la correspondance entre nits et lumière ambiante.

### 4. Le package LED : SMD ou COB

Les packages surface-mount (SMD) sont le choix standard à partir de 1,2 mm de pas. En dessous de 1 mm, le chip-on-board (COB) et le flip-chip prennent le relais : les puces LED sont collées directement sur la carte et scellées sous résine. Le résultat offre plus de contraste, une surface scellée résistante aux chocs et une consommation plus basse par mètre carré, mais les rendements de production sont plus faibles et le procédé bien moins tolérant à l'erreur. C'est le package, et pas le seul nombre de pixels, qui distingue une série ultra-fine comme XR Ultra d'un mur fine pitch conventionnel.

### 5. Le matériau du caisson et l'accès de maintenance

Le caisson est le cadre qui porte les modules, et son matériau fixe à la fois le coût et la qualité de l'installation. Les caissons en aluminium moulé sont légers, plans et usinés à des tolérances serrées, raison pour laquelle les murs intérieurs fine pitch les utilisent pour tenir une image sans bord sur toute une surface. Les caissons en tôle d'acier sont plus lourds et moins précis. Les caissons à service frontal n'ont besoin d'aucun couloir d'accès arrière, donc le mur peut être plaqué contre la structure, et la fixation magnétique transforme un échange de module en une opération de deux minutes pour toute la vie de l'écran.

### 6. Le système de contrôle et le processeur vidéo

Chaque écran LED est piloté par une carte d'envoi et des cartes de réception, et la plupart des projets ont aussi besoin d'un processeur vidéo pour la mise à l'échelle, les entrées multiples et la gestion des couleurs. Un mur de salle de réunion à source unique a besoin de très peu de cela. Une scène multi-entrées, ou une façade avec traitement redondant, liaisons fibre et supervision à distance, a besoin de bien plus, et l'écart entre ces deux spécifications de contrôle est large. La qualité des cartes de réception fixe la profondeur de niveaux de gris et la fréquence de rafraîchissement, donc sur tout écran destiné à la caméra, ce n'est pas la ligne à tirer vers le bas.

### 7. La structure acier, l'installation et l'électricité

Par-dessus les modules et les caissons viennent la structure acier, les engins de levage, la main-d'œuvre d'installation, le câblage et l'alimentation électrique. En intérieur, ces postes sont généralement mesurés. En extérieur, où une connexion de façade, un rapport d'ingénierie structurelle et une grue entrent en jeu, ils peuvent rivaliser avec l'écran lui-même et varient énormément d'un site à l'autre. Un mur suspendu sur une charpente existante et le même mur sur un nouveau pylône avec fondations et poteaux sont deux projets différents pour les mêmes mètres carrés. Un chiffre donné avant un relevé de site est le chiffre qui change ensuite.

### 8. Garantie et service

La garantie standard du marché est de deux ans, et des formules de trois et cinq ans sont disponibles sur la plupart des séries. Ce que la garantie couvre compte plus que sa durée : le délai d'intervention sur site, le stock de modules de rechange et un engagement écrit sur la décroissance de luminosité doivent figurer au contrat. Sur les projets PixiaTech, les modules de rechange sont livrés avec l'installation et mis de côté du même lot de production, afin qu'un module remplacé des années plus tard n'affiche aucun décalage de couleur face à ses voisins. Une garantie sans délai d'intervention est un document, pas un service.

## Écrans intérieurs : ce qu'implique la spécification

Les projets intérieurs se divisent en trois groupes pratiques, et chaque groupe est défini par la distance de vision plutôt que par le budget. Les scènes, auditoriums, showrooms et grands atriums se regardent depuis quatre mètres et plus, où le P2,5 à P3,9 rend proprement. Les halls, salles de briefing et flagships de vente placent les spectateurs à moins de deux mètres, territoire du fine pitch : la gamme XR Fine couvre cette bande. Les salles de conseil, salles de contrôle et studios de diffusion, où la surface se lit à bout de bras ou est filmée par une caméra, sont là où le COB sous 1 mm gagne sa place.

### Exemple chiffré : un mur de hall 4 × 2,25 m à P1,9

Un mur de hall d'entreprise de 4 m de large et 2,25 m de haut couvre 9 m² et tombe exactement sur du 16:9. À P1,9, cela fait environ 2 105 × 1 184 pixels, juste au-dessus du Full HD, et se lit proprement depuis les deux mètres qu'autorise un comptoir d'accueil. La spécification qui suit est concrète : environ 2,5 millions de pixels et quelques 7,5 millions de LED, une consommation moyenne proche de 1,35 kW à la luminosité de bureau, un cadre support en aluminium, une installation affleurante, une chaîne de contrôle à source unique et un jeu de modules de rechange du même lot. Ces quantités sont la base sur laquelle un devis se construit, et PixiaTech calcule le chiffre une fois le site relevé.

## Écrans extérieurs : le coût passe des modules à la structure

Les écrans extérieurs portent moins de LED par mètre carré, mais la part du travail prise par les caissons, l'acier, l'alimentation électrique et les engins d'accès est bien plus large qu'en intérieur. Les produits extérieurs fixes entre P5 et P10 servent les distances de trafic et de rue ; les pas extérieurs de champ proche tels que P4 et P3,9 sont pour les devantures piétonnes où les spectateurs se tiennent à quelques mètres. Le passage de 5 000 à 8 000 nits change le module, l'alimentation et la conception thermique à pas donné, donc la luminosité se spécifie depuis l'orientation du site, pas depuis une préférence.

La résille transparente est une classe à part. À P16 et plus, des produits comme XR Air se montent devant ou derrière une façade vitrée, laissent passer la charge du vent et couvrent de très grandes surfaces avec très peu de structure. Pour un projet qui veut transformer toute une face de bâtiment en surface média, les variables décisives sont la surface totale, le taux de transparence et la charge structurelle plutôt que le seul pas.

### Exemple chiffré : un écran de façade 8 × 4 m à P6,9

Un écran de façade face à la rue, 8 m de large et 4 m de haut, couvre 32 m². À P6,9, la résolution est d'environ 1 160 × 580 pixels, largement suffisante pour des distances de vision qui commencent à dix mètres. La spécification derrière se lit ainsi : environ 21 000 pixels par m², une consommation moyenne d'environ 250 W/m² avec gradation automatique, quelques 8 kW sur tout le mur, un rapport structurel, de l'acier de connexion de façade, une installation par grue, une armoire de contrôle externe, une liaison fibre et un circuit électrique dédié. Posez l'écran sur un pylône et les fondations et poteaux s'ajoutent à la liste. Chaque poste est devisé par projet après le relevé.

> Le chiffre au bas d'un devis est la conséquence de la spécification au-dessus de lui.

## Ce que l'écran coûte après l'installation

Une vue à dix ans d'un écran LED inclut l'électricité, les modules de rechange, le service, le ré-étalonnage et la production de contenu, et ces postes courent aussi longtemps que le mur. L'électricité est le plus important et découle directement du pas et de la luminosité. Lorsque vous comparez des fournisseurs, demandez la consommation moyenne plutôt que la pointe : le compteur répond à ce que le mur tire avec du contenu réel à une luminosité réelle, pas à la valeur de la fiche technique, et les deux chiffres peuvent différer d'un facteur trois.

### Électricité : watts par mètre carré

Un mur intérieur fine pitch peut tirer 500 à 650 W par m² en pointe mais consomme en moyenne environ 120 à 180 W/m² à la luminosité de bureau avec du contenu typique. Pour le mur de hall P1,9 de 9 m² ci-dessus, une moyenne de 1,35 kW sur 12 heures par jour, 365 jours par an, représente environ 5 900 kWh par an. C'est une charge mesurée et prévisible pour un bâtiment commercial, et le fait qu'elle soit prévisible au stade de la spécification compte plus que le chiffre lui-même.

En extérieur, le tableau change. Un caisson de façade P6,9 tire 700 à 800 W par m² en pointe et, fonctionnant à pleine luminosité le jour avec gradation automatique la nuit, consomme en moyenne environ 250 W/m². Sur 32 m², cela fait environ 8 kW ; à 16 heures par jour, la consommation annuelle est d'environ 47 000 kWh. Sur une vie de dix ans, c'est une charge d'exploitation substantielle, raison pour laquelle un capteur de lumière ambiante avec gradation automatique n'est pas une option sur un écran extérieur mais une exigence.

### Modules de rechange, service et étalonnage

Stockez des modules de rechange égaux à 2 à 5 % du nombre total de modules à l'installation, pris du même lot de production. C'est un petit ajout sur le moment qui supprime le problème d'appariement d'un lot des années plus tard, quand la production d'origine n'existe plus. Une visite de maintenance annuelle couvre le nettoyage, les contrôles de connecteurs, les mesures d'alimentation et le ré-étalonnage là où le mur a dérivé. En extérieur, une inspection des joints et des ventilateurs au moins deux fois par an est le poste le plus utile du calendrier.

## Où l'argent se gâche vraiment

Un devis nettement en dessous de tous les autres n'est généralement pas une version moins chère du même produit mais un produit différent. La différence se cache là où le devis reste muet : gamme de puce LED, qualité des drivers, redondance d'alimentation, planéité des caissons et étendue de la garantie. Rien de tout cela n'est visible la première année. À partir de la troisième, cela revient sous forme de dérive de couleur entre caissons, de pixels morts et d'arrêts précisément les jours pour lesquels le mur a été acheté. Notre article sur les packages COB et SMD explique pourquoi le seul package décide comment un mur vieillit.

1.   0 1 Puces LED bas de gamme : différences visibles de couleur et de luminosité entre caissons en un an ou deux, et un mur qui ne se lit plus comme une seule surface.
2.   0 2 Faible fréquence de rafraîchissement et niveaux de gris limités : scintillement à la caméra lors d'événements et dégradés en bandes dans les scènes sombres.
3.   0 3 Aucune redondance en alimentation ou en données : une seule panne noircit toute une section de l'écran.
4.   0 4 Une garantie vague : une couverture sans délai d'intervention sur site et sans engagement de stock de rechange n'existe que sur le papier.
5.   0 5 Mauvaise efficacité énergétique : un écran tirant 20 % de plus à luminosité égale porte cette pénalité chaque heure de fonctionnement, pendant dix ans.
6.   0 6 Un pas choisi en salle d'exposition : une spécification fixée à un mètre alors que la vraie distance de vision est de six gaspille des LED que personne ne résoudra jamais.

## Comment lire et comparer deux devis

La comparaison ne fonctionne que si les deux documents décrivent le même produit. Demandez que le devis soit détaillé, avec le module et le caisson, le système de contrôle et le processeur, la structure acier, la main-d'œuvre d'installation, l'électricité et le câblage, le stock de rechange et l'étendue de garantie sur des lignes séparées, la spécification étant indiquée en regard. Un chiffre clé en main en une seule ligne rend les fournisseurs impossibles à départager, car il masque exactement les décisions qui créent la différence entre eux.

1.   0 1 Pas de pixel, résolution et distance de vision pour laquelle le pas a été choisi.
2.   0 2 Luminosité en nits, fréquence de rafraîchissement en Hz et profondeur de gris, donnés comme valeurs mesurées plutôt que nominales.
3.   0 3 Consommation moyenne et de pointe en W par m², et le circuit électrique qui en découle.
4.   0 4 Matériau du caisson, poids au m², accès de maintenance par l'avant ou l'arrière, et tolérance de planéité.
5.   0 5 Ce qui est inclus au-delà des panneaux : acier, installation, câblage, électricité, mise en service et étalonnage.
6.   0 6 Durée de garantie, délai d'intervention sur site, stock de modules de rechange et engagement de décroissance de luminosité.
7.   0 7 Si un relevé de site a été réalisé, et ce que le devis suppose sur la structure s'il ne l'a pas été.

## Spécifier d'abord, deviser ensuite

La façon la plus efficace de maîtriser un budget n'est pas d'acheter un écran moins cher mais le bon. Parce que le nombre de LED croît avec le carré du pas, un cran plus fin que l'exige la distance de vision peut doubler le matériel d'un mur pour une différence qu'aucun spectateur ne verra jamais. Pour le même investissement, un mur plus grand à un pas plus grossier délivre plus de présence dans la plupart des halls et sur la plupart des façades. La règle des dix de notre guide du pas de pixel est le point de départ de cette décision.

1.   0 1 Mesurez la distance de vision réaliste la plus proche et choisissez le pas à partir d'elle, pas depuis un mètre en salle d'exposition.
2.   0 2 Réglez la luminosité sur la lumière ambiante : au-delà de 1 000 nits en intérieur, c'est généralement une capacité installée et jamais utilisée.
3.   0 3 Concevez le format autour du contenu et des tailles de caisson standard, pour qu'aucun caisson n'ait à être découpé ou fabriqué sur mesure.
4.   0 4 Figez l'acier et l'installation dans la spécification après un relevé de site ; une conception réutilisant la structure existante est la plus grande économie disponible en extérieur.
5.   0 5 Envisagez la location plutôt que l'achat pour des besoins ponctuels ; notre guide de location d'écran LED explique comment ce processus fonctionne.
6.   0 6 Demandez la consommation moyenne et un plan de modules de rechange dès la première conversation, pas après l'installation du mur.

## Comment PixiaTech tarife un projet

PixiaTech devisé chaque projet une fois la taille, le pas, l'environnement et le mode d'installation connus, car ces quatre données d'entrée déterminent tout le reste du document. Un relevé de site établit la structure, les distances de vision, la lumière ambiante et l'alimentation électrique ; la spécification découle du relevé, et le devis découle de la spécification, détaillé ligne par ligne avec la consommation moyenne indiquée. Transmettez vos besoins et les détails du site via le formulaire Démarrer un projet et nous étudierons avec vous le pas, la surface et le coût total de possession.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Combien coûte un écran LED au mètre carré ?`,
        answer: `Cela dépend de huit facteurs : pas de pixel, intérieur/extérieur, luminosité, package LED, caisson, système de contrôle, structure et garantie. Le pas domine, car le nombre de LED croît au carré. PixiaTech établit un prix précis pour chaque projet après avoir défini la surface, le pas, l'environnement et le mode de pose lors d'un relevé.`,
      },
      {
        question: `Pourquoi les écrans P2,5 et P3,9 diffèrent-ils autant ?`,
        answer: `Un écran P2,5 compte environ 160 000 pixels par mètre carré et un P3,9 environ 65 700, soit environ 2,4 fois plus de LED, de driver, de puissance et de chaleur dans la même surface. Cet écart traverse le module, le caisson et chaque réparation ultérieure. Pour des scènes et des showrooms vus depuis quatre mètres ou plus, le P3,9 rend généralement parfaitement bien.`,
      },
      {
        question: `Pourquoi un écran LED extérieur est-il plus exigeant qu'un écran intérieur ?`,
        answer: `Parce que presque tout, sauf le nombre de LED, augmente : étanchéité IP65 avant et arrière, luminosité au-delà de 5 000 nits, revêtement conforme, gestion thermique, caissons 30 à 60 % plus lourds, charpente étudiée avec un rapport structurel, installation par grue et circuit électrique dédié. Un mur extérieur tourne aussi à forte luminosité toute la journée, donc sa consommation annuelle est plusieurs fois celle d'un mur intérieur.`,
      },
      {
        question: `L'installation est-elle incluse dans un devis d'écran LED ?`,
        answer: `Souvent pas. La plage au mètre carré que beaucoup de fournisseurs mettent en avant ne couvre que le module et le caisson ; la structure, la main-d'œuvre, le câblage, l'alimentation et le contrôle sont étudiés pour le site. Demandez un relevé et chaque poste sur sa propre ligne, afin que deux devis pour le même mur soient réellement comparables.`,
      },
      {
        question: `Combien d'électricité consomme un écran LED ?`,
        answer: `Un mur intérieur fine pitch consomme en moyenne 120 à 180 W par mètre carré à la luminosité d'un bureau, donc un mur P1,9 de 9 m² tourne près de 1,35 kW et consomme environ 5 900 kWh par an à 12 heures par jour. Une façade P6,9 à 250 W/m² sur 32 m² tire environ 8 kW et près de 47 000 kWh à 16 heures par jour. La gradation automatique réduit les deux.`,
      },
      {
        question: `Que doit contenir un devis d'écran LED ?`,
        answer: `Pas de pixel et résolution, luminosité, fréquence de rafraîchissement, puissance moyenne et de pointe, matériau du caisson, poids et accès de maintenance, système de contrôle, structure, installation, électricité, stock de modules de rechange et étendue de garantie avec délai d'intervention sur site, chaque poste sur sa propre ligne. Un chiffre clé en main en une seule ligne masque les décisions qui séparent un fournisseur d'un autre.`,
      },
    ],
  },
  'led-screen-rental-guide': {
    contentFr: `La location d'écran LED est habituellement le poste qu'un budget d'événement règle en dernier et celui qui varie le plus d'un devis à l'autre. Ce guide couvre trois choses : ce qui détermine réellement le coût d'une location, comment dimensionner un mur et choisir un pas de pixel à partir de l'endroit où votre audience se trouve réellement, et les 12 questions qui rendent comparables deux devis de location de mur LED. Il n'y a pas de grille tarifaire ici, car une location se chiffre toujours en fonction du travail concerné ; les exemples chiffrés vont d'une salle de bal d'hôtel à une scène en plein air.

## Quand la location d'écran LED a du sens, et quand l'achat l'emporte

Le test le plus simple est le nombre de jours d'utilisation par an. Une marque, une agence ou une société événementielle qui place un écran devant une audience moins d'environ 30 jours par an a presque toujours intérêt à louer. L'inventaire, le stockage, l'étalonnage, les rechanges et l'équipe qui connaît le système restent du côté du loueur. Un lieu, un studio, une salle de culte ou un hall d'entreprise qui utilise un écran chaque jour achète, car une location continue n'a plus de sens face à un mur que l'organisation posséderait en propre.

Il existe un juste milieu. Une société événementielle qui réalise huit à dix spectacles par an peut amortir 20–30 m² d'un parc en qualité location en environ deux ans, mais c'est une décision d'entreprise qui inclut un processeur, du matériel d'accrochage, un camion et du personnel formé, pas seulement l'achat d'un écran. Ce guide reste du côté de la location ; ce qui détermine le coût d'un achat est traité séparément dans notre guide du coût d'un écran LED.

## Les six postes derrière un devis de location d'écran LED

Un devis de location d'écran LED ressemble à un seul chiffre. Derrière lui se tiennent six postes distincts, et l'essentiel de l'écart entre deux devis pour le même mur vient de la façon dont ces postes sont assemblés plutôt que des caissons eux-mêmes.

### Les mètres carrés et le pas de pixel

L'unité de base du calcul est le mètre carré par jour. À surface égale, le coût augmente à mesure que le pas devient plus fin : un caisson 1,9 mm porte presque deux fois les LED d'un caisson 2,6 mm et quatre fois celles d'un 3,9 mm, et l'électronique de driver suit. Choisir un pas avant de connaître la position de vision la plus proche est l'erreur la plus coûteuse en location de mur LED. Une scène regardée depuis 8 m n'a pas besoin de 1,9 mm ; un stand vu depuis 1 m montre des pixels visibles à 3,9 mm.

### Les jours et intérieur contre extérieur

Le chiffre principal d'un devis couvre le premier jour de spectacle. Les jours de montage et de démontage, et les deuxième et jours suivants d'un événement sur plusieurs jours, sont normalement facturés à un tarif réduit plutôt qu'en jours pleins, donc une foire de quatre jours n'est pas quatre fois un spectacle d'un jour. Les caissons extérieurs se situent au-dessus des intérieurs à pas égal, car ils portent l'étanchéité IP65, une luminosité de 4 000–5 500 nits et nécessitent un support au sol calculé pour la charge de vent du site.

### Équipe, opérateur et logistique

Le poste caisson ne construit pas le mur. Une équipe d'installation de deux à quatre personnes, un opérateur qui reste avec l'écran pendant tout le spectacle, le camion, l'accrochage ou le truss, la distribution électrique et les caissons de rechange sont des lignes séparées. Sur les petits travaux, ces lignes pèsent plus que l'écran lui-même, raison pour laquelle un écran de stand de 6 m² est devisé comme un ensemble complet plutôt qu'au mètre carré seul.

## Ce qui détermine le coût d'une location d'écran LED, et comment comparer deux devis

Il n'y a pas de tarif unique pour la location d'écran LED, et un fournisseur qui en donne un au téléphone devine la moitié du travail. Ce que coûte une location est fixé par une courte liste de variables, et chacune est quelque chose que vous pouvez régler avant de demander un devis. Notez-les une fois et envoyez le même brief à tout le monde : c'est seulement alors que deux fournisseurs chiffrent le même travail, et seulement alors que les comparer a un sens.

1.   0 1 Surface et pas de pixel : les mètres carrés de mur et les millimètres entre LED. Un caisson 1,9 mm porte environ quatre fois les LED d'un 3,9 mm, et l'électronique de driver suit.
2.   0 2 Intérieur ou extérieur : étanchéité IP65, 4 000–5 500 nits et connecteurs résistants aux intempéries se situent au-dessus d'un caisson intérieur de même pas.
3.   0 3 Jours sur site : le jour de spectacle, plus les jours de montage, de répétition et de démontage, plus les jours creux où le mur reste inutilisé entre les sessions.
4.   0 4 Méthode d'accrochage : la suspension à un truss ou à des points de plafond exige des chiffres de charge ponctuelle et des certificats ; le support au sol demande du lestage et un calcul de charge de vent. Les deux ne sont pas interchangeables.
5.   0 5 Équipe et opérateur : combien de techniciens montent le mur, combien d'heures l'opérateur reste, et si le travail se fait de nuit ou dans une fenêtre de montage étroite du lieu.
6.   0 6 Transport et accès : distance, taille du camion, quai de chargement ou portage en escalier, permis de stationnement et règles de manutention du lieu.
7.   0 7 Signal et contenu : processeur, serveur média, un flux redondant, et si quelqu'un doit reconstruire le contenu au canevas en pixels du mur.
8.   0 8 Rechanges et assurance : environ 5 % du mur en caissons, modules et alimentations de rechange, plus une couverture du matériel pendant qu'il est sur site.

Comparer deux devis est un exercice de soustraction. Mettez-les côte à côte et alignez les mêmes sept lignes : surface et pas, jours, accrochage, alimentation, signal, personnes, et rechanges avec transport. Un devis moins élevé qui reste muet sur trois de ces lignes n'est pas moins cher, il est plus petit. Les écarts que nous voyons le plus souvent sont un opérateur qui part dès l'ouverture des portes, un accrochage discrètement supposé être le problème du lieu, et un jour de montage qui réapparaît ensuite en ligne supplémentaire.

L'autre moitié de la comparaison est ce que chaque fournisseur apporte réellement sur site. Des caissons de même pas nominal diffèrent en âge, en uniformité de luminosité et en fréquence de rafraîchissement, et un mur étalonné il y a deux saisons le montre à la caméra. Demandez par écrit le pas en millimètres, la luminosité en nits, la fréquence de rafraîchissement en Hz et le nombre de caissons, et demandez quand ces caissons ont été révisés pour la dernière fois. Une fois votre taille, votre pas, vos dates et votre lieu sur la table, nous préparons un devis écrit pour ce travail plutôt que de lire une liste.

## Dimensionner par type d'événement : quatre scénarios istanbuliotes

La taille commence par l'audience, pas par la salle : la distance au spectateur le plus proche et au plus éloigné, la hauteur sous plafond et la largeur de scène. Les caissons de location font 500 × 500 mm ou 500 × 1 000 mm, donc les dimensions du mur se planifient par pas d'un demi-mètre. Les quatre scénarios ci-dessous sont les travaux que nous voyons le plus souvent à Istanbul.

### Un lancement de 400 personnes : un mur de 6 × 3,5 m

Pour un lancement produit destiné à 400 invités dans une salle de bal d'hôtel ou un centre de congrès, un écran principal de 6 × 3,5 m, 21 m², est la réponse standard. À 2,6 mm, le mur résout environ 2 300 × 1 350 pixels, donc un contenu Full HD se joue sans mise à l'échelle et un canevas sur mesure peut utiliser la largeur supplémentaire. En caissons 500 × 500 mm, cela fait 12 × 7 = 84 caissons ; une équipe de deux personnes l'accroche, le câble et le contrôle en quatre à cinq heures. Prévoyez deux jours sur site : un jour de montage pour l'accrochage, le câblage et le chargement du contenu, puis le jour de spectacle avec un opérateur à la régie.

### Un mariage en salle de bal d'hôtel : 4 × 2,5 m

Pour 200–300 invités, un fond de scène de 4 × 2,5 m, 10 m², suffit. Même du 3,9 mm rend proprement depuis 5 m, mais les photographes et les équipes vidéo demanderont du 2,6 mm. L'éclairage d'une salle de bal est faible, donc 800–1 000 nits suffisent et les caissons tournent à 30–40 % de luminosité. Un mur de cette taille est normalement devisé comme un ensemble complet, équipe d'installation comprise, l'opérateur figurant sur une ligne séparée ; vérifiez donc laquelle des deux options votre devis couvre avant de le comparer à quoi que ce soit.

### Un concert en plein air : un mur principal de 10 × 6 m et des écrans latéraux

Une scène en plein air typique porte un écran principal de 10 × 6 m, 60 m², et deux écrans latéraux de 4 × 3 m, 84 m² au total. Le pas est de 3,9–4,8 mm, la luminosité de 5 000 nits, les caissons sont IP65 et le support au sol est calculé pour la charge de vent du site. À cette échelle, l'écran n'est qu'une partie du travail : truss, support au sol, groupe électrogène, distribution électrique et une équipe de six personnes sont autant de lignes séparées, et le site lui-même, son accès, son sol et son exposition au vent, détermine la structure dont le mur a besoin. L'installation prend une journée complète.

### Un stand d'exposition : 3 × 2 m pendant quatre jours

Pour un mur arrière de stand au CNR Expo ou à Tüyap, un écran de 3 × 2 m, 6 m², est prévu en 1,9–2,6 mm car les visiteurs le lisent à un mètre. Le salon dure quatre jours, donc les jours suivant le premier sont facturés à un tarif réduit et l'ensemble de la prestation est normalement devisé comme un forfait unique. La demande d'alimentation du lieu et sa fenêtre de montage font partie du devis, et une installation de nuit peut entraîner un supplément.

### Une activation en centre commercial

Les atriums de centres commerciaux sous verrières portent une lumière ambiante diurne supérieure à 2 000 lux, donc un écran intérieur de 3 × 2 m y nécessite au moins 1 500 nits plutôt que les 800 que prendrait une salle de bal. La direction du centre commercial fixe des règles sur l'alimentation, le bruit et les heures d'installation ; les transmettre au fournisseur avant le devis fait gagner la journée elle-même.

> Dans une location d'écran LED, ce que vous payez n'est pas des mètres carrés, mais un mur qui fonctionne du début à la fin.

## Ce qu'un bon devis de location de mur LED contient

Un devis qui tient en une seule ligne ne dit rien de ce qui est réellement inclus. Un devis comparable détaille chaque ligne ci-dessous, car un poste omis se paie le jour du spectacle en facture supplémentaire ou en matériel absent.

1.   0 1 Le nombre de jours : un jour de spectacle, un jour de montage, un jour de démontage, chaque journée facturée séparément.
2.   0 2 La surface et le pas : dimensions, surface totale, pas de pixel et résolution obtenue.
3.   0 3 Les caissons : dimensions, nombre, luminance en nits et fréquence de rafraîchissement si des caméras sont prévues.
4.   0 4 L'accrochage : structure, truss, support au sol, points de suspension, lestage et calcul de charge de vent.
5.   0 5 L'alimentation : puissance nécessaire, distribution, câbles, mise à la terre et protections.
6.   0 6 La signalisation : processeur, multiplexage, redondance, et qui fournit la source.
7.   0 7 Les rechanges, le transport, l'assurance et la TVA ; clauses d'annulation et météo.

## Comment se déroule le jour d'installation

La séquence d'une installation de location d'écran LED est la même sur chaque chantier. L'accrochage se monte d'abord ; les caissons se suspendent aux barres de tête et se verrouillent à leurs voisins par des loquets quart de tour ; chaque colonne est chaînée sur une boucle de données redondante ; le processeur cartographie le mur ; une mire de test parcourt chaque caisson et le mur est équilibré en blanc face au jeu d'éclairage. Une équipe de deux personnes accroche 20–30 m² de caissons de location légers par heure, donc le mur de lancement de 21 m² est prêt, testé, en un après-midi.

Le temps de répétition est la ligne la plus importante du devis. Le mur doit être équilibré et chargé de contenu au moins deux heures avant l'arrivée du présentateur et de l'équipe contenu, et la luminosité reçoit son réglage final une fois l'éclairage de la pièce fixé. L'ordre complet d'installation et la liste de contrôle d'avant-spectacle sont détaillés pas à pas dans notre guide de montage de scène de location.

## 12 questions à poser avant de réserver une location d'écran LED

Ces questions ne sont pas un test pour le fournisseur. Il n'y a pas de tarif de marché auquel comparer un devis, donc le seul moyen de juger un devis est la part du travail qu'il détaille. Posez-les par écrit et conservez les réponses avec le devis : cette formulation devient le périmètre convenu, et chaque question sans réponse claire est un risque le jour du spectacle.

1.   0 1 Quel est le pas de pixel exact en millimètres et la luminosité en nits ? Les deux doivent figurer dans le devis ; « haute résolution » n'est pas une spécification.
2.   0 2 Quelles sont la taille et le nombre de caissons, et quelle est la résolution totale du mur en pixels ? L'équipe contenu travaille à partir de ce chiffre.
3.   0 3 Le devis inclut-il l'installation, le démontage et le transport, et les jours de montage et de démontage sont-ils écrits en lignes propres ?
4.   0 4 Un opérateur reste-t-il sur site pendant l'événement, pour combien d'heures, et comment le travail de nuit est-il facturé ?
5.   0 5 Des caissons, modules, alimentations et cartes de réception de rechange sont-ils inclus ? La norme du secteur est d'environ 5 % du mur.
6.   0 6 Pour les dates en extérieur, quel est l'indice IP, y a-t-il un calcul de charge de vent et de lestage, et à quelle vitesse de vent le spectacle est-il arrêté ?
7.   0 7 Qui fournit l'accrochage, le truss, le support au sol ou les points de plafond, et les calculs de charge ponctuelle et les certificats sont-ils disponibles ?
8.   0 8 Quelle est la puissance totale nécessaire en kW, qui apporte le tableau de distribution, et un groupe électrogène est-il nécessaire ?
9.   0 9 Quelles entrées le processeur accepte-t-il (HDMI, SDI), y a-t-il un chemin de signal redondant, et quelle est la fréquence de rafraîchissement pour un travail face caméra ?
10.   0 10 Dans quelle résolution et quel format le contenu doit-il être livré, qui gère la mise à l'échelle, et quelle est la date limite de livraison ?
11.   0 11 Quand l'installation commence-t-elle, à quelle heure le mur est-il prêt pour la répétition, et la fenêtre de montage du lieu est-elle reflétée dans le devis ?
12.   0 12 Quelles sont les clauses de dommages, d'assurance, d'annulation et de météo, et le calendrier de paiement et la TVA sont-ils clairement indiqués ?

## Quelle série de location PixiaTech pour quel travail

La série PixiaTech XR Event, en caissons 500 × 500 mm et 500 × 1 000 mm, porte l'essentiel du travail événementiel intérieur et extérieur ; la plupart des lancements, mariages et congrès sont construits dessus. XR Arena est l'option grande scène et concert en plein air, avec une luminosité plus élevée et un système de support au sol conçu pour la charge de vent. XR Flex construit des fonds de scène courbes avec des crans de verrouillage de ±15° entre caissons. XR Bastion est le choix robuste pour les dates en extérieur par temps rude, et XR Essential est l'option d'entrée pour les petits travaux intérieurs aux exigences simples.

Si la date, le lieu et le nombre d'invités sont connus, une proposition de dimensionnement prend un jour. Laissez un court brief sur la page Démarrer un projet et nous vous renverrons un devis écrit pour votre travail, avec le pas de pixel, le nombre de caissons, l'équipe et le plan d'installation exposés ligne par ligne afin que vous puissiez le comparer à tout autre document.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Combien coûte la location d'un écran LED par jour ?`,
        answer: `Il n'existe pas de tarif journalier unique. Une location se chiffre selon la surface en mètres carrés, le pas de pixel, des caissons intérieurs ou extérieurs, les jours sur site incluant montage et démontage, la méthode d'accrochage, les heures d'équipe et d'opérateur, le transport et les rechanges. PixiaTech prépare un devis écrit pour chaque travail une fois la taille, le pas, les dates et le lieu connus.`,
      },
      {
        question: `Quel est le plus petit écran LED que l'on peut louer ?`,
        answer: `Les caissons de location font 500 × 500 mm, donc le minimum pratique est un écran de 2 × 1 m, 2 m² ; pour les stands et les bords de scène, 3 × 2 m est la petite taille la plus courante. Un mur de cette taille est devisé comme un ensemble complet avec installation et opérateur plutôt qu'au mètre carré, car l'équipe, le camion et le processeur sont les mêmes dans tous les cas.`,
      },
      {
        question: `Un écran LED de location extérieur fonctionne-t-il sous la pluie ?`,
        answer: `Oui. Les caissons extérieurs de location sont étanches IP65 et fonctionnent sous la pluie, à condition que les connexions d'alimentation et de données utilisent des presse-étoupes et que les câbles soient posés avec des boucles d'égouttement. Le vrai risque est le vent plutôt que l'eau : un écran sur support au sol a besoin d'un lestage et d'un calcul de charge de vent, et le devis doit indiquer la vitesse de vent à laquelle le spectacle est arrêté. Les caissons intérieurs ne sont jamais utilisés en extérieur, même sous une tente.`,
      },
      {
        question: `Combien de temps prend le montage d'un mur LED de location ?`,
        answer: `Une équipe de deux personnes accroche 20–30 m² de caissons de location par heure. Un fond de scène de mariage de 10 m² est prêt en deux à trois heures, accrochage compris, un mur de lancement de 21 m² en quatre à cinq heures, et un écran de concert en plein air de 60 m² avec truss et support au sol en une journée complète. Ajoutez au moins une heure pour la cartographie du processeur, la mire de test et l'équilibrage des blancs.`,
      },
      {
        question: `Qui prépare le contenu pour un écran LED loué ?`,
        answer: `Le client ou son agence produit le contenu ; le loueur fournit par écrit la résolution en pixels, le format d'image et les formats acceptés du mur une semaine avant l'installation. Pour un mur de 6 × 3,5 m à 2,6 mm, le contenu doit être construit sur un canevas de 2 300 × 1 350 pixels ; un fichier 16:9 Full HD se joue mis à l'échelle mais laisse des marges vides. L'opérateur gère la lecture et ne crée pas le contenu.`,
      },
      {
        question: `Combien de temps à l'avance réserver une location d'écran LED à Istanbul ?`,
        answer: `Une semaine suffit pour les petits travaux intérieurs. Comptez trois semaines pour un lancement de 400 personnes ou un congrès, et quatre à six semaines pour les concerts en plein air et les saisons de salons, en gros d'avril à juin et de septembre à novembre. Réserver tôt ne change pas la spécification, mais sécurise l'inventaire au bon pas de pixel et une équipe expérimentée pour votre date, le relevé du lieu étant réalisé dans cette fenêtre.`,
      },
    ],
  },
  'led-sign-vs-led-screen': {
    contentFr: `Une enseigne LED et un écran LED sont souvent proposés pour la même façade, mais ce sont deux outils différents qui répondent à des questions différentes. En Turquie, l'expression « LED tabela » désigne les lettres boîtiers lumineuses, les caissons lumineux, les enseignes à texte défilant et la croix de pharmacie animée, tandis qu'un écran LED est une surface vidéo pleine couleur pilotée par un système de contrôle. Ce guide définit chacun, les compare selon dix critères, dit clairement quand une enseigne lumineuse classique est le meilleur choix, et couvre le dimensionnement, la luminosité, les autorisations, l'installation, l'alimentation et la charge de contenu.

## Qu'est-ce qu'une enseigne LED : trois produits sous un même nom

Demandez à trois enseignistes une enseigne LED et vous obtiendrez peut-être trois propositions différentes, car le terme décrit la source lumineuse plutôt que le produit. Les LED ont remplacé le néon et les tubes fluorescents à l'intérieur des enseignes il y a longtemps, si bien que presque toute l'enseigne lumineuse fabriquée aujourd'hui est une enseigne LED. Ce qui diffère, c'est ce que font les LED : éclairer une forme fixe par l'arrière, faire défiler du texte sur une matrice grossière, ou animer un graphique fixe.

### Lettres boîtiers et caissons lumineux

Les lettres boîtiers sont des lettres en trois dimensions en aluminium ou en acier inoxydable avec une face en acrylique, éclairées de l'intérieur par de petits modules LED ; un caisson lumineux est un panneau encadré dont la face imprimée est éclairée par l'arrière. Les deux montrent une chose : votre nom et votre logo, dans votre propre police et vos couleurs, chaque nuit pendant des années. Un bandeau de boutique typique de 4 m en lettres boîtiers consomme environ 60–150 W. Le contenu ne change jamais, et c'est précisément l'intérêt : cette enseigne lumineuse classique reste la colonne vertébrale de l'identité d'un commerce.

### Enseignes LED à défilement

L'enseigne LED à défilement est une matrice étroite de LED monochromes ou tricolores, généralement à pas de 10 mm, construite à partir de modules de 320 × 160 mm de 32 × 16 pixels. Elle affiche du texte et des symboles simples : horaires d'ouverture, menu du jour, une ligne de campagne défilant de droite à gauche. Une enseigne de deux modules de haut a 32 pixels de hauteur, assez pour une ou deux lignes de lettres mais pas pour une photographie, un logo en vraies couleurs ou une vidéo. C'est un outil textuel, et un outil utile dans cette limite.

### Croix de pharmacie et autres enseignes à graphique fixe

La troisième famille est l'enseigne animée à graphique fixe : la croix de pharmacie qui alterne des motifs, l'enseigne « ouvert » dans une vitrine, les tableaux à chiffres sept segments d'une station-service. Les LED suivent la forme du graphique plutôt qu'une grille polyvalente, donc l'enseigne peut animer cette forme unique et changer quelques chiffres, et rien d'autre. Ces enseignes sont robustes, lisibles de loin et modestes en consommation.

## Qu'est-ce qu'un écran LED, et en quoi diffère-t-il de l'affichage numérique LCD

Un écran LED est une matrice de pixels pleine couleur, assemblée à partir de modules et de caissons à toute taille et pilotée par un système de contrôle : un lecteur média, des cartes de réception dans les caissons et un logiciel de programmation. Il diffuse vidéo, photographies, animation et données en direct. Le pas de pixel, la distance entre deux pixels, va de moins de 1 mm en intérieur à 10 mm et plus en bord de route. Les modèles extérieurs sont étanches IP65 et atteignent 5 000 nits et plus, si bien que l'image tient en plein soleil.

L'affichage numérique LCD intérieur est la troisième option, souvent confondue avec les deux autres. C'est un écran plat commercial de 43 à 98 pouces avec une très haute résolution de près et 350–700 nits, ce qui suffit largement dans une boutique ou un hall d'hôtel. Derrière une vitre ensoleillée, un LCD standard se délave, et il existe en tailles fixes avec bordures, alors que le LED s'étend sans raccord. Notre guide comparant les murs vidéo LED et LCD couvre ce choix ; cet article reste sur la façade et la vitrine.

## Enseigne LED contre écran LED : une comparaison en dix points

Les dix critères ci-dessous sont ceux qui décident des projets, et le contenu est la ligne de partage. Une enseigne porte un message pour toute sa durée de vie ; un écran en porte autant que vous en programmez, et une boucle de 60 secondes de six scènes se répète soixante fois par heure. Les lettres boîtiers n'ont pas de pixels et sont nettes à toute distance, alors qu'un écran de 2 × 1 m à pas de 4 mm compte environ 500 × 250 pixels. En plein jour, une enseigne se lit comme un objet physique, par la couleur et le contraste ; un écran doit battre le soleil par sa luminosité.

1.   0 1 Contenu : une enseigne montre un nom et un logo fixes, une enseigne à défilement ne montre que du texte, un écran montre un contenu illimité et changeant.
2.   0 2 Résolution et distance de vision : les lettres sont nettes à toute distance ; un écran nécessite un pas de pixel adapté au spectateur le plus proche.
3.   0 3 Luminosité en plein jour : une enseigne se lit par la couleur et le contraste ; un écran extérieur a besoin de 5 000 nits et plus, un écran derrière une vitre de 2 500–4 000 nits.
4.   0 4 Mouvement et attention : une enseigne est trouvée par ceux qui la cherchent ; le mouvement sur un écran capte ceux qui ne la cherchaient pas.
5.   0 5 Messages par jour : un pour une enseigne, quelques lignes de texte pour une enseigne à défilement, des dizaines pour un écran programmé.
6.   0 6 Gestion à distance : aucune pour une enseigne, une application téléphone ou une clé USB pour une enseigne à défilement, une programmation cloud multi-sites pour un écran.
7.   0 7 Consommation : environ 60–150 W pour un bandeau de 4 m en lettres, 100–150 W par m² pour une enseigne à défilement, 200–300 W par m² en moyenne pour un écran extérieur.
8.   0 8 Durée de vie : les modules d'enseigne sont donnés pour environ 50 000 heures, les LED d'écran jusqu'à 100 000 heures à mi-luminosité ; en extérieur, les deux servent 7–10 ans, et les alimentations vieillissent en premier.
9.   0 9 Maintenance : une enseigne demande un nettoyage et une alimentation occasionnelle ; un écran demande des modules de rechange du même lot et un nettoyage et contrôle annuels.
10.   0 10 Autorisations : les deux nécessitent l'accord de la municipalité ; une image lumineuse et mouvante face à la circulation ou à l'habitat est examinée de plus près que des lettres statiques.

## Quand une enseigne lumineuse classique est la bonne réponse

PixiaTech vend des écrans LED, et nous disons encore à bon nombre de clients que ce dont leur façade a d'abord besoin, c'est d'une bonne enseigne. Le premier rôle d'une devanture est de dire qui vous êtes, lisiblement, depuis le bout de la rue, à toute heure, sans que personne n'attende la bonne scène dans une boucle. Un nom affiché sur un écran huit secondes par minute est invisible pendant les cinquante-deux autres ; un nom en acier et acrylique n'est jamais éteint.

1.   0 1 Votre message est votre nom, et il ne change pas d'un mois à l'autre.
2.   0 2 Le bâtiment est classé ou la rue est patrimoniale, où les matériaux, les couleurs et l'éclairage sont limités et les images mouvantes rarement acceptées.
3.   0 3 La municipalité ou la gestion de l'immeuble restreint les affichages lumineux mouvants.
4.   0 4 La devanture fait moins d'environ 3 m de large, ou le bandeau de façade est le seul espace disponible.
5.   0 5 Personne dans l'entreprise n'a le temps de maintenir le contenu d'un écran à jour.
6.   0 6 Votre profession, comme une pharmacie ou une clinique, est restreinte dans sa façon de faire de la publicité.

## Quand un écran LED est la bonne réponse

Un écran gagne sa place quand le message change plus vite qu'une enseigne ne le peut. Une boutique aux campagnes hebdomadaires, un restaurant dont l'offre diffère au petit-déjeuner, au déjeuner et au dîner, un concessionnaire dont le stock tourne, une entreprise aux multiples produits ou listes de prix à présenter : chacun a plus à dire qu'une seule surface de lettres fixes ne peut en contenir. Les affiches et banderoles imprimées sont la solution habituelle ; un écran remplace le cycle d'impression, de pose et de mise au rebut par un simple téléversement.

L'emplacement renforce l'argument. Un fort passage ou une circulation dense et lente multiplie les personnes qu'une image mouvante atteint, et une façade d'angle est vue depuis deux rues à la fois. Les chaînes y ajoutent le contrôle central : avec un écran dans chaque succursale, le siège change la campagne partout à la même minute. Rien de tout cela ne s'applique à une rue calme avec trente passants par heure, où un écran parlerait tout seul. Comptez le passage avant de le supposer.

> L'enseigne dit qui vous êtes ; l'écran dit ce qui est nouveau.

## Pourquoi la plupart des entreprises finissent avec les deux

En pratique, la question est rarement soit l'un soit l'autre. L'identité et la nouveauté sont deux métiers différents, et les devantures qui fonctionnent le mieux confient chaque métier à l'outil conçu pour lui. L'enseigne reste constante pendant une décennie et construit la reconnaissance ; l'écran change chaque semaine et donne aux gens une raison de regarder à nouveau. Remplacer l'enseigne par un écran LED déçoit généralement, car le nom disparaît chaque fois qu'une autre scène est diffusée.

### Une disposition hybride pour une devanture

L'hybride le plus courant compte trois couches. Le bandeau au-dessus de la vitrine porte le nom en lettres boîtiers, dimensionné pour l'autre côté de la rue. À l'intérieur de la vitrine, à hauteur des yeux, un écran LED de devanture porte le message changeant : un Poster LED Display à côté des produits dans une vitrine ombragée ou de centre commercial, ou un écran fixe plus lumineux là où la vitre prend le soleil. Là où les produits doivent rester visibles, le Jellyfish LED Film se colle à la vitre et conserve plus de 90 % de transparence. Notre guide des écrans LED pour boutiques et vitrines décrit ces formats.

### Façades plus grandes et bâtiments d'angle

Sur un bâtiment plus grand, la même logique s'étend : le nom se place haut sur l'acrotère, l'écran plus bas, là où piétons et automobilistes regardent réellement. Le XR Vision convient à une surface extérieure fixe, le XR Edge à une façade qui ne peut recevoir qu'un caisson fin, le XR Air à une façade vitrée qui doit rester transparente, le XR Curve à un angle arrondi. Notre guide des écrans LED en publicité extérieure couvre les écrans qui portent aussi d'autres annonceurs.

## Dimensionner l'écran : distance de vision et pas de pixel

Deux distances décident de la spécification. Le point le plus proche depuis lequel on regarde l'écran fixe le pas de pixel, selon la règle empirique d'environ 1 m par millimètre de pas. Un écran de vitrine vu depuis le trottoir, à 2,5 à 4 m, appelle du P2,5–P3,9. Un écran de façade vu depuis l'autre côté de la rue, à 6 à 20 m, est bien servi par du P4–P6,9. Un pas plus fin que la distance ne l'exige ajoute une résolution que l'œil ne peut pas exploiter.

Le point le plus éloigné fixe la taille, par la hauteur du texte. Une lettre de 10 cm se lit confortablement depuis environ 12 m et reste lisible à 30 m, et sur un écran une lettre a besoin d'au moins 12 à 16 pixels de hauteur pour paraître nette. Partez de la ligne la plus longue que vous prévoyez d'afficher : un écran de 2 × 1 m à P4 a de la place pour une image produit et deux lignes de grand texte, pas beaucoup plus. Notre guide du pas de pixel détaille le calcul.

## Luminosité, vitrage et variation nocturne

C'est sur la luminosité que les projets de vitrine et de façade échouent le plus souvent. Un écran en plein air a besoin de 5 000 nits ou plus pour tenir son contraste à midi. Un écran derrière une vitre qui prend le soleil direct a besoin de 2 500–4 000 nits, car la vitre superpose le reflet de la rue et du ciel sur l'image. Une vitrine ombragée ou un couloir de centre commercial est confortable à 600–1 000 nits, la classe d'un Poster LED Display. Choisir la classe selon l'orientation de la vitre évite la plainte la plus courante : un écran qui disparaît chaque après-midi.

La nuit pose le problème inverse. Un écran laissé à sa puissance diurne après la tombée du jour éblouit, gêne les voisins, distrait les conducteurs et attire une plainte auprès de la municipalité. Un capteur de lumière devrait ramener un écran extérieur à environ 10–15 % de sa puissance maximale la nuit et un écran de vitrine à 20–30 %, la programmation étant enregistrée dans le contrôleur plutôt que laissée au personnel. Une enseigne lumineuse est plus douce par nature, mais mérite la même discipline : une minuterie ou une cellule photoélectrique.

## Règles municipales et autorisations pour une enseigne ou un écran LED

En Turquie, les enseignes et les dispositifs publicitaires sont régis par le règlement sur l'affichage et la publicité de chaque municipalité, donc les règles d'Istanbul diffèrent dans le détail de celles d'Izmir ou d'Ankara. Le terrain commun : une enseigne ou un écran visible depuis l'espace public nécessite une autorisation, sa surface est déclarée à la municipalité, et le règlement limite l'endroit de la façade où elle peut se placer, sa saillie et sa taille. L'enseigne est aussi examinée lors de la délivrance de la licence commerciale.

Les écrans attirent des conditions supplémentaires. De nombreux règlements traitent séparément les affichages lumineux et mouvants : plafonds d'intensité lumineuse, surtout vers l'habitat ; restrictions sur les contenus clignotants ou à coupes rapides ; et prudence près des carrefours, où une image mouvante ne doit pas être confondue avec un signal de circulation. Dans les quartiers historiques et les sites protégés, la commission de conservation a aussi son mot à dire, et l'approbation d'un écran est l'exception. Dans les immeubles partagés, tout élément fixé à une façade commune nécessite l'accord de la gestion de l'immeuble.

## Installation, alimentation et charge de contenu

### Installation et alimentation

Une enseigne à lettres est un travail léger pour un bâtiment : quelques kilogrammes par lettre, des fixations dans le bandeau, une alimentation basse tension cachée derrière et une alimentation depuis le circuit d'éclairage avec une minuterie. Un écran de façade est un projet d'une autre ampleur : les caissons pèsent 30–45 kg par m², le vent agit sur toute la face, et la structure acier doit être calculée pour le mur qui les porte. Un écran extérieur de 6 m² mérite son propre circuit et un accès de maintenance sûr ; un Poster LED Display en vitrine a besoin d'une seule prise.

### La charge de contenu, honnêtement décrite

C'est la différence que la plupart des acheteurs sous-estiment. Une enseigne est terminée le jour de son installation. Un écran a besoin de contenu frais chaque mois pour le reste de sa vie, car un écran qui diffuse la même vidéo depuis le printemps s'est transformé en une affiche statique très élaborée. Prévoyez un pack de démarrage de quatre à six scènes, une actualisation mensuelle et une personne nommée qui possède le calendrier. Si personne ne peut s'en charger, un écran plus petit avec des modèles simples, ou pas d'écran du tout, est la recommandation honnête.

## Par type d'activité : enseigne LED, écran LED ou les deux

1.   0 1 Restaurant et café : le nom en lettres au-dessus, et un Poster LED Display vertical près de la porte pour les menus du matin, du midi et du soir.
2.   0 2 Pharmacie : l'enseigne est définie par la réglementation professionnelle, jusqu'à l'enseigne à logo standard, et la promotion est restreinte. L'enseigne classique et la croix sont la réponse ; un écran est limité à l'information, comme le tableau de garde, après validation de l'ordre des pharmaciens.
3.   0 3 Station-service : l'auvent et le totem suivent l'identité du distributeur, avec des tableaux à chiffres LED pour les carburants. Un écran convient aux offres de la boutique et du lavage, placé et atténué pour ne jamais concurrencer l'attention du conducteur.
4.   0 4 Concessionnaire automobile : l'enseigne de marque suit les standards d'identité du constructeur. Le Jellyfish LED Film sur la grande vitre, ou une surface XR Vision sur la façade, porte les lancements, le stock et les campagnes de service.
5.   0 5 Prêt-à-porter : lettres boîtiers sur le bandeau et un écran de vitrine qui change avec la collection : P2,5 derrière la vitre, format vertical, contenu fourni par la marque chaque saison.
6.   0 6 Clinique : les règles de promotion du secteur de la santé sont strictes, donc la façade porte le nom et la spécialité sur une enseigne lumineuse sobre. Les écrans se placent à l'intérieur : un panneau LCD ou une petite surface XR Fine dans la salle d'attente.
7.   0 7 Hôtel : le nom en grandes lettres au niveau du toit ou de l'auvent, lisible depuis la voie d'accès. Les écrans fonctionnent dans le hall pour les événements et l'orientation ; un XR Column peut transformer une colonne de hall en cette surface.

## Erreurs courantes

1.   0 1 Remplacer l'enseigne de nom par un écran, si bien que l'entreprise reste sans nom la plupart de chaque minute.
2.   0 2 Choisir le pas de pixel avant de mesurer les points de vision les plus proches et les plus éloignés.
3.   0 3 Placer un écran à luminosité d'intérieur derrière une vitre qui prend le soleil de l'après-midi.
4.   0 4 Laisser l'écran à pleine puissance la nuit, sans capteur ni programmation.
5.   0 5 Commander avant de consulter la municipalité, la commission de conservation ou la gestion de l'immeuble.
6.   0 6 Remplir une enseigne à défilement de longues phrases à grande vitesse ; six mots qui restent fixes fonctionnent mieux.
7.   0 7 Traiter le contenu comme une opération ponctuelle : pas de calendrier, pas de responsable, la même vidéo pendant un an.

Une enseigne classique représente l'investissement initial le plus faible ; le coût d'un écran dépend de sa surface, de son pas de pixel, de sa classe de luminosité et de sa structure, et PixiaTech chiffre chaque projet individuellement. Nous travaillons aux côtés de votre enseigniste quand un projet a besoin des deux. Envoyez-nous une photographie de la façade, sa largeur, son orientation et ce que vous souhaitez y dire ; nous vous indiquerons si un écran a du sens à cet endroit et où l'enseigne de nom doit rester exactement telle quelle. Un court brief sur la page Démarrer un projet suffit pour commencer.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Quelle est la différence entre une enseigne LED et un écran LED ?`,
        answer: `Une enseigne LED est une enseigne lumineuse fixe : lettres boîtiers, caisson lumineux, enseigne à texte défilant ou croix de pharmacie, montrant un nom, un graphique ou des lignes de texte. Un écran LED est une matrice de pixels pleine couleur avec un système de contrôle qui diffuse vidéo et campagnes programmées. L'enseigne exprime l'identité ; l'écran porte un contenu changeant.`,
      },
      {
        question: `Un écran LED peut-il remplacer mon enseigne de boutique ?`,
        answer: `Techniquement oui, mais c'est rarement une bonne idée. Sur un écran, le nom de l'entreprise n'apparaît que pendant la diffusion de sa propre scène, donc la façade est anonyme la plupart de chaque minute. La disposition qui fonctionne est une enseigne de nom fixe sur le bandeau et un écran dans la vitrine.`,
      },
      {
        question: `Une enseigne LED à défilement suffit-elle à mon activité ?`,
        answer: `Une enseigne LED à défilement suffit si votre message est du texte court : horaires d'ouverture, ligne de menu du jour, une seule phrase de campagne. Avec 16 ou 32 pixels de hauteur, elle ne peut pas afficher de photographies ni de vidéo. Pour montrer des produits ou plusieurs offres par jour, un écran LED pleine couleur ou un Poster LED Display est le bon outil.`,
      },
      {
        question: `Quel pas de pixel faut-il pour un écran LED de devanture ?`,
        answer: `Adaptez le pas au spectateur le plus proche, à environ 1 m de distance par millimètre de pas. Un écran de vitrine vu depuis le trottoir à 2,5–4 m nécessite du P2,5–P3,9. Un écran de façade vu depuis l'autre côté de la rue à 6–20 m convient bien en P4–P6,9.`,
      },
      {
        question: `Ai-je besoin d'une autorisation pour une enseigne ou un écran LED ?`,
        answer: `Oui. En Turquie, les deux relèvent du règlement municipal sur l'affichage et la publicité, et la surface affichée est déclarée à la municipalité. Les écrans font face à des conditions supplémentaires sur l'intensité lumineuse, le contenu mouvant et la proximité des carrefours, et dans les quartiers historiques la commission de conservation doit aussi approuver. Renseignez-vous avant de commander.`,
      },
      {
        question: `Combien d'électricité consomme une enseigne LED par rapport à un écran LED ?`,
        answer: `Un bandeau de 4 m en lettres boîtiers LED consomme environ 60–150 W, et une enseigne à défilement environ 100–150 W par m². Un écran LED extérieur pleine couleur consomme en moyenne 200–300 W par m² avec des pics de 600–800 W, et un Poster LED Display environ 200 W en moyenne. La variation nocturne automatique réduit considérablement la consommation d'un écran.`,
      },
    ],
  },
  'led-vs-lcd-video-wall': {
    contentFr: `Mur d'images LED ou mur d'images LCD est la première décision dans la plupart des projets audiovisuels d'entreprise, et elle est trop souvent prise sur le seul prix d'achat. Les deux promettent la même chose, une grande surface d'image continue et toujours allumée, et la livrent de manières différentes à des coûts à long terme différents. Ce guide met les deux côte à côte sans parti pris : ce qu'est un mur d'images, comment fonctionnent un mur d'images LCD et un mur d'images LED, où ils divergent selon dix critères, lequel convient à une salle de conseil, un hall, une salle de contrôle ou un studio, et comment leur coût se compare sur sept à dix ans.

## Qu'est-ce qu'un mur d'images ?

Un mur d'images est un ensemble d'unités d'affichage disposées bord à bord, en lignes et en colonnes, et pilotées par un processeur afin de se comporter comme un seul grand écran. Le terme couvre tout, d'un assemblage 2×2 derrière un comptoir d'accueil à un mur d'exploitation de vingt mètres, et la technologie à l'intérieur des unités sépare les deux familles. Dans un mur d'images LCD, l'unité est un panneau industriel de 46–55 pouces ; dans un mur d'images LED, c'est un caisson, généralement de 600×337,5 mm, construit à partir de modules LED. Cette seule différence entraîne tous les critères ci-dessous.

Le chemin du signal est similaire dans les deux. Des sources telles que des PC, des codecs de visioconférence, des clients SCADA et des flux de caméras entrent dans un processeur de mur d'images, qui divise l'image à la résolution combinée du mur et l'envoie aux unités : un signal par panneau en LCD, une seule chaîne de données de la carte d'envoi aux cartes de réception en LED. Dans une salle de contrôle, le processeur mérite autant d'attention que l'affichage.

## Mur d'images LCD : fonctionnement, points forts et le problème des bordures

Un mur d'images LCD est construit à partir de panneaux industriels de 46, 49 ou 55 pouces à bordures fines et homologués en service continu 24/7, montés en assemblages tels que 2×2, 3×3 ou 4×4. Ces panneaux ne sont pas des téléviseurs grand public : ils portent un rétroéclairage plus puissant, généralement 500–700 nits, un polariseur résistant à la chaleur, un étalonnage par panneau et une électronique qui réduit la rémanence. Derrière chaque panneau se trouve un support escamotable pour la maintenance par l'avant, de sorte qu'un seul panneau peut être remplacé dans une niche fermée sans démonter le mur.

1.   0 1 Coût d'entrée plus faible : un mur 2×2 de panneaux de 55 pouces entre bien en dessous d'un mur LED fine-pitch de même taille.
2.   0 2 Haute résolution : chaque panneau est Full HD ou 4K, donc un mur 3×3 atteint 5 760×3 240 pixels, utile pour le texte et les petites fenêtres lues de près.
3.   0 3 Approvisionnement et service faciles : les panneaux sont des produits standards, la plupart des intégrateurs les connaissent et les remplacements sont rapides à sourcer.
4.   0 4 Affichage multi-sources naturel : une source par panneau est trivial via une sortie matricielle.

### Le problème des bordures

La faiblesse inévitable d'un mur d'images LCD est la jonction où les panneaux se rencontrent. La largeur combinée de deux bordures adjacentes va de 0,44 mm sur les panneaux actuels les plus fins à 1,8 mm sur la classe courante et 3,5 mm sur les générations plus anciennes. À trois mètres, en regardant une vidéo plein écran, la ligne est facile à pardonner. Dès qu'une carte, un tableur ou un visage en visioconférence tombe dessus, l'œil va vers la jonction et y reste. Les panneaux à bordures ultra-fines réduisent l'écart mais ne peuvent pas le supprimer ; un mur d'images LCD sans raccord est physiquement impossible.

### Ce qui se passe au fil des années

La deuxième faiblesse apparaît avec le temps. Les rétroéclairages LCD vieillissent à des rythmes légèrement différents, donc après cinq ans d'utilisation continue, des tuiles individuelles d'un mur 3×3 peuvent être visiblement plus sombres ou plus chaudes que leurs voisines, et un panneau de remplacement se distingue comme plus lumineux que les autres. Dans les salles de contrôle affichant des dispositions statiques, la rémanence varie aussi de tuile en tuile. Cela peut être géré par réétalonnage, mais sur un mur 24/7, c'est la ligne cachée dans le coût de possession.

## Mur d'images LED : fine-pitch, COB et une surface sans raccord

Un mur d'images LED est construit à partir de caissons, chacun portant ses propres modules LED, alimentation et carte de réception. Pour le travail d'entreprise en intérieur, le pas de pixel est choisi entre P0,9 et P1,9 ; à 1,2 mm et en dessous, les modules sont de plus en plus COB ou flip-chip COB, les puces LED étant montées directement sur la carte sous une seule couche de résine plutôt que dans des packages individuels. Le résultat est un plan continu sans ligne visible entre les caissons : un 2×2, un 4×3, un bandeau 9:1 ou un angle enveloppé reposent tous sur la même surface ininterrompue.

Les chiffres sont différents eux aussi. Le LED fine-pitch intérieur délivre 600 à 1 500 nits et s'atténue selon la pièce ; la durée de vie LED est donnée pour 100 000 heures à mi-luminosité, plus de onze ans d'exploitation 24/7. La profondeur des caissons est descendue sous 30 mm, et les caissons à maintenance avant permettent de remplacer modules et alimentations magnétiquement depuis l'avant. Dans la gamme PixiaTech, le XR Ultra couvre 0,78–1,5 mm pour les salles de conseil et de contrôle, le XR Fine 1,2–3,1 mm pour les halls et les murs plus grands, et le XR Seamless propose des caissons à fixation VESA pour les murs de salle de contrôle. Les types de packages sont comparés dans notre guide COB et SMD.

Le LED a ses propres compromis. Le coût au mètre carré est plus élevé que le LCD, et il grimpe fortement en dessous de 1,2 mm. La résolution en pixels est plus faible que le LCD : un mur de 3 mètres de large à 1,2 mm fait environ 2 500 pixels de large, là où un mur LCD de 55 pouces de même largeur en offre 3 840. Cela compte pour du texte de 9 points lu à un mètre et pas du tout pour une présentation lue à trois mètres. L'installation nécessite un sous-châssis acier et un étalonnage, et un module endommagé est remplacé par un technicien formé plutôt qu'échangé comme un panneau.

> Une fois que l'œil a trouvé la jonction, il ne voit plus jamais seulement l'image.

## Mur d'images LED contre mur d'images LCD : dix critères comparés

Les dix critères ci-dessous résument les questions à poser lors d'une demande de devis pour une salle de conseil ou de contrôle. Des valeurs typiques sont données pour chacun ; dans votre propre projet, la distance de vision, la lumière ambiante et les heures de fonctionnement décident du poids de chacun.

1.   0 1 Absence de raccord : le LCD a un raccord de 0,44–1,8 mm à chaque jonction ; le LED n'en a aucun.
2.   0 2 Luminosité : LCD 500–700 nits ; LED 600–1 500 nits, décisif dans les halls éclairés par le jour.
3.   0 3 Résolution : le LCD donne 4K par panneau ; le LED dépend du pas, et 1,2–1,5 mm suffit à 3–5 m.
4.   0 4 Uniformité des couleurs dans le temps : le LCD dérive tuile par tuile ; le LED est étalonné par caisson et vieillit comme une seule surface.
5.   0 5 Fiabilité 24/7 : les rétroéclairages LCD sont donnés pour 50 000–60 000 heures ; le LED 100 000 heures avec alimentation redondante.
6.   0 6 Profondeur et installation : le LCD à supports escamotables nécessite 80–120 mm ; les caissons LED font moins de 30 mm et s'encastrent à ras.
7.   0 7 Chaleur et bruit : le LCD comporte des ventilateurs et la chaleur du rétroéclairage dans chaque panneau ; le LED fine-pitch fonctionne sans ventilateur.
8.   0 8 Puissance : un panneau LCD de 55 pouces consomme 150–250 W ; le LED fine-pitch 100–200 W par m² en pratique, 500–700 W en pointe.
9.   0 9 Coût total sur 7–10 ans : le LCD est moins cher à l'achat et ajoute un renouvellement de panneaux ; le LED coûte plus cher à l'achat et dure une seule vie.
10.   0 10 Souplesse de contenu : le LCD est limité aux multiples de 16:9 ; le LED s'adapte à n'importe quel rapport et peut se courber.

### Absence de raccord et résolution vont ensemble

Ces deux critères s'équilibrent : le LCD offre plus de pixels mais les divise par des jonctions, le LED offre moins de pixels d'un seul tenant. La distance de vision tranche. Dans une salle de conseil vue de 3–5 mètres, un pas de 1,2–1,5 mm est en dessous de ce que l'œil peut résoudre, donc le nombre de pixels plus faible du LED est invisible tandis que les jonctions du LCD ne le sont pas. À une console d'opérateur lue à 1,5 mètre, la situation s'inverse, et le choix devient du LED à 0,9 mm et plus fin ou un seul grand panneau LCD.

### Luminosité et lumière ambiante

Une salle de conseil a besoin de 350–450 nits étalonnés et les deux technologies le délivrent. L'écart s'ouvre dans les halls vitrés et les bureaux ouverts éclairés par le jour : le plafond de 500–700 nits d'un panneau LCD, sa surface brillante et ses reflets le laissent délavé à midi, tandis qu'un mur LED de 1 000–1 500 nits s'atténue selon la pièce et descend à 300 nits le soir. Un capteur de lumière ambiante est essentiel sur les deux systèmes, mais la plage avec laquelle il peut travailler est bien plus large sur le LED.

### Couleur, durée de vie et service au fil des années

Dans un environnement 24/7, le problème le plus cher est celui qui apparaît la cinquième année, pas le premier jour. Les rétroéclairages LCD atteignent la mi-luminosité vers 50 000–60 000 heures et chaque panneau vieillit à son propre rythme ; la durée de 100 000 heures du LED s'applique au mur entier d'un coup et les données d'étalonnage par caisson résident dans le processeur. Une tuile LCD défaillante est remplacée comme un panneau entier ; sur LED, la même panne est généralement un seul module ou une alimentation, échangé par l'avant par un technicien formé. Sur les deux, un stock de pièces de rechange a sa place dans le contrat.

### Profondeur, chaleur et puissance

Pour les projets qui veulent un mur à ras, les caissons LED de moins de 30 mm sont décisifs ; les systèmes à supports LCD nécessitent 80–120 mm pour le mécanisme escamotable et le flux d'air derrière les panneaux. La chaleur et le bruit sont les critères les plus souvent ignorés dans les petites pièces : les ventilateurs et rétroéclairages de neuf panneaux de 55 pouces sont audibles dans une salle de conseil silencieuse, alors que le LED fine-pitch fonctionne sans ventilateur. En puissance, comparée au mètre carré à la luminosité d'un bureau, les deux sont plus proches que ne le suggèrent les fiches techniques ; la valeur de pointe du LED paraît élevée, mais la consommation réelle doit être mesurée aux 30–40 % de luminosité auxquels il fonctionnera.

## Scénarios : salle de conseil, hall, salle de contrôle et diffusion

### Salle de conseil, vision à 3–5 m

Une salle de conseil de 20–40 m² a deux options réalistes : des LCD de 55 pouces en assemblage 2×2, environ 2,4×1,4 m, ou un mur LED de 3–3,6 m de large à pas de 1,2–1,5 mm. Si la pièce accueille des présentations et des visioconférences et que la table se trouve à moins de trois mètres, la jonction LCD passe au centre de l'image, exactement là où se trouve souvent le visage d'un présentateur. Dans les projets PixiaTech, ces pièces vont de plus en plus au XR Ultra à 1,2 mm ou au XR Fine à 1,5 mm, et les unités LED tout-en-un de classe 165 pouces s'installent en un jour. Le LCD reste défendable quand le budget est serré et que le contenu est une seule source plein écran.

### Hall et réception

Dans un hall, le spectateur se déplace : devant le mur à deux mètres, en travers de l'atrium à dix, généralement en plein jour. Ici, les jonctions du LCD, sa luminosité plus faible et ses multiples 16:9 deviennent trois handicaps distincts. Le LED à 1,5–1,9 mm permet à un bandeau 9:1, un panneau vertical ou un angle enveloppé de faire partie de l'architecture, et une fois que le contenu est du motion design plein écran, le nombre de pixels cesse d'importer. Notre guide des murs LED d'entreprise couvre en détail la proportion, la profondeur et le contenu pour les halls.

### Salle de contrôle, 24/7

La salle de contrôle est l'endroit où la décision est la plus débattue. Pendant des années, ce fut le territoire du LCD : de nombreuses sources discrètes telles que des écrans SCADA, des caméras et des cartes se répartissaient proprement une fenêtre par panneau, et le prix était juste. Aujourd'hui le LED est choisi pour son uniformité et sa durée de service : un opérateur qui regarde le mur dix heures par poste veut une seule surface après cinq ans, pas neuf tuiles de teintes différentes, et la durée de 100 000 heures avec alimentation redondante abaisse le coût total d'un mur 24/7.

La réserve honnête : quand le budget est serré et que le contenu est vraiment de nombreuses petites fenêtres, un mur LCD 3×3 ou 4×4 derrière un bon processeur fonctionne encore, les jonctions tombant entre les fenêtres plutôt qu'à travers elles. Le XR Seamless et le XR Ultra sont les options LED à maintenance avant de cette catégorie, entre 0,9 et 1,5 mm.

### Diffusion et studio

Sur tout mur face caméra, les jonctions du LCD et la fréquence de rafraîchissement du LED tranchent la question. Pour un fond de studio, un mur de salle de rédaction ou une salle de diffusion d'entreprise, le LED au-dessus de 3 840 Hz avec niveaux de gris 16 bits est la seule option réaliste : les jonctions du LCD sont visibles à la caméra et la luminosité des panneaux est insuffisante sous l'éclairage de studio. La série XR Studio est conçue pour cet usage.

## Prix des murs d'images : ce qui les détermine et leur évolution sur 7–10 ans

Les prix des murs d'images sont demandés en premier et réglés en dernier, car le chiffre s'assemble à partir de décisions plutôt que de se lire sur une liste. Sept variables le déterminent : le pas de pixel, car des modules plus fins coûtent plus cher au mètre carré ; la taille finie de la surface ; la classe de luminosité exigée par la pièce ; le cycle de service, car un mur qui ne s'éteint jamais a besoin d'alimentation redondante et d'un contrat de service ; la structure de support, qu'il s'agisse d'un ensemble de supports, d'un sous-châssis acier ou d'une niche encastrée ; la couche de traitement et de contrôle ; et le stock de pièces de rechange conservé sur site. PixiaTech chiffre chaque projet selon ces sept éléments, jamais à partir d'un tarif de catalogue.

À première vue, le LCD est l'engagement le plus léger, et sur les petits murs il le reste : un assemblage LCD 2×2 entre bien en dessous d'un mur LED fine-pitch de même taille. L'écart se referme sur une fenêtre de 7–10 ans. Sur un mur LCD 24/7, les rétroéclairages atteignent la mi-luminosité à 50 000–60 000 heures, six à sept ans de service continu, et les panneaux sont alors renouvelés par ensemble plutôt qu'un à la fois, car une seule nouvelle tuile se distingue plus lumineuse que ses voisines. Ce second achat, les visites de réétalonnage entre-temps et 150–250 W par panneau sont ce que la première comparaison omet.

Le LED dépense sa possession ailleurs. La surface est donnée pour 100 000 heures à mi-luminosité, donc la même décennie est une seule vie au lieu de deux ; une panne se règle en échangeant un module ou une alimentation par l'avant plutôt qu'un panneau entier ; et l'étalonnage par caisson garde le mur d'une seule couleur en vieillissant. En règle générale, sur les murs 3×3 et plus fonctionnant 24/7, le LED dépasse le LCD en coût total entre la cinquième et la septième année. Sur un mur 2×2 de salle de conseil fonctionnant huit heures par jour, le LCD peut rester en tête pendant les dix ans, et la décision repose alors sur les jonctions et la qualité d'image.

## Quand un mur d'images LCD reste le bon choix

Recommander le LED sans condition ne serait pas honnête. Un mur d'images LCD reste la bonne réponse quand le mur fait moins de trois mètres de large et montre une présentation à source unique, quand le budget se situe en dessous du niveau d'entrée du LED, quand l'installation est temporaire ou sera déplacée dans les deux ans, quand le contenu est du texte dense lu de près, ou quand un mur LCD existant est étendu. Dans ces cas, choisissez une série de panneaux à bordures ultra-fines, 700 nits, homologués 24/7, et un bon processeur, acceptez les jonctions et investissez le budget dans le contenu et le contrôle.

Inversement, si le mur fait plus de trois mètres, si le spectateur se déplace, si la pièce est éclairée par le jour, si une caméra est impliquée, si le mur fonctionnera 24/7 ou si l'architecture veut une surface à ras, un mur d'images LED n'est pas seulement l'option la plus belle mais aussi la plus économique sur dix ans.

## Un court guide de décision

1.   0 1 Source unique, moins de 3 m de large, huit heures par jour, budget serré : LCD 2×2.
2.   0 2 Salle de conseil à 3–5 m, visioconférences et présentations : LED 1,2–1,5 mm (XR Ultra ou XR Fine).
3.   0 3 Hall éclairé par le jour, spectateurs en mouvement et rapport architectural : LED 1,5–1,9 mm (XR Fine).
4.   0 4 Salle de contrôle 24/7, uniformité et durée de service avant tout : LED à maintenance avant 0,9–1,5 mm (XR Seamless ou XR Ultra).
5.   0 5 Salle de contrôle à nombreuses petites fenêtres et budget limité : LCD 3×3 ou 4×4 derrière un processeur puissant.
6.   0 6 Studio ou salle de diffusion face caméra : LED au-dessus de 3 840 Hz (XR Studio).

PixiaTech a installé les deux technologies dans des salles de conseil, des halls et des salles de contrôle à Istanbul et peut préparer une comparaison indépendante à partir des dimensions de votre pièce et de votre plan de contenu. Pour le choix du pas, voir notre guide du pas de pixel ; pour l'architecture de la pièce, notre guide des murs LED d'entreprise ; et pour demander une visite technique et un devis, décrivez votre projet sur la page Démarrer un projet.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Combien coûte un mur d'images ?`,
        answer: `Un mur d'images se chiffre, il ne se catalogue pas. Le coût est fixé par le pas de pixel, la taille finie de la surface, la luminosité exigée par la pièce, le cycle de service, la structure de support, la couche de traitement et de contrôle, et la couverture de service et de pièces de rechange. PixiaTech chiffre chaque projet après une visite technique, donc envoyez les dimensions de votre pièce, la distance de vision et les heures de fonctionnement quotidiennes.`,
      },
      {
        question: `Combien de temps dure un mur d'images LED ?`,
        answer: `Le LED intérieur fine-pitch est donné pour 100 000 heures à mi-luminosité : environ onze ans d'exploitation 24/7, ou plus de 25 ans à dix heures par jour. Les alimentations et les cartes de réception peuvent être remplacées après 8–10 ans, mais la surface LED dure une seule vie. Fonctionner à 30–40 % de luminosité de bureau et garder les caissons au frais prolonge encore la durée.`,
      },
      {
        question: `Quel pas de pixel pour un mur d'images de salle de conseil ?`,
        answer: `Pour les salles de conseil vues de 3–5 mètres, un pas de pixel de 1,2–1,5 mm suffit ; passez à 0,9 mm si la table se trouve à moins de deux mètres ou si des tableurs denses sont affichés. Dans les pièces utilisées pour la visioconférence, une fréquence de rafraîchissement supérieure à 3 840 Hz et une luminosité étalonnée de 350–450 nits comptent autant que le pas lui-même.`,
      },
      {
        question: `Un mur d'images LCD peut-il être sans raccord ?`,
        answer: `Non. Même les panneaux industriels les plus fins laissent un raccord combiné de 0,44–0,9 mm là où deux panneaux se rencontrent, et 1,8 mm sur la classe courante. La ligne se cache dans une vidéo plein écran mais apparaît dès qu'une carte, un tableur ou un visage la traverse. Une surface vraiment sans raccord n'est possible qu'avec un mur d'images LED, où les caissons se joignent sans frontière visible.`,
      },
      {
        question: `LED ou LCD pour une salle de contrôle ?`,
        answer: `Pour les murs qui fonctionnent 24/7, sont regardés pendant des heures d'affilée et doivent rester uniformes pendant des années, le LED est préféré : durée de 100 000 heures, étalonnage par caisson et maintenance avant. Pour les salles qui montrent de nombreuses sources discrètes dans des fenêtres séparées avec un budget limité, un mur LCD 3×3 ou 4×4 derrière un processeur puissant reste une solution valable.`,
      },
      {
        question: `Qu'est-ce qu'un mur d'images ?`,
        answer: `Un mur d'images est un ensemble d'unités d'affichage, panneaux LCD ou caissons LED, disposées bord à bord et pilotées par un processeur afin d'agir comme un seul grand écran. Il est utilisé dans les salles de conseil, les halls, les salles de contrôle et les studios de diffusion, et le type d'unité détermine ses jonctions, sa luminosité, sa durée de vie et son coût.`,
      },
    ],
  },
  'event-led-screen-size': {
    contentFr: `La taille d'un écran LED de scène est la décision la plus chère et la moins réversible d'un budget d'événement : les mètres carrés, le nombre de caissons, le traitement, l'accrochage et le transport en découlent tous. Pourtant, la plupart des organisateurs devinent la taille à partir du budget ou d'une photographie de la salle. La bonne taille se calcule à partir de trois nombres : le spectateur le plus éloigné, le spectateur le plus proche et le contenu que vous montrerez. Ce guide donne la règle pour les mariages, les lancements d'entreprise, les concerts, les stands de salon et les tables rondes, arrondit les exemples aux modules de caissons, et explique ce que la taille choisie signifie pour le pas de pixel, le poids et la puissance.

## Les trois nombres derrière la taille d'un écran LED de scène

Le premier nombre est la distance de l'écran au spectateur le plus éloigné : la dernière table d'une salle de bal, le dernier rang d'une salle de conférence, le bout de la zone debout d'un concert en plein air. Le deuxième est le spectateur le plus proche, car le pas de pixel est fixé par la proximité, pas par la distance. Le troisième est le type de contenu : vidéo plein cadre, diapositives très textuelles, caméra en direct et boucle de logo décorative se lisent tous différemment depuis le même siège sur le même écran. Toute taille annoncée sans ces trois nombres est une supposition.

1.   0 1 Spectateur le plus éloigné : mesurez-le sur le plan ou parcourez-le à pied, et prenez le cas le plus défavorable avant que le plan de salle ne soit finalisé.
2.   0 2 Spectateur le plus proche : l'avant-scène, la table d'honneur ou, en salon, l'allée ; cette valeur fixe le pas de pixel.
3.   0 3 Type de contenu : vidéo animée, présentation très textuelle, caméra en direct (IMAG) ou fond purement décoratif.

## La règle de hauteur : la distance la plus éloignée divisée par 8

La règle de départ la plus utile pour les écrans de scène lie la hauteur de l'écran à la distance de vision la plus éloignée. Pour un contenu vidéo et piloté par l'image, la hauteur de l'écran doit être d'un huitième de la distance la plus éloignée ; pour des présentations avec texte et tableaux, d'un sixième. La règle donne une hauteur plutôt qu'une largeur, car l'œil juge la lisibilité par l'angle vertical ; la largeur se déduit ensuite du rapport d'image. Ces règles viennent du cinéma et des salles de conférence et s'appliquent à l'identique au LED.

## Arrondir aux modules de caissons : 500 × 500 et 500 × 1 000 mm

Les écrans LED de location sont construits à partir de caissons de 500 × 500 mm et 500 × 1 000 mm, donc les tailles se présentent en multiples d'un demi-mètre. Un écran de 6 × 3,5 m, c'est 12 × 7 = 84 caissons de 500 × 500 mm, ou 12 colonnes de caissons de 500 × 1 000 mm avec une rangée de demi-hauteur en bas. Un écran de 4 × 2,5 m, c'est 8 × 5 = 40 caissons ; un écran de concert de 12 × 7 m, c'est 24 × 14 = 336. Parler en caissons plutôt qu'en mètres est le moyen le plus rapide de partager un langage avec le fournisseur.

Une taille telle que 5,3 × 3,2 m, qui ne tombe pas sur le module, est soit agrandie au module suivant, soit finie avec du masquage, un cadre et un contenu rogné. La seconde voie coûte plus cher : caissons découpés sur mesure, contenu coupé sur les bords et un montage plus long. Lors d'un événement, la bonne décision est presque toujours d'arrondir au supérieur. La résolution transmise au concepteur de contenu est aussi déduite de la taille arrondie ; si le contenu n'est pas produit pour le nombre réel de pixels de l'écran, les bords sont coupés ou l'image est étirée.

## Rapport d'image et contenu : 16:9 ou ultra-large

Le 16:9 est le rapport sûr, car les caméras, les logiciels de présentation et les sources vidéo le produisent tous. Pour les mariages, les tables rondes et la plupart des lancements, du 16:9 ou proche porte le contenu sans aucune adaptation. Les lancements et les concerts utilisent souvent des fonds en 32:9 ou plus larges qui couvrent toute la scène, placent le présentateur dans l'image et paraissent plus saisissants qu'un simple rectangle. Un écran ultra-large exige cependant un contenu sur mesure : une vidéo 16:9 sur un écran large laisse des bandes vides sur les côtés ou se fait rogner.

La résolution est le produit de la taille et du pas de pixel. Un écran de 6 × 3,5 m donne 2 304 × 1 344 pixels en P2,6 et 1 536 × 896 en P3,9 ; le premier porte un contenu Full HD pixel pour pixel, le second le met légèrement à l'échelle, ce qui est invisible depuis 28 m. Un écran de concert de 12 × 7 m en P3,9 fait 3 072 × 1 792 pixels et utilise une source 4K mise à l'échelle. Donnez au concepteur les dimensions en pixels de l'écran au moins deux semaines avant l'événement ; produire le contenu pour l'écran est bien moins cher qu'agrandir l'écran pour le contenu.

## Taille d'écran LED de scène par type d'événement

Les exemples ci-dessous appliquent la règle à des lieux typiques ; chacun donne la distance la plus éloignée, la taille d'écran, le nombre de caissons et le pas de pixel. Si votre lieu diffère, changez seulement la distance la plus éloignée et refaites le calcul. Les tailles sont des points de départ pour un devis, pas un substitut à une visite technique.

### Mariage : 200 invités, salle de bal d'hôtel

Avec la dernière table à 18–20 m, un écran de 4 × 2,5 m (8 × 5 caissons, 10 m²) suffit ; le P2,6 est choisi car la table d'honneur se trouve à 3 m de la scène. Un écran de mariage montre tour à tour la caméra en direct, un diaporama photo et une animation décorative, et le 16:9 porte les trois. Un écran de 3 × 2 m paraît généralement petit dans une salle de 300 invités, tandis qu'un écran de 5 × 3 m écrase la scène et vole l'arrière-plan de chaque photographie d'une salle de 200 invités.

### Lancement d'entreprise : 500 invités, salle de conférence

Avec le dernier rang à 28 m, l'écran principal est de 6 × 3,5 m (12 × 7 caissons, 21 m²) ; P2,6 pour des premiers rangs qui étudieront le détail produit, P3,9 si le budget est serré. Les lancements ajoutent généralement deux écrans latéraux de 3 × 2 m en P2,6 afin que le flux caméra du présentateur et les diapositives aient chacun leur surface. Les couleurs de marque dépendent de l'étalonnage du processeur et d'un équilibrage des blancs réalisé avec l'éclairage de scène allumé ; notre guide de mise en place d'un écran LED de location liste ces contrôles.

### Concert : 5 000 personnes, en plein air

Avec la pelouse s'achevant à 56 m, l'écran principal est de 12 × 7 m (24 × 14 caissons, 84 m²) plus deux écrans latéraux de 6 × 4 m (12 × 8 caissons, 24 m² chacun) ; P3,9 sur l'écran principal, P3,9–P4,8 sur les côtés. La foule à la barrière se tient à 6–8 m de l'écran, donc rien de plus fin n'est nécessaire. En extérieur, 4 000–5 000 nits et des caissons IP65 sont obligatoires ; le XR Arena et le XR Event sont nos séries de location conçues pour des scènes de cette échelle. Les calculs de charge de vent et d'accrochage comptent autant que le poids de l'écran à cette taille.

### Stand de salon : 3 × 3 m au CNR Expo ou à Tüyap

En salon, le spectateur le plus éloigné est de l'autre côté de l'allée à 6–8 m et le plus proche est à l'intérieur du stand à 1–1,5 m, donc c'est le mur du stand, et non la distance, qui fixe la taille. Un écran de 3 × 2 m (6 × 4 caissons) tient sur le mur arrière d'un stand de 3 × 3 m, et la proximité côté allée appelle du P1,9 ou P2,6. Quand un écran mural dépasse le budget, deux Poster LED Display ou un XR Column dans les angles sont à la fois plus transportables et moins chers. Un écran de salon boucle une vidéo produit ; 800–1 000 nits suffisent sous l'éclairage du hall.

### Table ronde et conférence : 150–300 places

Le contenu d'une table ronde est très textuel : noms des intervenants, diapositives, graphiques. Avec le dernier rang à 22 m, 22 / 6 = 3,7 m suggère 3,5–4 m de hauteur et 6–7 m de largeur ; si la hauteur de scène ne le permet pas, un écran principal de 5 × 3 m avec deux écrans latéraux de 2 × 1,5 m fonctionne mieux. Le pas de pixel est du P2,6 si le premier rang se trouve à 4 m. Un corps de texte inférieur à 12 points ne peut pas être lu depuis les premiers rangs à aucun pas ; ce problème se règle par le contenu, pas par l'écran.

## Fond de scène ou écrans latéraux

L'écran de fond est le décor : marque, animation, ambiance. Les écrans latéraux (IMAG, grossissement d'image) montrent la personne agrandie sur scène et sont nécessaires à presque tout événement de plus de 300 personnes, car un flux caméra envoyé sur le mur arrière se retrouve directement derrière l'orateur. La règle est simple : le fond porte le contenu, les écrans latéraux portent la caméra. La hauteur des écrans latéraux suit la même règle du divisé par 8, mais avec la distance du spectateur le plus éloigné à cet écran latéral ; en pratique, elle représente environ la moitié de la hauteur de l'écran principal.

> C'est la salle qui fixe la taille de l'écran ; le budget ne change que le pas de pixel et le nombre d'écrans latéraux.

## Le pas de pixel à partir du spectateur le plus proche

La règle des dix appliquée dans notre guide du pas de pixel vaut aussi ici : le pas de pixel en millimètres égale la distance minimale de vision confortable en mètres. Le P2,6 se lit nettement depuis environ 2,6 m et le P3,9 depuis environ 3,9 m ; la meilleure image se voit à deux à trois fois cette distance. Si l'avant-scène est à 3 m, le P2,6 est juste ; à 5 m, le P3,9 suffit ; à 8 m, le P4,8 ne fait aucune différence visible. Diviser le pas par deux quadruple le nombre de LED et augmente sensiblement la location, donc choisissez le pas aussi fin que l'exige le spectateur le plus proche, et pas plus fin.

En intérieur, le XR Essential et le XR Flex construisent les écrans de mariage, de lancement et de table ronde à 1,9–3,9 mm, et les angles de courbure verrouillés du XR Flex servent les fonds courbes. Pour les concerts en plein air, le XR Arena et le XR Event existent à 2,6–4,8 mm avec des caissons IP65 et une luminosité élevée. Là où des artistes marchent sur l'écran, le XR Floor ajoute des caissons porteurs au même système. La série ne change pas la taille : le même écran de 6 × 3,5 m est le même nombre de caissons, quelle que soit la série qui le construit.

## Hauteur de scène, lignes de vue, accrochage et empilage au sol

Le bord inférieur de l'écran doit se situer au moins à 1,2–1,5 m au-dessus du plancher de scène ; sinon, un présentateur debout, les tables de devant et les compositions florales masquent le tiers inférieur de l'image. Cette hauteur se prend sur le plafond : dans une salle de bal avec un plafond de 5 m, une scène de 0,8 m, 1,2 m de dégagement et un écran de 3 m totalisent 5 m, ne laissant aucune place pour l'accrochage. Dans les salles basses, la règle de hauteur doit céder et les écrans latéraux compensent la différence.

Un écran est soit suspendu à un truss, soit empilé au sol depuis le plancher. L'empilage au sol raccourcit le montage et abaisse le coût, mais au-delà de trois rangées de caissons de 500 × 1 000 mm il nécessite un contreventement arrière et du lestage, et il consomme de la profondeur de scène. La suspension dégage les lignes de vue et est la seule méthode saine pour les grandes tailles ; la charge du plafond, les certificats de points d'accrochage et la validation d'un gréeur se planifient aussi tôt que la taille elle-même. En extérieur, un écran de 7 m de haut ne se construit pas sans calcul de charge de vent.

## Poids et puissance pour la taille d'écran LED de scène choisie

Une fois la taille fixée, le poids et la puissance suivent presque automatiquement. Un caisson de location 500 × 500 mm pèse environ 7–9 kg et un caisson 500 × 1 000 mm 14–18 kg, avec en plus les barres de tête, le câblage et le processeur. La consommation moyenne est de 150–250 W/m² en intérieur et de 250–400 W/m² en extérieur, avec des pointes d'environ deux à trois fois cela. L'alimentation électrique du lieu est planifiée pour la pointe ; ce qui reste va à l'éclairage et au son.

1.   0 1 Écran de mariage de 4 × 2,5 m (10 m²) : 40 caissons, environ 320–360 kg, 2–2,5 kW en moyenne, 5–6 kW en pointe.
2.   0 2 Écran de lancement de 6 × 3,5 m (21 m²) : 84 caissons, environ 700 kg, 4–5 kW en moyenne, 10–12 kW en pointe.
3.   0 3 Écran de concert extérieur de 12 × 7 m (84 m²) : 336 caissons, environ 3 tonnes, 25–30 kW en moyenne, jusqu'à 60 kW en pointe ; écrans latéraux non compris.
4.   0 4 Écran de salon de 3 × 2 m (6 m²) : 24 caissons, environ 200 kg, 1–1,5 kW en moyenne ; fonctionne depuis une alimentation monophasée 16 A.

La location se facture au mètre carré par jour, et les fourchettes du marché pour l'intérieur P2,6–P3,9 et l'extérieur P3,9–P4,8 varient jusqu'au double selon que le montage, le traitement et un technicien sont inclus. Ne comparez les devis que lorsque la taille de l'écran, le nombre de caissons, le pas de pixel et le périmètre sont identiques ; notre guide de location d'écrans LED couvre les questions à poser avant de signer.

Envoyez-nous la distance à votre dernier rang, la distance à l'avant-scène et le contenu que vous prévoyez de montrer ; l'équipe PixiaTech arrondit la taille aux modules de caissons et renvoie une proposition avec le pas de pixel, l'accrochage et la puissance. Le court formulaire de la page Démarrer un projet suffit.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Quelle taille doit avoir un mur LED pour un mariage ?`,
        answer: `Divisez la distance de la scène à la dernière table par 8 : une salle de 20 m nécessite 2,5 m de hauteur, soit en 16:9 un écran de 4 × 2,5 m. Les salles de 100–150 invités prennent en général du 3 × 2 m et les grandes salles de bal de 300 invités du 5 × 3 m. Choisissez du P2,6 si la table d'honneur se trouve à 3 m ; un pas plus fin n'apporte rien à un mariage.`,
      },
      {
        question: `Quelle est la meilleure taille d'écran LED pour un stand de salon ?`,
        answer: `Un écran de 3 × 2 m tient sur le mur arrière d'un stand de 3 × 3 m, et comme les visiteurs regardent depuis 1–2 m dans l'allée, il nécessite un pas de P1,9–P2,6. Dans les stands plus petits ou avec un budget serré, un Poster LED Display de 640 × 1 920 mm ou un XR Column se place dans un angle, s'installe en une heure et voyage de salon en salon.`,
      },
      {
        question: `Que signifie un caisson 500 × 500 ?`,
        answer: `Les écrans LED de location sont construits à partir de caissons en aluminium de 500 × 500 mm ou 500 × 1 000 mm, chacun portant ses propres modules, alimentation et carte de réception. Les tailles d'écran se présentent donc en multiples d'un demi-mètre : un écran de 4 × 2,5 m, c'est 8 × 5 = 40 caissons. Un caisson P2,6 contient 192 × 192 pixels et un caisson P3,9 128 × 128.`,
      },
      {
        question: `Que se passe-t-il si l'écran est trop grand ?`,
        answer: `Les premiers rangs tournent la tête pour embrasser toute l'image, les visages du flux caméra prennent une échelle contre nature et la personne sur scène disparaît devant l'écran. Le nombre de caissons, le poids, la puissance et le coût de location augmentent aussi sans bénéfice. Ne dépassez pas la règle de hauteur de plus de 20 pour cent ; au-delà, c'est un choix décoratif et il faut le budgéter comme tel.`,
      },
      {
        question: `Le P3,9 suffit-il pour un concert ?`,
        answer: `Oui. Aux concerts en plein air, la barrière se trouve à 6–8 m de l'écran et le P3,9 se lit nettement depuis environ 3,9 m ; un écran principal de 12 × 7 m en P3,9 donne 3 072 × 1 792 pixels. Dans les salles intérieures et les concerts en club où l'avant-scène est à 3 m, le P2,6 est préféré, et le P4,8 suffit pour les écrans latéraux vus de l'arrière.`,
      },
      {
        question: `De quelles informations ai-je besoin pour calculer la taille d'un écran LED de scène ?`,
        answer: `Trois nombres suffisent : la distance de l'écran au spectateur le plus éloigné, la distance au spectateur le plus proche et le type de contenu (vidéo, présentation ou caméra en direct). Ajoutez la hauteur sous plafond, la hauteur de scène et la possibilité d'accrochage, et la taille, le pas de pixel et la méthode de montage peuvent être fixés en une réunion. Un plan et quelques photographies accélèrent le calcul.`,
      },
    ],
  },
  'outdoor-led-buying-checklist': {
    contentFr: `Un écran LED extérieur s'achète une fois, puis vit dehors pendant huit à dix ans, entre le soleil d'été et la pluie d'hiver, de sorte que la spécification compte bien plus que pour n'importe quel écran intérieur. La plupart des pannes que l'on nous demande de réparer sur des installations existantes ont été décidées au stade du devis : le mauvais indice IP pour un dos exposé, une luminosité choisie sur une démonstration à l'ombre, une charpente acier que personne n'a calculée. Cette liste énumère les dix points à vérifier avant de signer, chacun avec un critère concret de réussite ou d'échec, suivis des erreurs les plus courantes et des questions à poser à chaque fournisseur.

## Pourquoi un écran LED extérieur est une autre catégorie de produit

Un mur LED intérieur vit à 22 °C dans un air sec, fonctionne à 800 nits et s'entretient depuis un couloir situé derrière lui. Un écran LED extérieur fonctionne de 5 000 à 10 000 nits, avec plusieurs fois le courant de commande et la chaleur, à l'intérieur d'un caisson scellé que la pluie, la poussière, l'air salin et des températures ambiantes de −20 à +50 °C ne peuvent pas pénétrer. Chaque point ci-dessous découle de cette différence, et chaque point est mesurable : un fournisseur a soit un rapport d'essai IP65, soit pas ; la luminosité est soit mesurée après étalonnage, soit annoncée brute ; et l'acier a soit un rapport statique signé, soit n'a pas été dimensionné.

## 1. Étanchéité : IP65 à l'avant et à l'arrière

L'indice IP indique la résistance du caisson à la poussière (premier chiffre) et à l'eau (deuxième chiffre). IP65 signifie étanche à la poussière et protégé contre les jets d'eau de toutes directions, le minimum pour une surface LED directement exposée aux intempéries. L'avant de tout écran LED extérieur doit être IP65. L'arrière doit également être IP65, sauf si les caissons se trouvent dans un boîtier entièrement fermé et couvert, ou contre un mur plein avec une cavité scellée ; dans ce cas, un IP54 à l'arrière est acceptable.

### Réussi ou échoué

Demandez le rapport d'essai IP du modèle exact de caisson, et non d'un produit voisin, et vérifiez qu'il porte sur le caisson assemblé, connecteurs d'alimentation et de données raccordés, car c'est là que l'eau entre le plus souvent. Réussi : IP65 à l'avant et à l'arrière avec un rapport d'un laboratoire indépendant. Réussi sous condition : IP65 à l'avant et IP54 à l'arrière, uniquement lorsque l'arrière est abrité. Échoué : IP65 à l'avant sans indice arrière précisé, ou un caisson intérieur proposé avec un habillage contre les intempéries. Les gammes XR Rugged et XR Vision de PixiaTech sont scellées sur les deux faces pour cette raison.

## 2. Luminosité : 5 000 nits minimum, davantage au soleil

La lumière du soleil direct sur une façade dépasse 100 000 lux. En dessous de 5 000 nits, un écran LED extérieur perd la bataille à midi : l'image est visible mais délavée, et le client demande pourquoi l'écran semble cassé en plein jour. Fixez 5 000 nits comme plancher pour les positions ombragées ou orientées au nord, et 7 000 à 10 000 nits pour les surfaces orientées au sud et à l'ouest en plein soleil. Notre guide de la luminosité extérieure détaille le raisonnement ; la décision d'achat se résume à un chiffre et à la façon dont il a été mesuré.

### Comment lire le chiffre de luminosité sur un devis

La luminosité doit être annoncée après étalonnage, au point blanc auquel l'écran fonctionnera réellement, avec la méthode de mesure nommée. Un chiffre LED brut avant étalonnage peut être de 20 à 30 % supérieur à ce que l'écran délivre une fois les couleurs harmonisées entre les caissons. Réussi : une luminosité étalonnée de 5 000 nits ou plus avec la méthode précisée, plus un chiffre de contraste mesuré en plein jour. Échoué : un simple chiffre de pointe sans méthode, ou une valeur de fiche technique qui chute dès qu'on demande ce qu'elle vaut après étalonnage.

## 3. Capteur de luminosité automatique et variation nocturne

Un écran qui tourne à 8 000 nits à minuit est une nuisance pour les voisins, une cible de plaintes auprès de la municipalité et une machine qui vieillit prématurément, car la durée de vie des LED diminue avec le courant de commande et la chaleur. Le contrôleur doit lire un capteur de lumière ambiante et ajuster la sortie en continu, avec une programmation qui plafonne la sortie nocturne à 30 à 40 % de la pointe. Réussi : un capteur fourni et monté là où il voit le même ciel que l'écran, plus une courbe de variation que vous pouvez modifier. Échoué : une luminosité manuelle uniquement, ou un capteur listé en option que personne n'a chiffrée.

## 4. Conception thermique : −20 à +50 °C sans climatisation

La chaleur est le second ennemi après l'eau. À pleine luminosité, un mètre carré de LED extérieur transforme la majeure partie de ses 600 à 800 W en chaleur, et cette chaleur doit quitter un caisson scellé sans laisser entrer les intempéries. Les caissons bien conçus évacuent la chaleur par le corps en aluminium et les ailettes arrière par convection ; les mauvais s'appuient sur des ventilateurs qui tombent en panne ou, pire, sur un boîtier climatisé qui devient un second système à entretenir. La fiche technique doit indiquer −20 à +50 °C ambiants, et le fournisseur doit pouvoir expliquer comment le caisson y parvient.

Réussi : une plage de fonctionnement annoncée d'au moins −20 à +50 °C, un refroidissement passif ou à ventilateurs scellés sans dépendance à une climatisation externe, et des exigences claires de dégagement et de ventilation derrière l'écran. Échoué : une plage qui s'arrête à +40 °C, qu'une façade sombre en août dépassera, ou des modules refroidis uniquement lorsque le boîtier arrière est climatisé. Demandez ce qui se passe au-dessus de la température nominale ; une réduction contrôlée de puissance est acceptable, un arrêt ne l'est pas.

## 5. Maintenance par l'avant ou par l'arrière

Chaque écran LED extérieur aura un jour besoin de remplacer un module. La question est de savoir si un technicien y accède par l'avant, l'écran restant au mur, ou par l'arrière, via un passage derrière les caissons. Les caissons à maintenance avant libèrent les modules et les alimentations par la face, grâce à des fixations magnétiques ou libérables à l'outil ; les caissons à maintenance arrière nécessitent 600 à 800 mm d'espace dégagé derrière eux et un moyen d'y accéder. Le choix décide de la profondeur de l'acier, de la largeur de la plateforme, de l'équipement de sécurité et du coût de chaque réparation future.

### Ce que l'accès de maintenance impose à l'acier

Un écran à maintenance avant peut se situer à 150 à 250 mm du mur sur un cadre léger ; un écran à maintenance arrière nécessite un passage, des garde-corps et souvent une échelle ou une trappe, ce qui ajoute structure, poids et coût. Sur une façade sans accès à l'arrière, la maintenance avant est la seule réponse praticable ; sur un pylône autoportant ou un panneau de toit avec plateforme, la maintenance arrière peut être moins chère par caisson. Réussi : la méthode de maintenance indiquée, l'accès dessiné et le devis d'acier correspondant. Échoué : un caisson à maintenance arrière devisé pour un mur sans accès arrière.

## 6. Poids des caissons, charpente acier et charge de vent

Un caisson LED extérieur pèse 30 à 45 kg par mètre carré en aluminium moulé et 50 à 65 kg en acier, et la structure ajoute à peu près autant. Par-dessus cette charge permanente, le vent agit sur toute la face comme une pression horizontale qu'un support conçu pour un simple panneau publicitaire n'a jamais eu à porter. Les caissons ajourés comme le XR Air pèsent une fraction de cela et laissent passer le vent, raison pour laquelle ils conviennent aux façades vitrées ; les caissons de location comme le XR Bastion se suspendent à leur propre truss lors d'événements. Un écran permanent nécessite une structure calculée pour le site, et non recopiée d'un chantier précédent.

### Exemple chiffré : un écran de façade de 6 × 4 m à Istanbul

Prenons un écran de 24 m² à pas de 6,9 mm en caissons de 500 × 1 000 mm : 48 caissons et environ 864 × 576 pixels. À 35 kg par mètre carré, les caissons pèsent environ 840 kg ; le cadre, les supports et l'habillage portent le total à environ deux tonnes. Une pression de vent de conception d'environ 1 kN par mètre carré ajoute environ 24 kN de force horizontale que les ancrages et le mur hôte doivent reprendre. Réussi : un rapport statique signé par un ingénieur civil habilité, couvrant le mur, les ancrages et le cadre sous charges permanentes, de vent et, à Istanbul, sismiques. Échoué : un plan de supports du fournisseur LED sans calcul propre au site.

## 7. Alimentation : pointe contre moyenne, ligne dédiée, protection contre les surtensions et onduleur

Deux chiffres de puissance comptent. La consommation de pointe, typiquement 600 à 800 W par mètre carré à pas de 6,9 mm, dimensionne le disjoncteur et le câble. La consommation moyenne, généralement 200 à 300 W par mètre carré avec un contenu normal et une atténuation par capteur, dimensionne la facture d'électricité. Un fournisseur qui ne cite que la puissance moyenne vous laisse avec un disjoncteur qui saute sur un plein blanc ; un fournisseur qui ne cite que la pointe vous fait budgéter trois fois le coût réel d'exploitation.

### Exemple chiffré : 24 m² en 6,9 mm

Pour l'écran de 6 × 4 m ci-dessus, la charge de pointe est d'environ 17 kW et la charge moyenne d'environ 6 kW. Cela appelle une alimentation triphasée dédiée sur un disjoncteur de 3 × 40 A, un câblage dimensionné pour la pointe, un parasurtenseur de type 2 au tableau de distribution et un petit onduleur pour le contrôleur et le commutateur réseau, afin qu'une micro-coupure du réseau ne redémarre pas l'écran sur une image noire en pleine diffusion. L'énergie annuelle à 18 heures par jour avoisine 35 à 40 MWh. Réussi : les deux chiffres cités, la ligne dédiée, la protection contre les surtensions spécifiée. Échoué : l'écran partageant un circuit avec l'éclairage du bâtiment.

## 8. Pas de pixel à partir de la distance de vision réelle

Les pas extérieurs vont de 4 mm pour les surfaces de proximité comme les devantures et les abribus à 10 mm pour les façades et les pylônes lus depuis l'autre côté d'une route. La règle des dix de notre guide du pas de pixel s'applique : la distance minimale de vision confortable en mètres est à peu près égale au pas en millimètres, et la distance optimale se situe à deux à trois fois cette valeur. Un écran de 6,9 mm se lit donc nettement depuis 7 m et paraît au mieux de 14 à 20 m, ce qui décrit la plupart des positions DOOH au niveau de la rue à Istanbul.

Mesurez la distance réelle depuis l'endroit le plus proche où un spectateur s'arrête, et non depuis le bord éloigné du trottoir, et rappelez-vous que le coût et la puissance augmentent avec le carré du pas : un écran de 4 mm possède trois fois les pixels d'un écran de 6,9 mm de même taille et est facturé en conséquence. Réussi : un pas choisi à partir d'une distance de vision mesurée, avec la résolution indiquée en pixels. Échoué : le pas le plus fin du catalogue sur un écran lu depuis 30 m, ou un pas grossier choisi sur le prix pour une surface que les piétons frôlent.

## 9. Garantie, modules de rechange et intervention sur site

Un écran LED extérieur gagne de l'argent chaque heure où il est allumé ; la garantie décide du nombre d'heures où il est éteint. Visez au moins trois ans sur les caissons, les modules et les alimentations, avec un délai d'intervention sur site précisé plutôt qu'une promesse de retour à l'atelier. Des modules de rechange représentant 2 à 3 % du total, livrés du même lot de production, font qu'une réparation ne laisse pas une tache de couleur visiblement différente. Réussi : trois ans ou plus, un délai d'intervention sur site défini en heures, des rechanges du même lot inclus dans le prix. Échoué : une garantie d'un an, des rechanges en ligne optionnelle, ou un délai d'intervention décrit comme « au mieux ».

## 10. Autorisations et structure : agrément municipal, licence et validation structurale

En Turquie, un écran LED extérieur est à la fois une enseigne et une structure, et les deux exigent des démarches. La réglementation municipale sur la publicité et les enseignes régit la taille, la position, la luminosité et les horaires ; l'autorisation est délivrée pour un écran précis à une adresse précise, et une taxe publicitaire annuelle s'applique. Lorsque l'écran est fixé à un bâtiment, le rapport structural du point six fait partie du dossier, et dans certains arrondissements un cadre monté en toiture nécessite une modification de licence. Réussi : l'autorisation prise en compte et chiffrée dans le projet, le rapport structural signé, les limites de luminosité nocturne documentées. Échoué : un écran érigé en supposant que les autorisations pourront être arrangées plus tard.

> Un écran LED extérieur échoue au stade du devis, et non sur le terrain. Chaque point de cette liste est une question qui ne coûte rien à poser et beaucoup à négliger.

## Erreurs courantes lors de l'achat d'un écran LED extérieur

1.   0 1 Juger la luminosité d'après une démonstration en showroom ou sur un mur à l'ombre ; le seul test valable est la position prévue à midi.
2.   0 2 Accepter un IP65 à l'avant avec un arrière non certifié sur un écran dont le dos est à l'air libre.
3.   0 3 Choisir un caisson à maintenance arrière pour une façade sans accès à l'arrière, puis découvrir le coût d'une plateforme de maintenance.
4.   0 4 Laisser l'acier au ferronnier sans rapport statique d'un ingénieur habilité.
5.   0 5 Dimensionner l'alimentation électrique sur la puissance moyenne et faire sauter le disjoncteur dès la première image plein blanc.
6.   0 6 Négliger le capteur de lumière ambiante et fonctionner à pleine puissance toute la nuit.
7.   0 7 Acheter le pas le plus fin du catalogue pour un écran lu depuis l'autre côté d'une route.
8.   0 8 Commander exactement le nombre de modules nécessaires, sans rechange du même lot.
9.   0 9 Commencer la construction avant que le permis municipal ne soit délivré.

## Comment comparer les devis : ce qu'il faut demander à chaque fournisseur

Posez les mêmes questions par écrit à chaque fournisseur et comparez les réponses côte à côte. L'exercice prend un après-midi et révèle la différence entre un prix pour un produit et un prix pour un écran qui fonctionne. Lorsqu'un fournisseur ne peut pas répondre à une question, considérez la réponse manquante comme un coût que vous paierez plus tard.

1.   0 1 Indice IP à l'avant et à l'arrière pour le caisson devisé, avec le rapport d'essai indépendant joint.
2.   0 2 Luminosité étalonnée en nits, la méthode de mesure et le chiffre de contraste en plein jour.
3.   0 3 Plage de température de fonctionnement et méthode de refroidissement ; toute dépendance à une climatisation externe.
4.   0 4 Méthode de maintenance et tracé de l'accès ; profondeur du caisson et dégagement derrière.
5.   0 5 Poids du caisson par mètre carré, poids total du système et qui signe le rapport statique.
6.   0 6 Puissance de pointe et moyenne par mètre carré, calibre de disjoncteur recommandé, protection contre les surtensions et onduleur.
7.   0 7 Pas de pixel, résolution en pixels et distance de vision pour laquelle il a été choisi.
8.   0 8 Durée de garantie, délai d'intervention sur site en heures et nombre de modules de rechange inclus.
9.   0 9 Quelles autorisations sont requises, qui les demande et ce qui est inclus dans le prix.
10.   0 10 Des installations de référence du même caisson exposées dehors depuis au moins trois ans.

Si vous préparez un écran LED extérieur, envoyez à PixiaTech le site, les dimensions et la position de vision, et nous vous renverrons une spécification, un brief structural et un devis construits sur cette liste, que la réponse soit XR Rugged, XR Vision ou XR Air. Utilisez Démarrer un projet sur app.pixiatech.com pour commencer.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Quel pas de pixel convient à un écran LED extérieur ?`,
        answer: `Prévoyez 4 à 10 mm pour presque tout projet extérieur. Utilisez le pas en millimètres comme distance minimale de vision en mètres : un écran de 6,9 mm se lit nettement depuis 7 m et paraît au mieux de 14 à 20 m. Les devantures et autres surfaces de proximité prennent 4 mm ; les façades lues depuis l'autre côté d'une route prennent 8 à 10 mm.`,
      },
      {
        question: `Que signifie IP65 sur un écran LED ?`,
        answer: `IP65 signifie que le caisson est étanche à la poussière et protégé contre les jets d'eau de toutes directions. C'est le minimum pour l'avant de tout écran LED extérieur, et pour l'arrière lorsque le dos est à l'air libre. Un IP54 à l'arrière n'est acceptable qu'à l'intérieur d'un boîtier couvert et fermé. Demandez le rapport d'essai du modèle exact.`,
      },
      {
        question: `Un écran LED extérieur fonctionne-t-il en hiver et en été ?`,
        answer: `Oui, à condition que le caisson soit homologué pour une température ambiante de −20 à +50 °C et se refroidisse sans climatisation externe. En été, une façade sombre en plein soleil peut dépasser 40 °C, donc un caisson homologué seulement jusqu'à +40 °C réduira sa puissance ou s'arrêtera. En hiver, le caisson scellé et la chaleur des LED maintiennent l'électronique au-dessus du point de congélation.`,
      },
      {
        question: `Pourquoi un caisson à maintenance avant est-il important ?`,
        answer: `Parce qu'il décide de la façon dont chaque réparation future sera faite. Un caisson à maintenance avant libère les modules et les alimentations par la face, donc l'écran se place près du mur sur un cadre léger et un technicien travaille depuis une nacelle. Un caisson à maintenance arrière nécessite un passage derrière, ce qui ajoute acier, poids et coût, et est impossible sur de nombreuses façades.`,
      },
      {
        question: `Quelle quantité d'électricité consomme un écran LED extérieur ?`,
        answer: `Prévoyez 600 à 800 W par mètre carré en pointe et 200 à 300 W par mètre carré en moyenne avec un contenu normal et une atténuation par capteur. Un écran de 24 m² à pas de 6,9 mm culmine à environ 17 kW et consomme en moyenne environ 6 kW, soit à peu près 35 à 40 MWh par an à 18 heures par jour. Dimensionnez les câbles pour la pointe, budgétez pour la moyenne.`,
      },
      {
        question: `Combien de temps dure un écran LED extérieur ?`,
        answer: `Un écran LED extérieur bien spécifié fonctionne 80 000 à 100 000 heures avant que sa luminosité ne soit divisée par deux, soit huit à dix ans à 18 heures par jour avec atténuation nocturne. La chaleur et un fonctionnement constant à pleine puissance raccourcissent cette durée ; des caissons scellés, un capteur de lumière ambiante et des rechanges du même lot préservent à la fois la durée de vie et l'uniformité.`,
      },
    ],
  },
  'what-is-an-led-screen': {
    contentFr: `Qu'est-ce qu'un écran LED ? En une phrase : une surface d'affichage dont chaque pixel produit sa propre lumière à partir d'une puce LED rouge, d'une verte et d'une bleue, assemblée en modules et en caissons dans la taille que réclame l'espace. La réponse plus longue passe en revue chaque terme qui figure sur un devis — pas de pixel, nits, taux de rafraîchissement, niveaux de gris, indice IP, carte de réception. Ce guide explique l'écran LED couche par couche, suit le signal de la source jusqu'à la LED, définit les douze termes qui reviennent le plus souvent et liste les types d'écrans LED avec les usages pour lesquels chacun est conçu.

## Qu'est-ce qu'un écran LED ? Cinq couches, de la puce au mur

Le plus petit élément est la puce LED : un semi-conducteur de moins d'un demi-millimètre qui émet de la lumière lorsqu'un courant le traverse. Une puce rouge, une verte et une bleue sont réunies dans un même boîtier et forment un pixel. En pilotant les trois puces à des intensités différentes, le pixel produit plus de 16 millions de couleurs. Comme les puces sont trop petites pour être distinguées, à quelques mètres l'œil voit un seul point coloré plutôt que trois points lumineux. La règle des trois puces par pixel vaut du pas fin de 0,9 mm à un écran extérieur de 10 mm ; seuls la taille du boîtier et l'espacement changent.

Les pixels sont montés sur une carte à circuit imprimé pour former un module. La taille de module la plus courante est de 320 × 160 mm ; en P2.5 cette carte porte 128 × 64 pixels, en P5 elle en porte 64 × 32. Les circuits intégrés de commande et les connecteurs se trouvent au dos, un masque de protection à l'avant. Les modules sont montés dans un caisson : en location, un cadre en aluminium moulé de 500 × 500 mm ou 500 × 1 000 mm ; en installation fixe, des corps plus grands en acier ou en aluminium allant jusqu'à 960 × 960 mm. Chaque caisson abrite aussi une alimentation, une carte de réception et une carte hub qui relie les modules à cette carte.

Les caissons juxtaposés côte à côte et empilés les uns sur les autres forment l'écran LED. Dix colonnes et six rangées de caissons de 500 × 500 mm donnent un mur de 5 × 3 m, soit 15 m² ; changez le nombre de caissons et la taille comme le rapport d'aspect changent avec lui. C'est ici que commence la différence fondamentale avec un téléviseur : un écran LED n'a pas de taille fixe. Il grandit caisson par caisson et épouse l'architecture.

1.   0 1 Puce LED : le semi-conducteur émetteur de lumière ; rouge, vert ou bleu.
2.   0 2 Pixel : trois puces dans un seul boîtier ; le plus petit point coloré de l'écran.
3.   0 3 Module : des milliers de pixels sur une carte à circuit imprimé, généralement 320 × 160 mm.
4.   0 4 Caisson : de 500 × 500 mm à 960 × 960 mm, contenant 4 à 18 modules, une alimentation et une carte de réception.
5.   0 5 Mur : des dizaines ou des centaines de caissons pilotés comme une seule surface d'image.

## Écran LED vs téléviseur LED vs LCD : ce qui diffère réellement

L'appareil vendu comme « téléviseur LED » est un écran LCD. Une couche de cristaux liquides forme l'image, et les LED blanches situées derrière ne fournissent que la lumière. Les pixels n'émettent rien ; ils s'ouvrent et se ferment pour laisser passer le rétroéclairage. C'est pourquoi le noir sur un LCD n'est jamais totalement noir, pourquoi la luminosité s'arrête à 300–500 nits, et pourquoi la dalle est une seule feuille de verre dont la taille a été fixée en usine.

Dans un véritable écran LED — que l'industrie appelle LED à vision directe — chaque pixel émet sa propre lumière. Un pixel éteint ne produit rien, donc le noir est réellement noir et le contraste dépasse 5 000:1. La luminosité atteint 600–1 500 nits en intérieur et 5 000–10 000 nits en extérieur, et la surface s'agrandit caisson par caisson sans bordure entre eux. Le prix à payer, c'est que trois semi-conducteurs distincts par pixel coûtent plus cher au mètre carré qu'un obturateur à cristaux liquides, et qu'une vision proche exige une densité de pixels élevée. Notre article écran LED vs mur vidéo LCD pèse ce compromis à l'échelle d'une salle de réunion et d'une salle de contrôle.

## Comment fonctionne un écran LED ? Le trajet du signal, de la source à la LED

L'image part d'une source : un lecteur multimédia, un ordinateur, une caméra ou une régie de diffusion. Le signal HDMI, DisplayPort ou SDI entre d'abord dans un processeur vidéo. Le processeur sélectionne l'entrée, met l'image à l'échelle du nombre réel de pixels du mur — en ajustant par exemple un fichier de 1 920 × 1 080 sur un mur de 3 200 × 1 280 pixels — et applique les réglages de couleur, de luminosité et de gamma. Si le mur n'a pas la forme 16:9 d'un téléviseur, le processeur recadre et réorganise l'image pour épouser l'architecture.

Du processeur, l'image passe à la carte émettrice. La carte émettrice divise le mur en régions de la taille d'un caisson et transmet chaque région sur un port réseau. Un port gigabit transporte environ 650 000 pixels en couleur 8 bits à 60 Hz, de sorte que les grands murs utilisent plusieurs ports. Sur de courtes distances, le câble est en cuivre CAT6 ; au-delà d'environ 100 m, c'est de la fibre optique. Les caissons sont chaînés en guirlande, et si les données sont aussi renvoyées depuis l'extrémité opposée en boucle, un câble défaillant ne fait pas tomber l'image.

À l'intérieur de chaque caisson, une carte de réception ne prend que la partie de l'image qui appartient à ce caisson et transmet le reste à la suite de la chaîne. Elle distribue les données de pixels via la carte hub vers les modules, où les circuits intégrés de commande fournissent à chaque LED un courant constant et règlent la luminosité par la durée pendant laquelle ce courant est appliqué — en commutant des milliers de fois par seconde. Les données d'étalonnage résident aussi sur la carte de réception : l'écart de couleur de chaque pixel, mesuré en usine, y est corrigé. Le trajet complet, de la source à la LED, prend quelques millisecondes.

> Sur un écran LED, l'image n'est pas produite par un seul appareil mais par une chaîne dans laquelle chaque caisson pilote sa propre part.

## Termes des écrans LED : un glossaire en 12 termes

Les douze termes ci-dessous constituent le langage commun des devis, des fiches techniques et des appels d'offres. Chacun est défini en une phrase, avec sa plage habituelle et le point à vérifier.

### Pas de pixel

La distance entre le centre d'un pixel et le centre du suivant, exprimée en millimètres et abrégée par un P. Sur un écran P1.9, les pixels sont espacés de 1,9 mm ; sur un P10, de 10 mm. Comme le pas s'applique dans les deux directions, la densité croît avec le carré : un P1.9 place environ 277 000 pixels dans un mètre carré, un P10 en place 10 000. La résolution, la distance de vision, la puissance et le prix découlent tous de ce chiffre. Notre guide du pas de pixel détaille la méthode de choix.

### Nits (luminosité)

Le nit est le nom courant du candela par mètre carré (cd/m²), la mesure de la quantité de lumière qu'émet un écran. Un smartphone produit 600–1 000 nits, un téléviseur LCD 300–500. Un écran LED intérieur a besoin de 600–1 500 nits, un écran extérieur en plein soleil de 5 000–10 000, et un écran à maillage transparent derrière une vitre de plus de 4 000 car il rivalise avec la lumière du jour. Trop de luminosité en intérieur est fatigante ; le bon chiffre est déterminé par la lumière ambiante, pas par le plus grand nombre de la fiche technique.

### Taux de rafraîchissement

Le nombre de fois par seconde où les LED sont ré-excitées, en Hz — à ne pas confondre avec la fréquence d'image de 50 ou 60 Hz de la source. L'œil est satisfait à 960 Hz, mais un obturateur de caméra capte le cycle marche-arrêt des LED et enregistre des bandes noires défilantes. Pour tout écran filmé pour la télévision, pour les réseaux sociaux ou par un téléphone lors d'un concert, 3 840 Hz est le minimum ; les studios de diffusion et les scènes XR utilisent 7 680 Hz.

### Niveaux de gris (profondeur de bits)

Le nombre de paliers auxquels chaque couleur peut être pilotée. Huit bits donnent 256 niveaux par canal ; 14 bits en donnent 16 384 et 16 bits 65 536. Plus de paliers signifie des dégradés plus doux dans les scènes sombres et une couleur qui survit à une faible luminosité. Ce dernier point compte le plus : les écrans intérieurs tournent souvent à 20–40 % de luminosité, et un écran à faible profondeur de bits perd des paliers à ce niveau et montre du banding. Écrire « niveaux de gris élevés à faible luminosité » dans le cahier des charges règle la question avant l'achat.

### Contraste

Le rapport entre le blanc le plus lumineux et le noir le plus sombre. Sur un écran LED, le noir provient d'un pixel éteint qui n'émet rien, donc la vraie limite est la quantité de lumière ambiante que la surface réfléchit. Les masques noirs et les boîtiers LED mats atteignent 5 000:1 ; les surfaces COB à revêtement de résine noire atteignent 10 000:1 et au-delà. Dans un hall vitré ou en extérieur en plein jour, le contraste décide de la lisibilité autant que la luminosité : une surface lumineuse mais réfléchissante paraît délavée malgré un chiffre de nits élevé.

### Température de couleur et étalonnage

La température de couleur donne le ton du blanc en kelvins : 6 500 K est le standard neutre de la lumière du jour, 3 200 K le ton chaud d'un éclairage de studio. L'étalonnage est le processus en usine qui consiste à mesurer chaque pixel et à le ramener à la même cible ; les puces LED varient légèrement entre les lots de production, et sur un mur non étalonné les caissons diffèrent visiblement de teinte. Un bon fabricant écrit les données d'étalonnage sur la carte de réception, et un réétalonnage sur site corrige plus tard le vieillissement. Lorsque des caissons de lots différents sont mélangés, ces données sont essentielles.

### Indice IP

Le code IP indique la protection contre la poussière et l'eau en deux chiffres : le premier pour la poussière (0–6), le second pour l'eau (0–9). IP65 signifie totalement étanche à la poussière et résistant aux jets d'eau ; IP54 signifie résistance limitée à la poussière et aux éclaboussures. Sur les écrans extérieurs, l'avant doit être IP65 ; l'arrière doit aussi être IP65 s'il est exposé, tandis qu'un IP54 suffit dans un boîtier fermé. Les produits intérieurs sont typiquement IP30–IP40. Pour les sites côtiers et une forte humidité, demander un IP66 est une marge raisonnable.

### SMD, COB et GOB

Trois façons de construire le boîtier LED. En SMD, les puces rouge, verte et bleue se trouvent dans un petit boîtier en plastique soudé à la carte ; c'est la méthode la plus courante et la plus économique. En COB, les puces sont montées directement sur la carte à circuit imprimé sous une seule couche de résine ; la surface résiste aux chocs, est mate et moins chère en dessous de 1,2 mm. Le GOB coule un gel de protection transparent sur un module SMD, protégeant les écrans de location et les planchers interactifs contre les chocs et l'humidité. Notre article COB vs SMD donne le détail.

### Distance de vision

La distance la plus proche à laquelle l'œil ne distingue plus les pixels individuels. La règle pratique : le pas de pixel en millimètres égale la distance minimale de vision en mètres. Un P2.6 se lit nettement à partir d'environ 2,6 m, un P10 à partir d'environ 10 m, et l'image paraît au mieux à deux ou trois fois cette distance. C'est pourquoi spécifier un P3.9 pour une façade vue depuis 40 m revient à payer quatre fois les LED et la puissance pour une résolution que personne ne peut voir. Mesurez toujours depuis la position de spectateur réaliste la plus proche.

### Consommation électrique (maximum et moyenne)

Les fiches techniques donnent deux chiffres. Le maximum correspond au moment où chaque pixel affiche un blanc à pleine luminosité : 350–500 W/m² pour un pas fin intérieur, environ 650 W/m² pour un P3.9 de location, plus de 800 W/m² en extérieur. La moyenne est mesurée sur un contenu vidéo réel et représente généralement environ un tiers du maximum. L'alimentation et les disjoncteurs sont dimensionnés sur le maximum ; le coût d'exploitation et le refroidissement sont calculés sur la moyenne. Un écran extérieur de 100 m² peut demander 80 kW en pointe, et ce chiffre pilote la conception du groupe électrogène et du tableau de distribution.

### Accès de maintenance

Le côté par lequel on accède au module et à l'électronique lorsqu'un élément tombe en panne. La maintenance avant signifie que les modules se libèrent par la face à l'aide d'aimants ou de loquets ; elle est obligatoire pour les écrans intérieurs montés à ras d'un mur et pour les façades sans passage à l'arrière. La maintenance arrière signifie ouvrir une porte au dos du caisson ; elle est courante sur les écrans de location et les écrans extérieurs à charpente acier, car elle facilite l'étanchéité de la face avant. Elle détermine aussi la profondeur du caisson et le système de fixation, donc tranchez avant l'installation.

### Caisson et module

Le module est la plus petite pièce remplaçable qui porte les LED ; le caisson est le corps structurel qui porte les modules, l'alimentation et la carte de réception. Les caissons de location sont en aluminium moulé de 500 × 500 mm pesant 6–8 kg, suspendus par des loquets rapides. Les caissons intérieurs fixes conservent un rapport 16:9 à des tailles comme 600 × 337,5 mm ; les caissons extérieurs vont jusqu'à 960 × 960 mm. Un devis doit préciser la taille, le poids et la profondeur du caisson : le transport, la charge de levage et le système de fixation découlent tous de ces trois chiffres.

## Types d'écrans LED, et la série PixiaTech derrière chacun

Les écrans intérieurs offrent 600–1 500 nits, des pas fins de 0,9 à 2,5 mm et une conception silencieuse sans ventilateur ; dans le catalogue PixiaTech, XR Fine couvre l'échelle d'une salle de réunion et d'un hall, et XR Ultra le grand mur d'entreprise. Les écrans extérieurs associent un corps IP65, 5 000–10 000 nits et des pas de 4–10 mm pour les façades, les places et la publicité en bord de route ; XR Vision est la série pour façades fixes et XR Rugged est conçue pour les climats rudes et l'humidité élevée.

Les écrans de location sont faits pour être montés et démontés rapidement, avec des caissons légers, des loquets rapides et un réglage de courbure ; XR Event est le produit des concerts et des scènes de lancement, XR Arena le choix des grandes salles et de l'échelle d'un stade, et XR Flex offre des angles concaves et convexes pour les constructions de location courbes. Les écrans à pas fin se situent sous 1,5 mm, principalement en construction COB, et sont conçus pour les salles de contrôle vues à moins de trois mètres, où XR Fine mène à nouveau.

Les écrans transparents se placent derrière les façades vitrées et laissent visible l'espace derrière eux : XR Air est un maillage à 60–80 % de transparence, le film LED Jellyfish se colle directement au verre, et le verre holographique Jellyfish forme l'image dans le verre lui-même. Les écrans flexibles et courbes pour habiller les colonnes et les surfaces cylindriques relèvent de XR Curve. Les écrans cinétiques se déplacent en trois dimensions sur des caissons motorisés dans les séries SPKI (intérieur) et SPKO (extérieur). Les écrans de sol portent la charge et réagissent au toucher avec XR Floor ; l'affiche numérique est une solution monobloc en magasin sous le nom Poster LED Display. XR Studio est la scène de production virtuelle et XR Holo le produit pour les effets holographiques.

## Quel écran LED pour quel usage

Le choix d'un écran se résume généralement à trois questions : à quelle distance se tiendra le spectateur, l'écran verra-t-il le soleil, et l'installation est-elle permanente ou temporaire. La correspondance ci-dessous couvre les scénarios que nous rencontrons le plus souvent.

1.   0 1 Salle de réunion ou salle de contrôle, vision à 2–4 m : pas fin P0.9–P1.5, 600–800 nits, 3 840 Hz — XR Fine.
2.   0 2 Hall, showroom ou mur de vente, vision à 3–8 m : P1.5–P2.5, 800–1 500 nits — XR Fine ou XR Ultra.
3.   0 3 Concert, mariage, lancement de produit ou scène d'exposition : location P2.6–P3.9, caissons 500 × 500 mm, réglage de courbure — XR Event, XR Flex.
4.   0 4 Façade, place ou DOOH en bord de route vu depuis 15 m et plus : P6–P10, 6 000+ nits, IP65 — XR Vision, XR Rugged.
5.   0 5 Vitrine ou façade vitrée : maillage ou film transparent, 4 000+ nits — XR Air, film LED Jellyfish.
6.   0 6 Plancher de scène ou zone interactive : surface portante et antidérapante — XR Floor.
7.   0 7 Entrée de magasin ou hall d'hôtel, solution monobloc rapide : Poster LED Display.
8.   0 8 Production virtuelle et tournages XR : 7 680 Hz, large gamme de couleurs — XR Studio.
9.   0 9 Expérience de marque et mouvement architectural : caissons cinétiques — SPKI / SPKO Kinetic.

## De « qu'est-ce qu'un écran LED » à l'achat : où lire ensuite

Une fois les termes en place, les questions suivantes sont le budget et l'application. Notre guide des prix des écrans LED explique les facteurs qui déterminent le prix au mètre carré ; si vous préparez une installation temporaire pour un événement, le guide de location d'écran LED donne le calcul au mètre carré et les questions à poser avant d'accepter un devis. Pour un projet extérieur, la liste d'achat pour l'extérieur énumère la luminosité, l'indice IP, la conception thermique et les clauses de garantie. Les lecteurs qui se demandent combien d'années durera un écran trouveront notre article sur la durée de vie des écrans LED, qui explique ce que signifie en pratique le chiffre de 100 000 heures et propose un calendrier de maintenance.

Pour les comparaisons, nos articles écran LED vs projecteur et mur vidéo LED vs mur vidéo LCD mettent deux technologies côte à côte à la même échelle, et le guide de taille d'écran d'événement montre comment passer des dimensions d'une salle aux dimensions d'un écran. Tous ces articles utilisent les termes définis dans ce glossaire ; lorsqu'un chiffre est obscur, c'est vers cette page qu'il faut revenir.

Si vous souhaitez déterminer ensemble le bon écran pour votre projet, partagez les dimensions de votre salle, la distance de vision et le type de contenu via la page Démarrer un projet ; l'équipe PixiaTech renvoie une proposition préliminaire couvrant le pas de pixel, la luminosité et le choix des caissons.

## FAQ — Questions fréquentes`,
    faqsFr: [
      {
        question: `Qu'est-ce qu'un écran LED, et en quoi diffère-t-il d'un téléviseur LED ?`,
        answer: `Un téléviseur LED est un LCD à rétroéclairage LED : ses pixels filtrent la lumière venue de l'arrière au lieu de l'émettre. Dans un véritable écran LED, chaque pixel émet sa propre lumière à partir de puces rouges, vertes et bleues, donc le noir est réellement noir, la luminosité atteint 1 500–10 000 nits et la surface s'agrandit caisson par caisson sans bordures, jusqu'à n'importe quelle taille.`,
      },
      {
        question: `Comment un écran LED produit-il une image ?`,
        answer: `Un processeur vidéo met la source à l'échelle du nombre de pixels du mur, puis une carte émettrice divise l'image en régions de caissons et les envoie via CAT6 ou fibre. La carte de réception de chaque caisson prend sa part et alimente les modules via la carte hub, où les circuits intégrés de commande règlent la luminosité de chaque LED en la commutant des milliers de fois par seconde. Le mélange des trois puces donne sa couleur au pixel.`,
      },
      {
        question: `Qu'est-ce qu'un nit, et de combien de nits un écran LED a-t-il besoin ?`,
        answer: `Un nit est l'unité candela par mètre carré et mesure la luminosité d'un écran. Les écrans LED intérieurs ont besoin de 600–1 500 nits, les écrans extérieurs en plein soleil de 5 000–10 000, et les écrans transparents derrière une vitre de plus de 4 000. À titre de comparaison, un téléviseur LCD produit 300–500 nits. Le bon chiffre dépend de la lumière ambiante ; davantage est fatigant en intérieur et gaspille de l'énergie.`,
      },
      {
        question: `Pourquoi le taux de rafraîchissement importe-t-il, et combien de Hz faut-il ?`,
        answer: `Le taux de rafraîchissement est le nombre de fois par seconde où les LED sont ré-excitées. L'œil perçoit 960 Hz comme continu, mais un obturateur de caméra enregistre des bandes noires défilantes à basse fréquence. Pour la scène, la diffusion télévisée, le tournage pour les réseaux sociaux et la production virtuelle, 3 840 Hz est le minimum, et les studios XR utilisent 7 680 Hz. Un panneau de façade qu'aucune caméra ne filmera peut se contenter de 1 920 Hz.`,
      },
      {
        question: `Quels sont les principaux types d'écrans LED ?`,
        answer: `Les principales classes sont les écrans intérieurs, extérieurs, de location, à pas fin, transparents ou à maillage, flexibles et courbes, cinétiques, de sol et les affiches. Elles se distinguent par la luminosité, l'indice IP, le poids du caisson et le pas de pixel : intérieur signifie 600–1 500 nits en P0.9–P2.5, extérieur signifie 5 000+ nits et IP65, et location signifie des caissons 500 × 500 mm à loquets rapides conçus pour des montages répétés.`,
      },
      {
        question: `À quoi servent la carte émettrice et la carte de réception ?`,
        answer: `La carte émettrice prend l'image du processeur vidéo, la divise en régions de caissons et les envoie le long de la chaîne par des ports réseau ; un port gigabit transporte environ 650 000 pixels. La carte de réception de chaque caisson ne prend que sa part, transmet le reste au caisson suivant et pilote les modules avec les données d'étalonnage appliquées à chaque pixel. Ensemble, elles forment le système de contrôle.`,
      },
    ],
  },
};

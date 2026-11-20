# PIXIA — Phase 2 : harmonisation de l’enveloppe du chatbot

## État figé

- Sauvegarde du design validé : commit `0b4a11f` (dégradé violet-bleu + trame de points).
- Un seul moteur conversationnel dans le dépôt : `src/components/chat/WizardBotFlow.tsx`.
- Aucun fichier de `chatbot-widget/` ni `public/widget.js` modifié.

## Constat de l’analyse (lecture seule)

- Sur `/web`, le visuel scrollé est `src/components/pixia/PixiaGlobalAnimation.tsx`.
  Il ne crée **aucune** conversation : il ouvre le chatbot existant via l’événement
  `pixia:open-chatbot`.
- Sur l’application, le visuel est `src/components/chat/FloatingChatButton.tsx`,
  qui monte le même `WizardBotFlow` avec les props chargées par `FloatingChatWrapper`.
- Le widget externe (`public/widget.js`) charge l’iframe `/chat-widget`, qui monte
  également le même `WizardBotFlow`.

Il n’existe donc pas de « second chatbot » à copier : il faut étendre l’enveloppe
du site (`PixiaGlobalAnimation`) aux pages applicatives, et conserver
`FloatingChatButton` comme unique propriétaire du moteur et du pont événementiel.

## Stratégie retenue

1. `PixiaGlobalAnimation` devient l’enveloppe visuelle unique, montée sur `/web`
   **et** sur les pages applicatives.
2. `FloatingChatButton` garde `WizardBotFlow`, ses props, ses appels API, son
   auth et ses états. Sous relais de la mascotte globale, son ancien robot, sa
   bulle et son conteneur de drag ne sont plus montés du tout : un seul robot,
   un seul salut, un seul système d’événements de scroll.
3. Le pont `pixia:*` (`open-chatbot`, `chat-state`, `mascot-takeover/release`)
   reste inchangé : clic sur la mascotte → ouverture du vrai chat applicatif ;
   fermeture du chat → retour de la mascotte.

## Deux adaptations indispensables

Ces deux props sont **optionnelles** ; leurs valeurs par défaut reproduisent
exactement le comportement actuel de `/web`.

| Prop | Valeur `/web` (défaut) | Valeur application | Raison |
| --- | --- | --- | --- |
| `heroSelector` | `[data-cms-section="hero"], #hero, section.hero` | `main` | Les pages applicatives n’ont pas de Hero CMS ; sans ancre, la mascotte resterait en icône dès le haut de page au lieu de se réduire progressivement. |
| `dockBottomInset` | `0` (ancrage mesuré sur `#back-to-top-btn`) | `64` px quand la barre d’onglets mobile est affichée | Évite que l’icône réduite masque la navigation fixe du bas sur mobile. La taille de l’icône (64 / 76 px) reste identique au site. |

La taille du robot est calculée à partir de la police racine ; elle vaut déjà
14 px sur le site **et** dans l’application (`globals.css`), donc les dimensions
sont identiques sans adaptation supplémentaire.

## Vérifications prévues

- TypeScript, tests disponibles, build de production.
- `/web` : comportement strictement inchangé (itinéraire témoin).
- Application : haut de page → réduction fluide → icône → retour en haut → clic
  → conversation réelle → fermeture.
- Desktop / tablette / mobile, `prefers-reduced-motion`, un seul `WizardBotFlow`
  monté, pas de doublon de robot ni d’écouteur de scroll concurrent.

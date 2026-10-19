# TODO — Sento Seiya

Cette liste est la source de vérité du projet. Cocher une tâche uniquement après implémentation vérifiable et tests réussis. Chaque feature doit avoir sa propre branche `feature/*`. Après fusion, conserver la branche source : **ne jamais la supprimer**.

## Socle et règles

- [x] Initialiser React + TypeScript + Vite.
- [x] Créer une interface responsive Campagne / Équipe / Arènes / Codex.
- [x] Ajouter le workflow CI de build et de vérification TypeScript.
- [x] Documenter les règles de jeu initiales.
- [x] Ajouter cette TODO centrale et la règle de conservation des branches.
- [ ] Fusionner la PR du socle dans `main` après revue; conserver `feature/foundation-mvp`.

## Prochaine feature — moteur de combat tactique

- [x] Définir les types de combat et les statistiques de chevalier.
- [x] Implémenter les tours, l'ordre d'initiative et les actions.
- [x] Implémenter attaque, défense, dépense/récupération de Cosmos et techniques.
- [x] Implémenter les conditions de victoire/défaite et l'état de combat.
- [x] Ajouter un adversaire IA de base.
- [x] Ajouter des tests unitaires déterministes pour les règles du moteur.
- [x] Faire réussir les tests et le build dans GitHub Actions.
- [ ] Créer une PR dédiée; ne pas mélanger cette feature aux autres.

## Interface de combat tactique — `feature/combat-ui`

- [x] Relier l'arène de combat à la navigation de l'application.
- [x] Afficher les chevaliers, PV, Cosmos, cibles et ordre de tour.
- [x] Permettre attaque, technique spéciale, garde et concentration.
- [x] Résoudre automatiquement les actions de l'IA après le tour de l'équipe du joueur.
- [x] Afficher les messages de combat, le journal, la victoire et la défaite.
- [x] Permettre de recommencer un combat terminé.
- [x] Ajouter des tests de session et de résolution des tours IA.
- [x] Vérifier tests unitaires et build dans GitHub Actions.
- [ ] Ajouter des tests de parcours navigateur réels (E2E).

## Progression et sauvegarde locale — `feature/progression-save`

- [x] Définir une sauvegarde versionnée pour le profil et les trois chevaliers de départ.
- [x] Attribuer 50 XP au joueur et à chaque chevalier après une victoire du joueur.
- [x] Calculer les niveaux avec report de l'XP excédentaire.
- [x] Empêcher qu'un même combat attribue ses récompenses plusieurs fois.
- [x] Restaurer la progression depuis le stockage local du navigateur et tolérer les données invalides ou d'une version inconnue.
- [x] Afficher XP, victoires et niveaux dans l'interface.
- [x] Ajouter des tests de règles, de doublon, de montée de niveau et de restauration.
- [x] Vérifier tests et build dans GitHub Actions (run réussi sur le commit de la feature).
- [ ] Ajouter des tests d'intégration navigateur réels de victoire et rechargement.

## Recrutement et escouade — `feature/recruitment-squad`

- [x] Catalogue de chevaliers (rang, statistiques de base, technique, coût, condition de victoires) avec Seiya, Shiryu et Hyoga au départ et Jabu, Shun et Ikki recrutables.
- [x] Éclats de Cosmos : +30 par victoire, dépensés pour recruter.
- [x] Recrutement avec vérification du coût, des victoires requises et des doublons.
- [x] Escouade de 3 chevaliers maximum, au moins 1, modifiable depuis la page Équipe.
- [x] Préparation du combat : l'arène utilise l'escouade et le niveau de chaque chevalier.
- [x] XP de victoire attribuée uniquement aux chevaliers engagés.
- [x] Sauvegarde v2 avec migration automatique des sauvegardes v1 (éclats rétroactifs pour les victoires passées).
- [x] Tests du catalogue, du recrutement, de l'escouade, de la préparation du combat et de la migration.
- [ ] Ajouter des illustrations dédiées pour les nouveaux chevaliers.

## Progression et collection

- [ ] Modèle de données des chevaliers, armures, techniques et raretés.
- [ ] XP, niveaux, progression persistante et récompenses.
- [ ] Collection étendue (88 chevaliers), formation et positionnement d'équipe.
- [ ] Inventaire, équipement, améliorations et ressources.
- [x] Sauvegarde locale versionnée et migration des données (v1 → v2).
- [ ] Comptes et sauvegarde cloud multi-appareils.

## Campagnes et contenu

- [ ] Système de missions, objectifs, dialogues et embranchements.
- [ ] Cartes tactiques avec cases, obstacles, terrain et couverture.
- [ ] Scènes, décors, arènes et boss.
- [ ] Campagne originale jouable de bout en bout.
- [ ] Ajouter les arcs de l'œuvre uniquement après cadrage narratif et droits appropriés.
- [ ] Codex consultable avec personnages, factions, lieux et chronologie.
- [ ] Import de médias avec validation de formats, tailles et licences.

## Modes de jeu

- [ ] PvE avec difficulté progressive et boss.
- [ ] Coop en ligne et synchronisation d'état.
- [ ] PvP en ligne avec validation serveur des actions.
- [ ] Matchmaking, salons, invitations et reconnexion.
- [ ] Anti-triche et journal de combat serveur.

## Sécurité des dépendances — `chore/deps-security`

- [x] Corriger les 6 vulnérabilités signalées par `npm audit` (esbuild, vite, vite-node, @vitest/mocker, tinypool, vitest) : passage à Vite 8, Vitest 5 et @vitejs/plugin-react 6.
- [x] Ajouter `package-lock.json` pour figer les versions et permettre `npm audit`.
- [x] Passer la CI sur Node.js 22 (Node.js 20 n'est plus maintenu et Vitest 5 exige Node.js 22.12+).
- [x] Vérifier `npm audit` (0 vulnérabilité), tests et build.
- [ ] Ajouter un contrôle `npm audit` automatique en CI.

## Qualité et livraison

- [ ] Tests unitaires pour les règles métier.
- [ ] Tests d'intégration des sauvegardes et des combats.
- [ ] Tests de parcours UI critiques.
- [ ] Accessibilité clavier, contrastes et lecteurs d'écran.
- [ ] Vérifier les performances sur smartphone et tablette.
- [ ] Ajouter PWA et mode hors ligne si pertinent.
- [ ] Ajouter télémétrie respectueuse de la vie privée, désactivable.
- [ ] Publier des versions stables avec tags.
- [ ] Tenir cette liste à jour à chaque PR; ne cocher que ce qui a été testé.

## Règles de gestion des branches

1. Une feature = une branche `feature/<nom-court>` et une PR dédiée.
2. Créer la branche depuis la base correspondant à la dépendance de la feature.
3. Ne pas fusionner une feature dont les tests échouent.
4. Ne jamais supprimer les branches feature, même après fusion.
5. Ne jamais réécrire l'historique partagé ni forcer un push.
6. Pour une correction, utiliser `fix/<nom-court>`; pour la CI, `chore/<nom-court>`.
7. Si une feature dépend d'une PR non fusionnée, ouvrir une PR empilée vers sa branche parente et documenter la dépendance.

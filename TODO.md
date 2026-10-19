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

- [ ] Définir les types de combat et les statistiques de chevalier.
- [ ] Implémenter les tours, l'ordre d'initiative et les actions.
- [ ] Implémenter attaque, défense, dépense/récupération de Cosmos et techniques.
- [ ] Implémenter les conditions de victoire/défaite et l'état de combat.
- [ ] Ajouter un adversaire IA de base.
- [ ] Ajouter des tests unitaires déterministes pour les règles du moteur.
- [ ] Faire réussir les tests et le build dans GitHub Actions.
- [ ] Créer une PR dédiée; ne pas mélanger cette feature aux autres.

## Progression et collection

- [ ] Modèle de données des chevaliers, armures, techniques et raretés.
- [ ] XP, niveaux, progression persistante et récompenses.
- [ ] Recrutement, collection, formation et composition d'équipe.
- [ ] Inventaire, équipement, améliorations et ressources.
- [ ] Sauvegarde locale versionnée et migration des données.
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

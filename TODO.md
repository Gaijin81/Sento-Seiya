# TODO — Sento Seiya

Cette liste est la source de vérité du projet. Cocher une tâche uniquement après implémentation vérifiable et tests réussis. Chaque feature doit avoir sa propre branche `feature/*`. Après fusion, conserver la branche source : **ne jamais la supprimer**.

## Socle et règles

- [x] Initialiser React + TypeScript + Vite.
- [x] Créer une interface responsive Campagne / Équipe / Arènes / Codex.
- [x] Ajouter le workflow CI de build et de vérification TypeScript.
- [x] Documenter les règles de jeu initiales.
- [x] Ajouter cette TODO centrale et la règle de conservation des branches.
- [x] Fusionner la PR du socle dans `main` après revue; conserver `feature/foundation-mvp`.

## Prochaine feature — moteur de combat tactique

- [x] Définir les types de combat et les statistiques de chevalier.
- [x] Implémenter les tours, l'ordre d'initiative et les actions.
- [x] Implémenter attaque, défense, dépense/récupération de Cosmos et techniques.
- [x] Implémenter les conditions de victoire/défaite et l'état de combat.
- [x] Ajouter un adversaire IA de base.
- [x] Ajouter des tests unitaires déterministes pour les règles du moteur.
- [x] Faire réussir les tests et le build dans GitHub Actions.
- [x] Créer une PR dédiée; ne pas mélanger cette feature aux autres.

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

## Plateau de combat tactique — `feature/tactical-board`

- [x] Plateau quadrillé (largeur, hauteur, obstacles) et position de chaque unité ; combats sans plateau toujours supportés.
- [x] Validation du placement : case dans le plateau, hors obstacle, une seule unité par case.
- [x] Déplacement orthogonal limité par la statistique de mouvement (une fois par activation), contournant obstacles et unités.
- [x] Portée d'attaque et portée de technique (distance en cases) ; refus des cibles hors de portée.
- [x] Action « Fin du tour » après un déplacement ou pour attendre.
- [x] IA tactique : technique ou attaque à portée, sinon rapprochement de la cible la plus proche, sinon attente.
- [x] Tests du plateau, du déplacement, des portées, du placement et de l'IA.
- [x] Grille interactive dans l'arène (tactile et souris) : cases accessibles, cibles à portée, obstacles.
- [x] Terrain avancé : couverture (−2 dégâts subis), hauteur (+1 portée d'attaque et de technique), sources de Cosmos (+1 Cosmos en s'y arrêtant), symétriques dans l'arène.
- [x] IA qui recherche activement la couverture et la hauteur : avant d'agir, elle se déplace vers la meilleure case d'où frapper (couverture > hauteur/source de Cosmos), sinon se rapproche en privilégiant le terrain.
- [x] Difficulté progressive (Options, activée par défaut) : adversaires renforcés quand le niveau moyen de l'escouade dépasse le niveau prévu du combat (chapitre 1 : 1, boss : 2, chapitre 2 : 3, chapitre 3 : 5), jusqu'à +5 niveaux.
- [x] La difficulté choisie s'applique aussi aux combats de campagne (elle n'était appliquée qu'aux arènes).

## Plateau d'aventure et choix multiples — `feature/campaign-board`

- [x] Plateau de campagne en cases reliées : départ, récit, combat, trésor, repos, boss, fin.
- [x] Scènes à choix multiples façon « livre dont vous êtes le héros » (2 à 4 choix par scène).
- [x] Conséquences des choix : combat sur le plateau tactique, éclats, ralliement de Jabu, chemins alternatifs, fin pacifique ou par le combat.
- [x] Conditions de choix (chevalier dans l'escouade ou la collection, choix précédents, éclats) avec la raison affichée.
- [x] Défaite ou retraite : le choix est annulé et le joueur peut en faire un autre ; victoire : le choix est résolu.
- [x] Sauvegarde séparée de la campagne (`sento-seiya-campaign`) : case, cases visitées, choix, combat en attente ; récompenses non redonnées en rejouant.
- [x] Chapitre 1 « Le tournoi galactique » : 10 cases, 4 combats dont un boss, textes originaux.
- [x] Tests de cohérence du chapitre, des choix, des conditions, des combats, des récompenses et de la sauvegarde.
- [x] Chapitre 2 « L'ombre du Phénix » : 9 cases, 3 combats dont un boss, recrutement d'Ikki (combat ou dialogue), 2 trésors (Plume de feu, Cendres du Phénix), textes originaux.
- [x] Sélection de chapitre : chaque chapitre a sa sauvegarde et se débloque quand le précédent est terminé (statut conservé en rejouant).
- [x] Chapitre 3 « Les marches du Sanctuaire » : 10 cases, 3 combats dont le gardien d'or de la Première Maison (combat ou dialogue), chemins dépendant d'Ikki, Shiryu, Shun et des choix faits au village, 2 trésors (Fragment de casque d'argent, Poussière d'or), textes originaux.
- [ ] Chapitres suivants (les douze maisons, Asgard, Poséidon, Hadès) après cadrage narratif.
- [ ] Illustrations des scènes et musique d'ambiance par chapitre.

## Joueur contre Joueur et coop locale — `feature/local-versus`

- [x] PvP local sur le même appareil : deux équipes (1 à 3 chevaliers chacune, miroirs autorisés), tour par tour sur le plateau, sans IA.
- [x] Coop locale : deux joueurs (1 à 2 chevaliers chacun, sans doublon) contrôlent chacun leurs chevaliers contre le boss du chapitre 1 et son escorte (IA).
- [x] Écran de passage de main entre joueurs, choix du mode et revanche ; accès depuis la page Arènes.
- [x] Niveau identique pour tous en partie locale (niveau 3) ; la progression n'est pas modifiée.
- [x] Composant de plateau partagé entre l'arène, la campagne et les parties locales.
- [x] Tests des modes, des contrôleurs, des actions hors tour, du passage de main et des conditions de victoire.
- [ ] Coop et PvP en ligne (voir « Modes de jeu »).

## Équipement et ressources — `feature/equipment`

- [x] 6 objets d'équipement (bonus PV, ATQ, DÉF, VIT, Cosmos max, déplacement, portée de technique) et 2 emplacements par chevalier (relique, talisman).
- [x] Ressource « poussières d'étoiles » : +10 par victoire, +30 en battant le boss du chapitre 1 ; forge des objets à la page Équipe.
- [x] Inventaire sauvegardé (plusieurs exemplaires possibles), équiper/déséquiper depuis la page Équipe ; bonus appliqués en combat et dans les statistiques affichées.
- [x] Sauvegarde v3 avec migration automatique des sauvegardes v1/v2 ; équipements invalides ignorés.
- [x] Tests de la forge, de l'inventaire, des bonus, du combat et de la migration de sauvegarde.
- [x] Objets trouvés en campagne : 3 objets rares/légendaires (fragment d'armure d'argent, éclat d'armure d'or, larme d'étoile filante) non forgeables, obtenus selon les choix du chapitre 1 ; section « Trésors » à la page Équipe.
- [x] Emplacement « Armure » : armure de bronze renforcée (60), armure d'argent (120, après le chapitre 2), armure d'or (250, après le chapitre 3).
- [ ] Bonus de set quand armure, relique et talisman d'une même famille sont équipés ensemble.

## Musique et contenus additionnels (DLC) — `feature/audio-dlc`

- [x] Musique d'ambiance (menus, campagne, combat) et effets sonores originaux générés par le navigateur, volume musique/effets et coupure sauvegardés (mobile compris).
- [ ] Musiques et sons fournis par l'auteur (fichiers libres de droits ou sous licence).
- [x] Format de pack de contenu (DLC) v1 : objets de forge et musiques, chargés depuis un manifeste JSON validé ; page Options pour installer, importer et désinstaller.
- [ ] Packs v2 : chapitres de campagne et chevaliers supplémentaires.
- [x] Tests du chargement, de la validation, de l'installation et de la désinstallation des packs, et des réglages audio.

## Progression et collection

- [ ] Modèle de données des chevaliers, armures, techniques et raretés.
- [x] XP, niveaux, progression persistante et récompenses.
- [ ] Collection étendue (88 chevaliers), formation et positionnement d'équipe.
- [x] Inventaire, équipement et ressources.
- [x] Niveaux de forge : chaque objet possédé s'améliore jusqu'au niveau 3 (25, 50, 75 poussières) ; +1 à chaque stat déjà améliorée (+2 PV), déplacement et portée inchangés.
- [x] Sauvegarde locale versionnée et migration des données (v1 → v2).
- [ ] Comptes et sauvegarde cloud multi-appareils.

## Campagnes et contenu

- [ ] Système de missions, objectifs, dialogues et embranchements.
- [ ] Cartes tactiques avec cases, obstacles, terrain et couverture.
- [ ] Scènes, décors, arènes et boss.
- [ ] Campagne originale jouable de bout en bout.
- [ ] Ajouter les arcs de l'œuvre uniquement après cadrage narratif et droits appropriés.
- [x] Codex consultable : chevaliers, adversaires, lieux, objets et chroniques des chapitres, débloqués au fil de la sauvegarde (entrées « ??? » avec indice sinon).
- [ ] Codex : factions, armures et chronologie détaillée de l'univers.
- [ ] Import de médias avec validation de formats, tailles et licences.

## Modes de jeu

- [x] PvE avec boss (chapitre 1) et 3 niveaux de difficulté (Facile, Normal, Difficile) appliqués aux adversaires de l'IA, réglables dans Options.
- [ ] Difficulté progressive automatique selon le niveau de l'escouade.
- [ ] Coop en ligne et synchronisation d'état.
- [ ] PvP en ligne avec validation serveur des actions.
- [ ] Matchmaking, salons, invitations et reconnexion.
- [ ] Anti-triche et journal de combat serveur.

## Sécurité des dépendances — `chore/deps-security`

- [x] Corriger les 6 vulnérabilités signalées par `npm audit` (esbuild, vite, vite-node, @vitest/mocker, tinypool, vitest) : passage à Vite 8, Vitest 5 et @vitejs/plugin-react 6.
- [x] Ajouter `package-lock.json` pour figer les versions et permettre `npm audit`.
- [x] Passer la CI sur Node.js 22 (Node.js 20 n'est plus maintenu et Vitest 5 exige Node.js 22.12+).
- [x] Vérifier `npm audit` (0 vulnérabilité), tests et build.
- [x] Ajouter un contrôle `npm audit` automatique en CI (échec sur vulnérabilité élevée ou critique).

## Qualité et livraison

- [x] Tests unitaires pour les règles métier.
- [x] Tests d'intégration des sauvegardes et des combats.
- [ ] Tests de parcours UI critiques.
- [x] Accessibilité : lien « Aller au contenu », plateau tactique navigable aux flèches (Entrée pour agir), page active annoncée, Échap ferme le menu mobile, contrastes relevés, focus visible partout, animations réduites si demandé par le système.
- [ ] Accessibilité : plateau d'aventure navigable au clavier case par case et audit avec un lecteur d'écran réel.
- [ ] Vérifier les performances sur smartphone et tablette.
- [x] PWA : manifeste, icônes, installation sur smartphone/PC et service worker (jeu jouable hors ligne après la première visite).
- [ ] Notification « nouvelle version disponible » quand le service worker se met à jour.
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

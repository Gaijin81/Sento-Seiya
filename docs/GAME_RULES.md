# Règles du jeu — Sento Seiya

## 1. Vision et périmètre

Sento Seiya est conçu comme un jeu tactique d'aventure à escouade, jouable sur PC, tablette et smartphone. Le cœur de jeu repose sur la préparation d'une équipe, le positionnement sur le terrain, la gestion du Cosmos et des techniques, puis la progression entre les missions.

Ce document fixe une première base de règles pour le prototype. Les valeurs numériques sont des paramètres de conception provisoires, pas une représentation officielle de l'équilibrage de l'œuvre.

## 2. Boucle de jeu

1. Choisir une mission et lire ses objectifs.
2. Constituer une équipe dans la limite de 3 chevaliers pour le premier prototype.
3. Consulter les conditions de victoire, les ennemis et les contraintes de terrain.
4. Combattre au tour par tour.
5. Recevoir expérience et récompenses si la mission est réussie.
6. Améliorer l'équipe, puis choisir la mission suivante.

## 3. Combats tactiques

- Les combats se déroulent au tour par tour.
- Au début d'un tour, les unités encore en état de combattre sont classées par initiative décroissante. En cas d'égalité, la vitesse la plus élevée agit d'abord; si l'égalité persiste, l'ordre stable de l'équipe tranche.
- À son activation, une unité peut effectuer une action principale : attaque, technique, garde ou concentration.
- Le déplacement sera ajouté avec la carte tactique; tant qu'il n'est pas implémenté, il ne doit pas être présenté comme jouable.
- Une action valide met à jour l'état du combat de manière déterministe. Les règles métier ne doivent pas dépendre de l'interface.
- Une unité à 0 PV ou moins est mise hors combat et ne reçoit plus de tour.
- Le combat se termine lorsque tous les alliés ou tous les ennemis sont hors combat, ou lorsque l'objectif de mission est rempli.
- Une mission peut ajouter des objectifs spécifiques, comme survivre un nombre de tours ou protéger un allié.

## 4. Statistiques

Chaque chevalier peut posséder les attributs suivants :

- **PV** : points de vie; à 0, le chevalier est hors combat.
- **Attaque** : contribue aux dégâts physiques.
- **Défense** : réduit les dégâts reçus.
- **Vitesse** : départage l'initiative.
- **Cosmos** : ressource dépensée pour les techniques.
- **Niveau et XP** : progression persistante prévue, pas encore activée dans le premier moteur.

Les statistiques de départ doivent être positives, les dégâts ne peuvent pas être négatifs et les PV ne peuvent pas dépasser les PV maximum.

## 5. Actions de base

### Attaque
Inflige des dégâts physiques calculés à partir de l'attaque de l'assaillant et de la défense de la cible. Le résultat minimum d'une attaque réussie est de 1 dégât.

### Garde
Réduit les dégâts subis jusqu'à la prochaine activation de l'unité, selon un coefficient paramétrable.

### Concentration
Récupère une quantité limitée de Cosmos, sans dépasser le maximum.

### Technique spéciale
Consomme du Cosmos et applique ses dégâts ou effets définis. L'action est refusée si le chevalier est hors combat, si la cible est invalide ou si la ressource est insuffisante. Le coût doit être payé une seule fois et uniquement si l'action est acceptée.

## 6. IA de base

L'IA doit être déterministe pour les tests, avec une stratégie simple :
1. Choisir une cible alliée valide.
2. Utiliser une technique si elle est disponible et permet une action légale utile.
3. Sinon, effectuer une attaque de base.
4. Si aucune cible n'est disponible, laisser la résolution du combat constater la victoire.

Une future IA plus élaborée pourra évaluer les soins, la garde, les synergies, les objectifs et le terrain.

## 6 bis. Prototype jouable de l'arène

L'arène de démonstration propose une équipe de trois chevaliers contre deux adversaires. Les valeurs et techniques utilisées sont provisoires et servent à valider la boucle de combat, pas l'équilibrage final.

- L'équipe du joueur agit dans l'ordre d'initiative; chaque chevalier vivant reçoit une activation.
- Quand tous les chevaliers du joueur ont agi, l'IA résout automatiquement les activations ennemies jusqu'au prochain tour joueur ou à la fin du combat.
- Le joueur peut sélectionner un adversaire vivant et choisir attaque, technique spéciale, garde ou concentration.
- Une technique est désactivée si le chevalier ne dispose pas du Cosmos nécessaire.
- Le journal affiche les actions résolues; la partie affiche victoire ou défaite quand une équipe n'a plus de combattants actifs.
- Après la fin du combat, le joueur peut recommencer. Aucun XP ni récompense n'est encore attribué, et l'état de combat n'est pas sauvegardé après rechargement.

## 6 ter. Progression et sauvegarde du prototype

- Une victoire validée par le moteur attribue 50 XP au profil du joueur et 50 XP à chacun des trois chevaliers de départ.
- Chaque chevalier commence au niveau 1. Le seuil pour passer du niveau (N) au suivant est de (100 × N) XP; l'XP excédentaire est conservée après la montée de niveau.
- Les défaites et les combats encore en cours ne donnent aucune récompense.
- Un identifiant de combat empêche d'attribuer plusieurs fois la récompense d'une même victoire dans la sauvegarde.
- La progression est stockée localement dans le navigateur sous une clé versionnée. Un JSON invalide ou une version inconnue est ignoré et une progression initiale est créée.
- La sauvegarde locale n'est pas une sauvegarde cloud : elle est liée au navigateur et peut disparaître si les données du site sont effacées. La synchronisation multi-appareils et la migration entre versions restent à développer.
- La progression est une donnée de prototype côté client; elle ne doit pas être considérée comme fiable pour un futur PvP ou classement en ligne.

## 7. Modes prévus

- **PvE** : le joueur affronte des unités contrôlées par l'IA.
- **Coop** : plusieurs joueurs contrôlent une équipe contre l'IA.
- **PvP** : deux équipes contrôlées par des joueurs.
- **Campagne** : missions reliées par une progression et une narration.
- **Défis** : règles spéciales, boss et conditions de victoire alternatives.

Seul le mode prototype explicitement implémenté et testé doit être annoncé comme fonctionnel.

## 8. Progression et persistance

- Les récompenses ne sont attribuées qu'à la fin d'une mission validée.
- La progression persistante doit être séparée de l'état temporaire d'un combat.
- Les règles de récompense doivent être calculées côté autoritaire dès qu'un backend existe.
- Le client ne doit pas pouvoir s'accorder lui-même de l'XP, des ressources ou des victoires en multijoueur.
- Le prototype ne doit pas prétendre sauvegarder durablement tant que la sauvegarde n'a pas été implémentée et testée.

## 9. Contenu et droits

Les noms, personnages, armures, visuels, musiques et récits officiels de Saint Seiya peuvent être protégés par des droits. Avant une distribution publique, utiliser du contenu original ou obtenir les autorisations nécessaires. Les extensions/DLC devront être identifiables, versionnées et compatibles avec les sauvegardes.

## 10. Critères de validation

Une fonctionnalité de combat est considérée comme terminée seulement si :
- ses règles sont documentées;
- ses entrées invalides sont rejetées sans mutation partielle;
- les états de victoire et de défaite sont testés;
- les calculs sont reproductibles;
- les tests unitaires et le build CI réussissent;
- la TODO centrale est mise à jour.

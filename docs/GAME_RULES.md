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
- Sur un plateau, l'unité active peut aussi se déplacer **une fois** avant son action principale ; « Fin du tour » termine l'activation sans action principale.
- Une action valide met à jour l'état du combat de manière déterministe. Les règles métier ne doivent pas dépendre de l'interface.
- Une unité à 0 PV ou moins est mise hors combat et ne reçoit plus de tour.
- Le combat se termine lorsque tous les alliés ou tous les ennemis sont hors combat, ou lorsque l'objectif de mission est rempli.
- Une mission peut ajouter des objectifs spécifiques, comme survivre un nombre de tours ou protéger un allié.

## 3 bis. Plateau tactique

- Le plateau est une grille (7 × 5 cases dans l'arène du Sanctuaire) avec des obstacles infranchissables (piliers).
- Chaque unité occupe une case. Au départ, une case doit être dans la grille, hors obstacle et libre ; sinon la création du combat est refusée.
- Déplacement : pas orthogonaux, jusqu'à la statistique **Mouvement** (3 par défaut), sans traverser obstacles, unités ni bords. La distance se calcule en pas (distance de Manhattan).
- Portée : une attaque de base touche une cible à distance ≤ **Portée** (1 par défaut, corps à corps). Une technique a sa propre portée (Seiya 2, Shiryu 1, Hyoga 3, Jabu 1, Shun 3, Ikki 2). Une cible hors de portée est refusée sans modifier l'état.
- Les combats sans plateau (duels historiques) restent valides : pas de position, pas de déplacement, toutes les cibles sont à portée.
- Interface : touche une case dorée pour te déplacer, touche un adversaire pour le cibler ; les adversaires à portée sont entourés de rouge.

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

Sur un plateau, l'IA tactique :
1. lance sa technique si elle a assez de Cosmos et qu'une cible est à portée ;
2. sinon attaque une cible à portée ;
3. sinon, si elle ne s'est pas encore déplacée, avance vers l'adversaire le plus proche (case la plus proche de lui, égalités tranchées par ligne puis colonne), puis rejoue ;
4. sinon termine son tour.

Une future IA plus élaborée pourra évaluer les soins, la garde, les synergies, les objectifs et le terrain.

## 6 bis. Prototype jouable de l'arène

L'arène de démonstration oppose l'escouade du joueur (1 à 3 chevaliers) à deux adversaires. Un écran de préparation affiche les chevaliers engagés, leurs statistiques au niveau actuel et les adversaires attendus. Les valeurs et techniques utilisées sont provisoires et servent à valider la boucle de combat, pas l'équilibrage final.

- L'équipe du joueur agit dans l'ordre d'initiative; chaque chevalier vivant reçoit une activation.
- Quand tous les chevaliers du joueur ont agi, l'IA résout automatiquement les activations ennemies jusqu'au prochain tour joueur ou à la fin du combat.
- Le joueur peut sélectionner un adversaire vivant et choisir attaque, technique spéciale, garde ou concentration.
- Une technique est désactivée si le chevalier ne dispose pas du Cosmos nécessaire.
- Le journal affiche les actions résolues; la partie affiche victoire ou défaite quand une équipe n'a plus de combattants actifs.
- Après la fin du combat, le joueur peut recommencer ou revenir à la préparation. L'état d'un combat en cours n'est pas sauvegardé après rechargement.

## 6 ter. Progression et sauvegarde du prototype

- Une victoire validée par le moteur attribue 50 XP au profil du joueur, 50 XP à chaque chevalier engagé dans le combat et 30 éclats de Cosmos.
- Chaque chevalier commence au niveau 1. Le seuil pour passer du niveau (N) au suivant est de (100 × N) XP; l'XP excédentaire est conservée après la montée de niveau.
- Les défaites et les combats encore en cours ne donnent aucune récompense.
- Un identifiant de combat empêche d'attribuer plusieurs fois la récompense d'une même victoire dans la sauvegarde.
- La progression est stockée localement dans le navigateur sous une clé versionnée. Un JSON invalide ou une version inconnue est ignoré et une progression initiale est créée.
- La sauvegarde locale n'est pas une sauvegarde cloud : elle est liée au navigateur et peut disparaître si les données du site sont effacées. Les sauvegardes v1 sont migrées automatiquement en v2. La synchronisation multi-appareils reste à développer.
- La progression est une donnée de prototype côté client; elle ne doit pas être considérée comme fiable pour un futur PvP ou classement en ligne.

## 6 quater. Recrutement et escouade

- Seiya, Shiryu et Hyoga sont possédés dès le départ. Jabu (30 éclats), Shun (60 éclats, 1 victoire) et Ikki (120 éclats, 3 victoires) sont recrutables depuis la page Équipe.
- Un recrutement exige d'avoir assez d'éclats et de victoires; un chevalier ne peut être recruté qu'une fois et commence au niveau 1.
- Un chevalier recruté rejoint automatiquement l'escouade s'il reste une place.
- L'escouade compte de 1 à 3 chevaliers possédés. Elle est sauvegardée localement avec le reste de la progression.
- Chaque niveau au-delà du premier ajoute +4 PV et +1 attaque; la défense gagne +1 tous les deux niveaux. Vitesse et Cosmos ne changent pas.
- Lors de la migration d'une sauvegarde v1, le joueur reçoit 30 éclats par victoire déjà obtenue et l'escouade contient les trois chevaliers de départ.
- Les valeurs de coût et de statistiques sont provisoires et servent à valider la boucle, pas l'équilibrage final.

## 6 quinquies. Campagne : plateau d'aventure et choix multiples

- La campagne est un plateau de cases reliées (chapitre 1 : 7 × 3). Le jeton du joueur occupe une case ; les cases suivantes possibles sont entourées de pointillés dorés.
- Chaque case ouvre une scène de récit avec 1 à 4 choix, façon « livre dont vous êtes le héros ». Un choix mène toujours à une case.
- Un choix peut demander une condition : un chevalier dans la collection ou dans l'escouade, un choix précédent (drapeau), ou un minimum d'éclats. Un choix verrouillé reste visible, avec sa raison.
- Un choix peut donner des effets : drapeaux (mémoire des choix), éclats de Cosmos, ralliement d'un chevalier (ajouté à l'escouade s'il reste une place).
- Un choix de combat lance un combat sur le plateau tactique contre l'adversaire de la scène. Victoire : le choix est résolu (XP et éclats du combat en plus). Défaite ou retraite : le choix est annulé, le joueur reste sur la case et peut choisir autre chose.
- Une case « fin » termine le chapitre. Le chapitre peut être rejoué ; les récompenses de choix déjà obtenues ne sont pas redonnées.
- La campagne est sauvegardée séparément de la progression (`sento-seiya-campaign`) ; une sauvegarde invalide redémarre le chapitre sans toucher à la progression.

## 6 sexies. Parties locales (même appareil)

- **Joueur contre Joueur** : le Joueur 1 joue le camp gauche, le Joueur 2 le camp droit ; chacun engage 1 à 3 chevaliers (le même chevalier peut être dans les deux camps). Aucune IA n'agit.
- **Coop** : chaque joueur engage 1 à 2 chevaliers différents ; ensemble, ils affrontent le chef des chevaliers noirs et son escorte, joués par l'IA tactique.
- Tous les chevaliers combattent au niveau 3. Les règles du plateau tactique s'appliquent.
- Quand la main passe d'un joueur humain à l'autre, un écran demande de passer l'appareil avant d'afficher le plateau.
- Les parties locales ne donnent ni XP ni éclats et ne modifient pas la sauvegarde.

## 6 septies. Équipement et poussières d'étoiles

- Chaque victoire rapporte 10 poussières d'étoiles (en plus de l'XP et des éclats) ; certains choix de campagne en donnent aussi (30 pour le boss du chapitre 1).
- La forge (page Équipe) transforme les poussières en objets. Un objet peut être forgé plusieurs fois ; chaque exemplaire équipe un seul chevalier.
- Chaque chevalier a deux emplacements : une relique et un talisman. Équiper un objet remplace celui de l'emplacement, qui retourne dans l'inventaire.
- Les bonus s'ajoutent aux statistiques du niveau dès le combat suivant : PV, attaque, défense, vitesse, Cosmos max, déplacement ou portée de technique.
- Les parties locales (PvP / coop) n'utilisent pas l'équipement, pour rester équitables.
- Sauvegarde v3 : les sauvegardes v1 et v2 sont migrées automatiquement, sans poussières ni objets.

## 6 terdecies. Terrain du plateau

- Couverture (bouclier) : un chevalier qui s'y trouve subit 2 dégâts de moins par coup (minimum 1, avant la réduction de garde).
- Hauteur (montagne) : +1 portée pour l'attaque et la technique tant que le chevalier y reste.
- Source de Cosmos (étincelles) : +1 Cosmos (sans dépasser le maximum) quand un chevalier termine son déplacement dessus.
- L'arène place ces cases de façon symétrique (couvertures et hauteur en haut, sources et hauteur en bas) : le terrain s'applique aux arènes, à la campagne et aux parties locales, pour les deux camps.

## 6 septies bis. Objets rares trouvés en campagne

- Rareté : commun (forgeable), rare ou légendaire. Les objets rares et légendaires ne se forgent pas : ils sont donnés par certains choix de campagne (effet `items`), une seule fois même en rejouant.
- Chapitre 1 : prendre le coffre → Larme d'étoile filante (talisman rare : +6 PV, +1 VIT) ; vaincre le chef masqué → Fragment d'armure d'argent (relique rare : +2 ATQ, +1 DÉF) ; duel loyal (route honnête) → Éclat d'armure d'or (talisman légendaire : +10 PV, +1 DÉF, +1 Cosmos max).
- La page Équipe liste les trésors (non découverts affichés « ??? ») ; ils s'équipent comme les autres objets.

## 6 octies. Audio et packs de contenu (DLC)

- Trois ambiances musicales originales, générées par le navigateur : menus, campagne, combat (combats d'arène, de campagne et parties locales). Effets sonores pour les choix, attaques, techniques, victoires et défaites.
- Page Options : volume de la musique et des effets (0 à 100 %), coupure du son (aussi dans la barre du haut). Les réglages sont sauvegardés (`sento-seiya-audio`). Sur mobile, le son démarre au premier toucher.
- Un pack de contenu est un fichier JSON (50 Ko max), sans code :
  ```json
  { "format": 1, "id": "mon-pack", "name": "Mon pack", "version": "1.0.0", "author": "…", "description": "…",
    "items": [{ "id": "mon-objet", "name": "…", "slot": "relic", "cost": 30, "description": "…", "bonus": { "attack": 1 } }],
    "music": { "battle": "https://exemple.com/combat.ogg" } }
  ```
- Règles de validation : identifiants en minuscules/chiffres/tirets (3–40), 12 objets max, emplacement `relic` ou `charm`, coût 1–999, bonus entiers (PV ≤ 20, ATQ/DÉF/VIT ≤ 3, Cosmos max ≤ 2, déplacement et portée de technique ≤ 1), identifiants d'objets uniques (jeu de base et autres packs), musiques `menu`/`campaign`/`battle` en `https://` ou `/chemin` vers mp3, ogg, wav ou m4a.
- Installer un pack de même identifiant le met à jour. Désinstaller un pack retire ses objets de l'inventaire et des chevaliers. Les packs installés sont sauvegardés (`sento-seiya-dlc`).
- Les musiques et sons de la licence originale ne sont pas fournis : seuls des fichiers libres de droits ou sous licence peuvent être ajoutés par pack.

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

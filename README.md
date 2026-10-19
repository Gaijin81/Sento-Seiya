# Sento Seiya — Chroniques du Cosmos

Prototype de jeu web tactique d'aventure inspiré de l'univers des chevaliers du Cosmos. L'objectif à terme est de proposer une expérience responsive PC/tablette/mobile, avec campagnes, collection de chevaliers, progression persistante, combats PvE, coop et PvP.

> **État actuel : socle UI MVP.** L'interface de campagne, l'équipe de départ, les pages Arènes et Codex sont en place. Le moteur de combat, les sauvegardes persistantes, le multijoueur, les campagnes complètes et les contenus médias restent à développer.

## Démarrage

Prérequis : Node.js 20+ et Yarn.

```bash
yarn install
yarn dev
```

Créer une version de production et vérifier TypeScript :

```bash
yarn build
yarn preview
```

## Stack

- React 18 + TypeScript strict
- Vite
- lucide-react pour les icônes
- CSS responsive sans dépendance de composants lourde

## État des fonctionnalités

- [x] Interface responsive et navigation
- [x] Sélection d'arcs de campagne (prototype)
- [x] Équipe initiale et fiches simplifiées
- [x] Pages de présentation PvE, PvP et coopération
- [x] Codex placeholder et note sur les droits
- [ ] Modèle de données de jeu et stockage local
- [ ] Combat tactique tour par tour
- [ ] Système d'expérience, niveaux, compétences et équipement
- [ ] Recrutement et collection de chevaliers
- [ ] Cartes, décors, scènes et arènes jouables
- [ ] Comptes, sauvegardes cloud et synchronisation multi-appareils
- [ ] PvE avec IA, coop et PvP en ligne
- [ ] Éditeur/import de médias avec vérification de formats et licences
- [ ] Architecture de contenu pour extensions/DLC

## Stratégie de branches

Travailler par fonctionnalité avec des branches `feature/*` créées depuis `main`, PR vers `main`, et conservation des branches après fusion. Les versions stables doivent être identifiées par tags. Ne jamais supprimer une branche de fonctionnalité terminée : elle sert de point de retour et d'historique.

Branche initiale : `feature/foundation-mvp`.

## Contenu et propriété intellectuelle

Saint Seiya et ses personnages, noms, musiques, images et éléments graphiques officiels appartiennent à leurs ayants droit. Ce dépôt est un prototype technique indépendant : avant toute distribution publique commerciale ou non commerciale, vérifier les droits et autorisations nécessaires. Utiliser en attendant des éléments originaux ou dûment licenciés.

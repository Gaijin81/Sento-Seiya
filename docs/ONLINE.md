# Jeu en ligne

Le PvP et la coop en ligne passent par un petit serveur Node.js (`server/index.ts`, WebSocket via `ws`). Le serveur fait autorité : il rejoue chaque action avec le même moteur de combat que le client (`src/combat`, `src/versus/match.ts`) et diffuse l'état validé aux deux joueurs.

## Lancer en local

```bash
npm install
npm run server   # terminal 1 : serveur sur ws://localhost:8787 (variable PORT pour changer)
npm run dev      # terminal 2 : le jeu
```

Dans le jeu : Arènes → « Duel en ligne » ou « Coop en ligne ». Le champ « Serveur » vaut `ws://localhost:8787` par défaut.

Jouer à deux appareils sur le même Wi-Fi : lancer `npm run dev -- --host`, ouvrir sur le téléphone l'adresse affichée par Vite (`http://192.168.x.x:5173`) et mettre `ws://192.168.x.x:8787` dans le champ « Serveur ».

`GET /health` répond `{"ok":true,"rooms":N}` pour vérifier que le serveur tourne.

## Déployer gratuitement (Render)

1. Créer un compte sur https://render.com et choisir **New → Blueprint**, puis sélectionner ce dépôt : le fichier `render.yaml` configure le service web gratuit (`npm run server`, contrôle `/health`).
2. Une fois déployé, l'adresse ressemble à `https://sento-seiya-server.onrender.com` : dans le jeu, utiliser `wss://sento-seiya-server.onrender.com`.
3. Pour que le jeu propose cette adresse par défaut, construire le client avec `VITE_SERVER_URL=wss://… npm run build`.

Limites de l'offre gratuite : le service s'endort après environ 15 minutes sans trafic (premier lancement plus lent) et les salons sont gardés en mémoire, donc perdus au redémarrage. Un jeu servi en HTTPS ne peut se connecter qu'à une adresse `wss://`.

## Fonctionnement

- **Salons** : « Créer un salon » donne un code de 5 caractères à partager ; « Rejoindre » le saisit. « Recherche rapide » rejoint le plus ancien salon ouvert du même mode, ou en ouvre un.
- **Modes** : PvP (1 à 3 chevaliers par joueur, l'hôte à gauche) et coop (1 à 2 chevaliers chacun, sans doublon, contre le boss du chapitre 1 joué par l'IA du serveur). Tous les chevaliers sont au niveau 3 ; la progression locale n'est pas modifiée.
- **Reconnexion** : le serveur donne un jeton conservé dans le navigateur. Si la connexion coupe, le client se reconnecte toutes les 2 s et reprend la partie, même après un rechargement de page. L'autre joueur voit que son adversaire est déconnecté.
- **Fin de partie** : « Abandonner » ou « Quitter le salon » ferme le salon pour les deux joueurs. Un salon inactif depuis 30 minutes est supprimé.

## Anti-triche

- Chaque message est validé (`parseClientMessage`) : type, forme de l'action, taille ; 16 Ko maximum par message et 20 messages par seconde par connexion.
- Le serveur vérifie que l'unité appartient au joueur, que c'est son tour, puis applique l'action avec le moteur (portée, déplacement, Cosmos) : une action impossible est refusée.
- Le client n'envoie jamais de statistiques : les équipes sont recréées par le serveur à partir des identifiants de chevaliers.

## Protocole

Client → serveur : `create {mode, picks}`, `join {code, picks}`, `quick {mode, picks}`, `resume {token}`, `action {actorId, action}`, `leave`.

Serveur → client : `session {token, side, code}`, `room {room}` (état complet du salon et du combat), `error {message}`, `closed {reason}`.

Types : `src/online/protocol.ts`. Logique des salons, testable sans réseau : `src/online/rooms.ts`.

## À venir

Comptes joueurs, sauvegarde en ligne et classement demandent une base de données (par exemple Supabase en offre gratuite).

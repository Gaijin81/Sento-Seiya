import type { Chapter } from './types'

/** Chapter 1 — original adventure text inspired by the Galaxian Wars arc. */
export const CHAPTER_ONE: Chapter = {
  id: 'tournoi-galactique',
  title: 'Chapitre 1 · Le tournoi galactique',
  width: 7,
  height: 3,
  start: 'arrivee',
  nodes: [
    {
      id: 'arrivee', kind: 'start', title: 'Arrivée au Colisée', x: 0, y: 1,
      text: 'Le Colisée de la Fondation gronde sous les projecteurs. Dix jeunes chevaliers de bronze vont s’y affronter, et l’Armure d’or du Sagittaire attend le vainqueur. Seiya serre le poing : quelque part dans la foule, il espère retrouver la trace de sa sœur.',
      choices: [
        { id: 'saluer', label: 'Saluer les autres chevaliers dans les vestiaires', goTo: 'rivaux', effects: { flags: ['courtois'] }, outcome: 'Tu pars à la rencontre de tes rivaux avant le tournoi.' },
        { id: 'arene', label: 'Filer directement vers l’arène', goTo: 'premier-tour', outcome: 'Tu rejoins le premier tour sans perdre de temps.' },
      ],
    },
    {
      id: 'rivaux', kind: 'story', title: 'La provocation de Jabu', x: 1, y: 0,
      text: 'Dans les vestiaires, Jabu de la Licorne te barre la route. « Revenu de Grèce avec une armure ? Montre-moi ce que vaut ton Cosmos avant de te ridiculiser devant tout le monde. »',
      choices: [
        { id: 'duel', label: 'Accepter un duel amical', goTo: 'coffre', combat: 'jabu-duel', effects: { recruit: 'jabu', flags: ['respect-jabu'] }, outcome: 'Jabu se relève en riant : « Pas mal… Je me battrai à tes côtés. » Jabu rejoint ta collection.' },
        { id: 'shiryu', label: 'Laisser Shiryu calmer le jeu', goTo: 'coffre', requires: { squad: 'shiryu' }, effects: { flags: ['respect-jabu'] }, outcome: 'Shiryu pose une main sur l’épaule de Jabu. « Garde ta fougue pour l’arène. » Jabu s’écarte, impressionné.' },
        { id: 'ignorer', label: 'Ignorer la provocation', goTo: 'premier-tour', outcome: 'Jabu ricane, mais tu gardes tes forces pour l’arène.' },
      ],
    },
    {
      id: 'premier-tour', kind: 'combat', title: 'Premier tour du tournoi', x: 1, y: 2,
      text: 'Le gong retentit. Deux chevaliers de bronze entrent ensemble dans l’arène : le Loup, rapide et insaisissable, et l’Ours, massif comme un roc. Le règlement exceptionnel du tournoi autorise les combats en équipe.',
      choices: [
        { id: 'combattre', label: 'Entrer dans l’arène', goTo: 'infirmerie', combat: 'premier-tour', outcome: 'La foule acclame ta victoire !' },
      ],
    },
    {
      id: 'coffre', kind: 'treasure', title: 'Le coffre oublié', x: 2, y: 0,
      text: 'Au fond des vestiaires, un coffre de la Fondation contient des éclats d’étoiles : de la poussière d’armure qui vibre encore de Cosmos. Personne ne regarde.',
      choices: [
        { id: 'prendre', label: 'Prendre les éclats', goTo: 'vol', effects: { shards: 40 }, outcome: '+40 éclats de Cosmos.' },
        { id: 'laisser', label: 'Les laisser à leur propriétaire', goTo: 'vol', effects: { flags: ['honnete'] }, outcome: 'Ton cœur reste léger. Ton maître aurait été fier de toi.' },
      ],
    },
    {
      id: 'infirmerie', kind: 'rest', title: 'L’infirmerie du Colisée', x: 2, y: 2,
      text: 'Après le combat, l’infirmerie offre un instant de calme. Une infirmière te tend une compresse ; par la fenêtre, les étoiles commencent à briller.',
      choices: [
        { id: 'mediter', label: 'Méditer face aux étoiles', goTo: 'vol', effects: { flags: ['meditation'] }, outcome: 'Tu perçois le Cosmos de chaque chevalier présent dans le Colisée.' },
        { id: 'rumeur', label: 'Interroger l’infirmière sur les rumeurs', goTo: 'vol', effects: { flags: ['rumeur'] }, outcome: 'Elle a vu des silhouettes en armure noire rôder près de la salle des trophées.' },
      ],
    },
    {
      id: 'vol', kind: 'story', title: 'L’Armure d’or dérobée', x: 3, y: 1,
      text: 'Une explosion secoue le Colisée. Des chevaliers en armure noire s’enfuient avec l’urne de l’Armure d’or ! Dans la tribune d’honneur, la jeune héritière de la Fondation te regarde : « Ramène-la, je t’en prie. »',
      choices: [
        { id: 'poursuivre', label: 'Poursuivre les voleurs dans les couloirs', goTo: 'embuscade', outcome: 'Tu te lances à leur poursuite.' },
        { id: 'jabu', label: 'Envoyer Jabu leur couper la retraite', goTo: 'souterrain', requires: { knight: 'jabu' }, outcome: 'Jabu fonce par les toits et te signale un passage secret.' },
        { id: 'cosmos', label: 'Suivre la trace de leur Cosmos', goTo: 'souterrain', requires: { flag: 'meditation' }, effects: { shards: 20 }, outcome: 'Leur Cosmos sombre te guide sous le Colisée. En chemin, tu ramasses 20 éclats tombés de l’urne.' },
        { id: 'trophees', label: 'Courir à la salle des trophées', goTo: 'souterrain', requires: { flag: 'rumeur' }, outcome: 'Grâce à l’infirmière, tu devances les voleurs.' },
      ],
    },
    {
      id: 'embuscade', kind: 'combat', title: 'Embuscade dans les couloirs', x: 4, y: 0,
      text: 'Deux chevaliers noirs t’attendaient au détour d’un couloir. Leurs armures sont des copies sombres de celles des chevaliers de bronze.',
      choices: [
        { id: 'combattre', label: 'Briser l’embuscade', goTo: 'repaire', combat: 'embuscade', outcome: 'Les chevaliers noirs s’effondrent. Le chemin du repaire est libre.' },
      ],
    },
    {
      id: 'souterrain', kind: 'story', title: 'Le passage souterrain', x: 4, y: 2,
      text: 'Le passage débouche sur un ancien entrepôt. Une silhouette masquée y attend, l’urne d’or posée à ses pieds.',
      choices: [
        { id: 'avancer', label: 'Avancer vers la silhouette', goTo: 'repaire', outcome: 'Tu entres dans la lumière.' },
      ],
    },
    {
      id: 'repaire', kind: 'boss', title: 'Le chef des chevaliers noirs', x: 5, y: 1,
      text: '« Le Sagittaire n’appartient à personne », gronde le chef masqué. Des flammes noires dévorent l’air autour de lui. Derrière, un dernier chevalier noir lève sa garde.',
      choices: [
        { id: 'affronter', label: 'L’affronter', goTo: 'epilogue', combat: 'boss', effects: { flags: ['vainqueur'], stardust: 30 }, outcome: 'Le chef masqué s’effondre et s’enfuit dans l’ombre, laissant l’urne derrière lui. Tu récupères 30 poussières d’étoiles sur son armure brisée.' },
        { id: 'loyaute', label: 'Lui proposer un duel loyal au tournoi', goTo: 'epilogue', requires: { flag: 'honnete' }, effects: { flags: ['paix'], shards: 30 }, outcome: 'Touché par ta droiture, il dépose l’urne et 30 éclats en signe de respect, puis disparaît.' },
      ],
    },
    {
      id: 'epilogue', kind: 'ending', title: 'Épilogue', x: 6, y: 1,
      text: 'L’urne d’or est de retour au Colisée. Le tournoi reprendra demain, mais une question demeure : qui manipule les chevaliers noirs ? Fin du chapitre 1.',
      choices: [],
    },
  ],
}

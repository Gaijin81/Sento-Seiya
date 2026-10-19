import type { Chapter } from './types'

/** Chapter 2 — original adventure: tracking the black knights to their volcanic island. */
export const CHAPTER_TWO: Chapter = {
  id: 'ile-du-phenix',
  title: 'Chapitre 2 · L’ombre du Phénix',
  width: 7,
  height: 3,
  start: 'c2-depart',
  nodes: [
    {
      id: 'c2-depart', kind: 'start', title: 'Une piste brûlante', x: 0, y: 1,
      text: 'Trois jours après le tournoi, un message arrive à la Fondation : un bateau de pêche a vu des armures noires embarquer vers une île volcanique, au large. Le Cosmos qui s’en dégage est aussi chaud qu’une forge.',
      choices: [
        { id: 'port', label: 'Descendre au port chercher un bateau', goTo: 'c2-port', outcome: 'Tu rejoins les quais avant l’aube.' },
        { id: 'fondation', label: 'Fouiller les archives de la Fondation', goTo: 'c2-archives', effects: { flags: ['archives'] }, outcome: 'Les archives gardent la trace de chaque armure distribuée.' },
      ],
    },
    {
      id: 'c2-port', kind: 'story', title: 'Les quais endormis', x: 1, y: 0,
      text: 'Un vieux pêcheur refuse de s’approcher de l’île. « Ceux qui y vont reviennent avec des yeux de braise… quand ils reviennent. » Une barque abandonnée flotte au bout du ponton.',
      choices: [
        { id: 'barque', label: 'Prendre la barque et ramer', goTo: 'c2-traversee', outcome: 'Tu pousses la barque vers le large.' },
        { id: 'shun', label: 'Laisser Shun sonder les eaux avec sa chaîne', goTo: 'c2-traversee', requires: { squad: 'shun' }, effects: { flags: ['chaine'] }, outcome: 'La chaîne d’Andromède frémit : elle a senti un passage sous les falaises.' },
        { id: 'payer', label: 'Payer le pêcheur pour un passage discret (30 éclats)', goTo: 'c2-ile', requires: { minShards: 30 }, effects: { shards: -30, flags: ['discret'] }, outcome: 'Le pêcheur te dépose de nuit, à l’abri des sentinelles. −30 éclats de Cosmos.' },
      ],
    },
    {
      id: 'c2-archives', kind: 'story', title: 'Les archives de la Fondation', x: 1, y: 2,
      text: 'Parmi les dossiers poussiéreux, un nom revient : l’un des orphelins envoyés en formation n’est jamais rentré. Son île d’entraînement est celle que les pêcheurs redoutent.',
      choices: [
        { id: 'carte', label: 'Recopier la carte de l’île', goTo: 'c2-traversee', effects: { flags: ['carte'] }, outcome: 'La carte indique une grotte sous le volcan.' },
        { id: 'hyoga', label: 'Demander à Hyoga de geler un chemin sur la mer', goTo: 'c2-traversee', requires: { squad: 'hyoga' }, effects: { flags: ['carte', 'glace'] }, outcome: 'Hyoga trace un pont de glace. Tu emportes aussi la carte.' },
      ],
    },
    {
      id: 'c2-traversee', kind: 'combat', title: 'Les récifs noirs', x: 2, y: 1,
      text: 'Au pied des falaises, deux chevaliers noirs surgissent des rochers : le Cygne noir et le Dragon noir. Leurs armures fument encore de la lave qui les a forgées.',
      choices: [
        { id: 'combattre', label: 'Forcer le passage', goTo: 'c2-ile', combat: 'c2-recifs', outcome: 'Les gardiens des récifs tombent dans l’écume. L’île s’ouvre devant toi.' },
      ],
    },
    {
      id: 'c2-ile', kind: 'story', title: 'L’île de cendres', x: 3, y: 1,
      text: 'Le sol est chaud sous tes pieds. Au sommet du volcan, une silhouette ailée se découpe contre le ciel rouge. Deux chemins y mènent : la pente à découvert et les profondeurs de la montagne.',
      choices: [
        { id: 'volcan', label: 'Gravir la pente du volcan', goTo: 'c2-volcan', outcome: 'Tu grimpes droit vers le sommet.' },
        { id: 'grotte', label: 'Suivre la carte jusqu’à la grotte', goTo: 'c2-source', requires: { flag: 'carte' }, outcome: 'La carte te guide vers une grotte cachée.' },
        { id: 'ecouter', label: 'Suivre la chaîne de Shun sous les falaises', goTo: 'c2-source', requires: { flag: 'chaine' }, effects: { shards: 20 }, outcome: 'Le passage secret est jonché d’éclats de Cosmos : +20.' },
      ],
    },
    {
      id: 'c2-volcan', kind: 'combat', title: 'La pente de lave', x: 4, y: 0,
      text: 'À mi-pente, trois ombres te barrent la route : l’Andromède noir, le Pégase noir et une sentinelle dont l’armure ruisselle de lave.',
      choices: [
        { id: 'combattre', label: 'Les affronter', goTo: 'c2-sommet', combat: 'c2-volcan', effects: { stardust: 20 }, outcome: 'La sentinelle s’effondre en cendres. Tu récupères 20 poussières d’étoiles sur son armure.' },
      ],
    },
    {
      id: 'c2-source', kind: 'rest', title: 'La source sous le volcan', x: 4, y: 2,
      text: 'Au cœur de la grotte, une source d’eau tiède brille d’un Cosmos apaisant. Sur un rocher, quelqu’un a gravé des dizaines de noms… et une plume rougeoyante y est posée.',
      choices: [
        { id: 'mediter', label: 'Méditer auprès de la source', goTo: 'c2-sommet', effects: { flags: ['apaise'] }, outcome: 'Tu comprends que celui qui gravait ces noms pleurait ses amis perdus.' },
        { id: 'fouiller', label: 'Prendre la plume rougeoyante', goTo: 'c2-sommet', effects: { items: ['plume-phenix'] }, outcome: 'Tu obtiens une Plume de feu (relique rare). Elle est encore chaude.' },
      ],
    },
    {
      id: 'c2-sommet', kind: 'boss', title: 'Le Phénix masqué', x: 5, y: 1,
      text: '« Encore un jouet de la Fondation. » Le Phénix masqué déploie des ailes de flammes. Deux chevaliers noirs l’encadrent. « Sur cette île, j’ai appris que la pitié ne sauve personne. »',
      choices: [
        { id: 'affronter', label: 'Relever le défi', goTo: 'c2-epilogue', combat: 'c2-phenix', effects: { flags: ['phenix-vaincu'], stardust: 40, items: ['cendre-phenix'], recruit: 'ikki' }, outcome: 'Le masque se brise. Le Phénix se relève lentement et te tend la main : « Ton Cosmos ne ment pas. » Ikki rejoint ta collection. Tu gagnes 40 poussières d’étoiles et des Cendres du Phénix (talisman légendaire).' },
        { id: 'parler', label: 'Lui parler des noms gravés dans la grotte', goTo: 'c2-epilogue', requires: { flag: 'apaise' }, effects: { flags: ['phenix-pardon'], shards: 40, recruit: 'ikki' }, outcome: 'Les flammes retombent. Pour la première fois depuis des années, il enlève son masque. Ikki rejoint ta collection, et te confie 40 éclats.' },
      ],
    },
    {
      id: 'c2-epilogue', kind: 'ending', title: 'Épilogue', x: 6, y: 1,
      text: 'Les chevaliers noirs sont dispersés et le Phénix marche désormais à tes côtés. Mais avant de disparaître, l’un d’eux a parlé d’un ordre venu du Sanctuaire lui-même. Fin du chapitre 2.',
      choices: [],
    },
  ],
}

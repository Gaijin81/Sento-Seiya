import type { Chapter } from './types'

/** Chapter 3 — original adventure: climbing to the Sanctuary to find who gave the black knights their orders. */
export const CHAPTER_THREE: Chapter = {
  id: 'marches-du-sanctuaire',
  title: 'Chapitre 3 · Les marches du Sanctuaire',
  width: 7,
  height: 3,
  start: 'c3-depart',
  nodes: [
    {
      id: 'c3-depart', kind: 'start', title: 'Un ordre venu d’en haut', x: 0, y: 1,
      text: 'Le dernier chevalier noir l’a avoué avant de s’enfuir : ses ordres portaient le sceau du Sanctuaire. Au-delà des montagnes grecques, douze temples veillent sur un escalier de marbre. Quelqu’un, là-haut, veut voir la Fondation tomber.',
      choices: [
        { id: 'route', label: 'Prendre la route du village au pied des temples', goTo: 'c3-village', outcome: 'La route serpente entre les oliviers jusqu’à un village de pierre.' },
        { id: 'flammes', label: 'Laisser Ikki ouvrir un chemin à travers la montagne', goTo: 'c3-col', requires: { squad: 'ikki' }, effects: { flags: ['phenix-guide'] }, outcome: 'Ikki connaît les sentiers oubliés : ses flammes éclairent un col que personne n’emprunte plus.' },
        { id: 'col', label: 'Couper par le col enneigé', goTo: 'c3-col', outcome: 'Le vent glacé te fouette le visage, mais le col est désert.' },
      ],
    },
    {
      id: 'c3-village', kind: 'story', title: 'Le village de Rodorio', x: 1, y: 0,
      text: 'Les villageois baissent les yeux sur ton passage. Une jeune fille porte deux lourdes jarres d’eau vers les gardes du Sanctuaire, qui ne lui accordent pas un regard.',
      choices: [
        { id: 'aider', label: 'Aider la jeune fille à porter les jarres', goTo: 'c3-gardes', effects: { flags: ['villageois'], shards: 10 }, outcome: 'Elle te remercie à voix basse et glisse dans ta main 10 éclats de Cosmos trouvés dans les ruines. « Il existe un sentier que les gardes ignorent. »' },
        { id: 'avancer', label: 'Avancer droit vers la porte du Sanctuaire', goTo: 'c3-gardes', outcome: 'Tu marches vers la grande porte sans te retourner.' },
      ],
    },
    {
      id: 'c3-col', kind: 'story', title: 'Le col des statues', x: 1, y: 2,
      text: 'Des statues de chevaliers anciens bordent le col, à demi ensevelies. Plus bas, une cascade gelée bloque l’entrée de ruines oubliées.',
      choices: [
        { id: 'descendre', label: 'Contourner la cascade par les rochers', goTo: 'c3-ruines', outcome: 'Après une longue descente, tu atteins les ruines.' },
        { id: 'shiryu', label: 'Demander à Shiryu de fendre la cascade gelée', goTo: 'c3-ruines', requires: { squad: 'shiryu' }, effects: { flags: ['cascade'], stardust: 15 }, outcome: 'Le poing de Shiryu brise la glace. Derrière, une poussière d’étoiles brille sur la roche : +15.' },
      ],
    },
    {
      id: 'c3-gardes', kind: 'combat', title: 'La porte du Sanctuaire', x: 2, y: 0,
      text: 'Trois gardes en armure de cuir croisent leurs lances. « Aucun chevalier de bronze ne franchit cette porte sans l’accord du Grand Pope. »',
      choices: [
        { id: 'combattre', label: 'Forcer la porte', goTo: 'c3-arene', combat: 'c3-gardes', outcome: 'Les gardes reculent. La porte s’ouvre sur l’arène des apprentis.' },
      ],
    },
    {
      id: 'c3-ruines', kind: 'treasure', title: 'Les ruines oubliées', x: 2, y: 2,
      text: 'Dans un temple effondré repose une armure d’argent brisée, couverte de mousse. Son casque est intact, et une inscription demande de laisser les morts en paix.',
      choices: [
        { id: 'prendre', label: 'Emporter le fragment de casque', goTo: 'c3-arene', effects: { items: ['casque-argent'] }, outcome: 'Tu obtiens un Fragment de casque d’argent (relique rare).' },
        { id: 'honorer', label: 'Respecter l’inscription et se recueillir', goTo: 'c3-arene', effects: { flags: ['respect'], shards: 15 }, outcome: 'Un Cosmos ancien te remercie : 15 éclats de Cosmos se déposent à tes pieds.' },
      ],
    },
    {
      id: 'c3-arene', kind: 'combat', title: 'L’arène des apprentis', x: 3, y: 1,
      text: 'Au centre de l’arène, trois chevaliers d’argent t’attendent, bras croisés. « Le Sanctuaire nous a demandé de ramener ton armure. Avec ou sans toi dedans. »',
      choices: [
        { id: 'combattre', label: 'Affronter les chevaliers d’argent', goTo: 'c3-escalier', combat: 'c3-argent', effects: { stardust: 25 }, outcome: 'Les chevaliers d’argent mettent genou à terre. Tu récupères 25 poussières d’étoiles sur leurs armures fendues.' },
        { id: 'sentier', label: 'Suivre le sentier indiqué par la jeune fille', goTo: 'c3-sentier', requires: { flag: 'villageois' }, outcome: 'Tu te glisses derrière les gradins : le sentier secret commence là.' },
        { id: 'statues', label: 'Passer par le couloir des statues', goTo: 'c3-sentier', requires: { flag: 'phenix-guide' }, outcome: 'Ikki reconnaît le couloir que les statues indiquaient. Vous évitez l’arène.' },
      ],
    },
    {
      id: 'c3-sentier', kind: 'rest', title: 'Le sanctuaire d’Athéna', x: 4, y: 2,
      text: 'Le sentier mène à un petit autel caché, où brûle une flamme qui ne vacille jamais. L’air y est calme, comme si la guerre n’existait pas.',
      choices: [
        { id: 'prier', label: 'Se recueillir devant la flamme', goTo: 'c3-escalier', effects: { flags: ['benediction'] }, outcome: 'Une voix douce murmure : « Montre-leur que la force n’est rien sans la justice. »' },
        { id: 'reposer', label: 'Reprendre des forces et repartir', goTo: 'c3-escalier', effects: { shards: 10 }, outcome: 'Tu repars reposé, et la flamme t’offre 10 éclats de Cosmos.' },
      ],
    },
    {
      id: 'c3-escalier', kind: 'story', title: 'L’escalier des douze temples', x: 4, y: 0,
      text: 'L’escalier de marbre grimpe vers le ciel. Le premier temple se dresse devant toi, ses colonnes dorées éclairées par le soleil couchant. Une présence immense t’y attend.',
      choices: [
        { id: 'monter', label: 'Gravir les marches', goTo: 'c3-maison', outcome: 'Chaque marche pèse plus lourd que la précédente.' },
        { id: 'shun', label: 'Laisser Shun sonder le temple avec sa chaîne', goTo: 'c3-maison', requires: { squad: 'shun' }, effects: { flags: ['chaine-temple'], shards: 15 }, outcome: 'La chaîne revient calme : le gardien n’a pas d’intention meurtrière. Elle rapporte aussi 15 éclats tombés entre les marches.' },
      ],
    },
    {
      id: 'c3-maison', kind: 'boss', title: 'Le gardien de la Première Maison', x: 5, y: 1,
      text: 'Un chevalier d’or se tient entre les colonnes, accompagné de deux apprentis. « Je garde cette maison depuis treize ans. Dis-moi pourquoi je devrais te laisser passer. »',
      choices: [
        { id: 'affronter', label: 'Prouver ta force au combat', goTo: 'c3-epilogue', combat: 'c3-gardien', effects: { flags: ['gardien-vaincu'], stardust: 50, items: ['poussiere-or'] }, outcome: 'Le gardien retient son dernier coup et sourit. « Ton Cosmos a grandi. » Il te laisse passer et t’offre une Poussière d’or (talisman légendaire). +50 poussières d’étoiles.' },
        { id: 'convaincre', label: 'Lui répéter les paroles entendues devant la flamme', goTo: 'c3-epilogue', requires: { flag: 'benediction' }, effects: { flags: ['gardien-allie'], shards: 50, items: ['poussiere-or'] }, outcome: 'Le gardien baisse les yeux. « Alors elle est vivante… » Il s’écarte sans combattre, te confie 50 éclats et une Poussière d’or (talisman légendaire).' },
      ],
    },
    {
      id: 'c3-epilogue', kind: 'ending', title: 'Épilogue', x: 6, y: 1,
      text: 'La Première Maison est franchie. Au-dessus, onze temples et un Grand Pope dont personne n’a vu le visage depuis treize ans. La vraie bataille ne fait que commencer. Fin du chapitre 3.',
      choices: [],
    },
  ],
}

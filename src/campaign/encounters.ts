import type { Position, UnitSetup } from '../combat/types'
import type { Encounter } from './types'

type Stats = { hp: number; attack: number; defense: number; speed: number; cosmos?: number; maxCosmos?: number }

function enemy(id: string, name: string, stats: Stats, position: Position, technique?: UnitSetup['technique']): UnitSetup {
  return {
    id, name, team: 'enemy', hp: stats.hp, maxHp: stats.hp, attack: stats.attack, defense: stats.defense, speed: stats.speed,
    cosmos: stats.cosmos ?? 0, maxCosmos: stats.maxCosmos ?? 4, technique, move: 3, range: 1, position,
  }
}

export const ENCOUNTERS: Record<string, Encounter> = {
  'jabu-duel': {
    id: 'jabu-duel',
    title: 'Duel dans les vestiaires',
    enemies: [enemy('rival-jabu', 'Jabu de la Licorne', { hp: 40, attack: 9, defense: 3, speed: 8, cosmos: 2 }, { x: 6, y: 2 }, { name: 'Galop de la Licorne', cost: 2, power: 6, range: 1 })],
  },
  'premier-tour': {
    id: 'premier-tour',
    title: 'Premier tour du tournoi',
    enemies: [
      enemy('wolf', 'Chevalier du Loup', { hp: 30, attack: 8, defense: 2, speed: 9 }, { x: 6, y: 1 }),
      enemy('bear', 'Chevalier de l’Ours', { hp: 42, attack: 9, defense: 4, speed: 4 }, { x: 6, y: 3 }),
    ],
  },
  embuscade: {
    id: 'embuscade',
    title: 'Embuscade dans les couloirs',
    enemies: [
      enemy('black-1', 'Chevalier noir', { hp: 32, attack: 8, defense: 2, speed: 7, cosmos: 2 }, { x: 6, y: 1 }, { name: 'Onde obscure', cost: 2, power: 6, range: 2 }),
      enemy('black-2', 'Chevalier noir', { hp: 32, attack: 8, defense: 2, speed: 6, cosmos: 2 }, { x: 6, y: 3 }, { name: 'Onde obscure', cost: 2, power: 6, range: 2 }),
    ],
  },
  'c2-recifs': {
    id: 'c2-recifs',
    title: 'Les récifs noirs',
    enemies: [
      enemy('black-swan', 'Cygne noir', { hp: 34, attack: 9, defense: 2, speed: 8, cosmos: 2 }, { x: 6, y: 1 }, { name: 'Blizzard obscur', cost: 2, power: 7, range: 3 }),
      enemy('black-dragon', 'Dragon noir', { hp: 40, attack: 9, defense: 4, speed: 5, cosmos: 2 }, { x: 6, y: 3 }, { name: 'Griffe sombre', cost: 2, power: 7, range: 1 }),
    ],
  },
  'c2-volcan': {
    id: 'c2-volcan',
    title: 'La pente de lave',
    enemies: [
      enemy('black-andromeda', 'Andromède noir', { hp: 36, attack: 8, defense: 3, speed: 7, cosmos: 2 }, { x: 6, y: 1 }, { name: 'Chaîne des ténèbres', cost: 2, power: 6, range: 3 }),
      enemy('black-pegasus', 'Pégase noir', { hp: 36, attack: 10, defense: 2, speed: 10, cosmos: 2 }, { x: 6, y: 3 }, { name: 'Météores noirs', cost: 2, power: 7, range: 2 }),
      enemy('lava-sentinel', 'Sentinelle de lave', { hp: 28, attack: 7, defense: 3, speed: 4 }, { x: 5, y: 2 }),
    ],
  },
  'c2-phenix': {
    id: 'c2-phenix',
    title: 'Le Phénix masqué',
    enemies: [
      enemy('masked-phoenix', 'Phénix masqué', { hp: 80, attack: 12, defense: 5, speed: 11, cosmos: 4, maxCosmos: 7 }, { x: 6, y: 2 }, { name: 'Plumes ardentes', cost: 3, power: 11, range: 2 }),
      enemy('black-4', 'Chevalier noir', { hp: 30, attack: 8, defense: 2, speed: 6, cosmos: 2 }, { x: 5, y: 0 }, { name: 'Onde obscure', cost: 2, power: 6, range: 2 }),
      enemy('black-5', 'Chevalier noir', { hp: 30, attack: 8, defense: 2, speed: 6, cosmos: 2 }, { x: 5, y: 4 }, { name: 'Onde obscure', cost: 2, power: 6, range: 2 }),
    ],
  },
  boss: {
    id: 'boss',
    title: 'Le chef des chevaliers noirs',
    enemies: [
      enemy('black-chief', 'Chef des chevaliers noirs', { hp: 64, attack: 11, defense: 4, speed: 8, cosmos: 3, maxCosmos: 6 }, { x: 6, y: 2 }, { name: 'Flammes noires', cost: 3, power: 9, range: 2 }),
      enemy('black-3', 'Chevalier noir', { hp: 30, attack: 8, defense: 2, speed: 6, cosmos: 2 }, { x: 5, y: 0 }, { name: 'Onde obscure', cost: 2, power: 6, range: 2 }),
    ],
  },
}

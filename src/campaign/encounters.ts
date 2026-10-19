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
  boss: {
    id: 'boss',
    title: 'Le chef des chevaliers noirs',
    enemies: [
      enemy('black-chief', 'Chef des chevaliers noirs', { hp: 64, attack: 11, defense: 4, speed: 8, cosmos: 3, maxCosmos: 6 }, { x: 6, y: 2 }, { name: 'Flammes noires', cost: 3, power: 9, range: 2 }),
      enemy('black-3', 'Chevalier noir', { hp: 30, attack: 8, defense: 2, speed: 6, cosmos: 2 }, { x: 5, y: 0 }, { name: 'Onde obscure', cost: 2, power: 6, range: 2 }),
    ],
  },
}

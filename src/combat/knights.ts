import { DEFAULT_MOVE, DEFAULT_RANGE } from './board'
import type { Technique, UnitSetup } from './types'

export type KnightColor = 'coral' | 'jade' | 'ice' | 'violet' | 'gold'

export type KnightBaseStats = {
  hp: number
  attack: number
  defense: number
  speed: number
  cosmos: number
  maxCosmos: number
}

export type KnightDefinition = {
  id: string
  name: string
  title: string
  rank: string
  glyph: string
  color: KnightColor
  base: KnightBaseStats
  technique: Technique
  starter: boolean
  recruitCost: number
  requiredVictories: number
}

export const KNIGHT_CATALOG: KnightDefinition[] = [
  { id: 'seiya', name: 'Seiya', title: 'Chevalier de Pégase', rank: 'BRONZE', glyph: '天', color: 'coral', starter: true, recruitCost: 0, requiredVictories: 0, base: { hp: 42, attack: 10, defense: 3, speed: 12, cosmos: 4, maxCosmos: 6 }, technique: { name: 'Météores de Pégase', cost: 3, power: 8, range: 2 } },
  { id: 'shiryu', name: 'Shiryu', title: 'Chevalier du Dragon', rank: 'BRONZE', glyph: '龍', color: 'jade', starter: true, recruitCost: 0, requiredVictories: 0, base: { hp: 48, attack: 8, defense: 5, speed: 9, cosmos: 3, maxCosmos: 6 }, technique: { name: 'Colère du Dragon', cost: 3, power: 10, range: 1 } },
  { id: 'hyoga', name: 'Hyoga', title: 'Chevalier du Cygne', rank: 'BRONZE', glyph: '白', color: 'ice', starter: true, recruitCost: 0, requiredVictories: 0, base: { hp: 38, attack: 9, defense: 3, speed: 7, cosmos: 4, maxCosmos: 6 }, technique: { name: 'Poussière de Diamant', cost: 3, power: 9, range: 3 } },
  { id: 'jabu', name: 'Jabu', title: 'Chevalier de la Licorne', rank: 'BRONZE', glyph: '角', color: 'gold', starter: false, recruitCost: 30, requiredVictories: 0, base: { hp: 40, attack: 9, defense: 4, speed: 10, cosmos: 3, maxCosmos: 6 }, technique: { name: 'Galop de la Licorne', cost: 3, power: 8, range: 1 } },
  { id: 'shun', name: 'Shun', title: 'Chevalier d’Andromède', rank: 'BRONZE', glyph: '鎖', color: 'violet', starter: false, recruitCost: 60, requiredVictories: 1, base: { hp: 40, attack: 7, defense: 6, speed: 8, cosmos: 4, maxCosmos: 7 }, technique: { name: 'Chaîne Nébulaire', cost: 3, power: 9, range: 3 } },
  { id: 'ikki', name: 'Ikki', title: 'Chevalier du Phénix', rank: 'BRONZE', glyph: '鳳', color: 'coral', starter: false, recruitCost: 120, requiredVictories: 3, base: { hp: 46, attack: 11, defense: 4, speed: 11, cosmos: 4, maxCosmos: 7 }, technique: { name: 'Ailes du Phénix', cost: 4, power: 12, range: 2 } },
]

export const STARTER_KNIGHT_IDS = KNIGHT_CATALOG.filter((knight) => knight.starter).map((knight) => knight.id)

export function getKnightDefinition(id: string): KnightDefinition | undefined {
  return KNIGHT_CATALOG.find((knight) => knight.id === id)
}

/** Level 1 uses base stats; each extra level adds +4 PV, +1 attack and +1 defense every two levels. */
export function knightStatsAtLevel(definition: KnightDefinition, level: number): KnightBaseStats {
  const bonusLevels = Math.max(1, Math.floor(level)) - 1
  return {
    ...definition.base,
    hp: definition.base.hp + bonusLevels * 4,
    attack: definition.base.attack + bonusLevels,
    defense: definition.base.defense + Math.floor(bonusLevels / 2),
  }
}

export function createKnightUnit(definition: KnightDefinition, level: number): UnitSetup {
  const stats = knightStatsAtLevel(definition, level)
  return {
    id: definition.id,
    move: DEFAULT_MOVE,
    range: DEFAULT_RANGE,
    name: definition.name,
    team: 'player',
    hp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    cosmos: stats.cosmos,
    maxCosmos: stats.maxCosmos,
    technique: { ...definition.technique },
  }
}

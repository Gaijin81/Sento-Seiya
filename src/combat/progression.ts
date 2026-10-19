import type { CombatState } from './types'

export const SAVE_KEY = 'sento-seiya-progress'
export const SAVE_VERSION = 1
export const VICTORY_XP = 50

export type KnightProgress = {
  id: string
  name: string
  level: number
  xp: number
  totalXp: number
}

export type ProgressionState = {
  version: typeof SAVE_VERSION
  playerXp: number
  victories: number
  claimedCombatIds: string[]
  knights: KnightProgress[]
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

const startingKnights = [
  { id: 'seiya', name: 'Seiya' },
  { id: 'shiryu', name: 'Shiryu' },
  { id: 'hyoga', name: 'Hyoga' },
]

export function createInitialProgression(): ProgressionState {
  return {
    version: SAVE_VERSION,
    playerXp: 0,
    victories: 0,
    claimedCombatIds: [],
    knights: startingKnights.map((knight) => ({ ...knight, level: 1, xp: 0, totalXp: 0 })),
  }
}

export function xpRequiredForNextLevel(level: number): number {
  return Math.max(1, level) * 100
}

function isProgressionState(value: unknown): value is ProgressionState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ProgressionState>
  return candidate.version === SAVE_VERSION
    && Number.isFinite(candidate.playerXp) && (candidate.playerXp ?? -1) >= 0
    && Number.isFinite(candidate.victories) && (candidate.victories ?? -1) >= 0
    && Array.isArray(candidate.claimedCombatIds)
    && candidate.claimedCombatIds.every((id) => typeof id === 'string')
    && Array.isArray(candidate.knights)
    && startingKnights.every((starting) => candidate.knights!.some((knight) =>
      knight && knight.id === starting.id
      && typeof knight.name === 'string'
      && Number.isInteger(knight.level) && knight.level >= 1
      && Number.isFinite(knight.xp) && knight.xp >= 0
      && Number.isFinite(knight.totalXp) && knight.totalXp >= 0
      && knight.xp < xpRequiredForNextLevel(knight.level),
    ))
}

export function loadProgression(storage: StorageLike): ProgressionState {
  try {
    const raw = storage.getItem(SAVE_KEY)
    if (!raw) return createInitialProgression()
    const parsed: unknown = JSON.parse(raw)
    if (isProgressionState(parsed)) {
      // Keep the known roster canonical while retaining valid progress values.
      return {
        ...parsed,
        claimedCombatIds: [...new Set(parsed.claimedCombatIds)],
        knights: startingKnights.map((starting) => {
          const saved = parsed.knights.find((knight) => knight.id === starting.id)!
          return { ...starting, level: saved.level, xp: saved.xp, totalXp: saved.totalXp }
        }),
      }
    }
    // Unknown versions and malformed saves safely start from a clean schema.
    return createInitialProgression()
  } catch {
    return createInitialProgression()
  }
}

export function saveProgression(storage: StorageLike, progression: ProgressionState): void {
  storage.setItem(SAVE_KEY, JSON.stringify(progression))
}

export function awardVictoryXp(
  progression: ProgressionState,
  combatId: string,
  combat: Pick<CombatState, 'status' | 'winner'>,
): ProgressionState {
  if (!combatId.trim() || combat.status !== 'victory' || combat.winner !== 'player') return progression
  if (progression.claimedCombatIds.includes(combatId)) return progression

  const knights = progression.knights.map((knight) => {
    let level = knight.level
    let xp = knight.xp + VICTORY_XP
    while (xp >= xpRequiredForNextLevel(level)) {
      xp -= xpRequiredForNextLevel(level)
      level += 1
    }
    return { ...knight, level, xp, totalXp: knight.totalXp + VICTORY_XP }
  })

  return {
    ...progression,
    playerXp: progression.playerXp + VICTORY_XP,
    victories: progression.victories + 1,
    claimedCombatIds: [...progression.claimedCombatIds, combatId],
    knights,
  }
}

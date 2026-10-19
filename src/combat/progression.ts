import type { CombatState } from './types'
import { getKnightDefinition, STARTER_KNIGHT_IDS } from './knights'
import { normalizeEquipment, normalizeInventory, type Loadout } from './equipment'

export const SAVE_KEY = 'sento-seiya-progress'
export const SAVE_VERSION = 3
export const VICTORY_XP = 50
export const VICTORY_SHARDS = 30
export const VICTORY_STARDUST = 10
export const MAX_SQUAD_SIZE = 3

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
  cosmosShards: number
  claimedCombatIds: string[]
  knights: KnightProgress[]
  squad: string[]
  stardust: number
  inventory: string[]
  equipment: Record<string, Loadout>
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export function createKnightProgress(id: string): KnightProgress {
  const definition = getKnightDefinition(id)
  if (!definition) throw new Error(`Unknown knight: ${id}.`)
  return { id, name: definition.name, level: 1, xp: 0, totalXp: 0 }
}

export function createInitialProgression(): ProgressionState {
  return {
    version: SAVE_VERSION,
    playerXp: 0,
    victories: 0,
    cosmosShards: 0,
    claimedCombatIds: [],
    knights: STARTER_KNIGHT_IDS.map(createKnightProgress),
    squad: [...STARTER_KNIGHT_IDS],
    stardust: 0,
    inventory: [],
    equipment: {},
  }
}

export function xpRequiredForNextLevel(level: number): number {
  return Math.max(1, level) * 100
}

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0

function isKnightProgress(value: unknown): value is KnightProgress {
  if (!value || typeof value !== 'object') return false
  const knight = value as Partial<KnightProgress>
  return typeof knight.id === 'string'
    && typeof knight.name === 'string'
    && Number.isInteger(knight.level) && (knight.level ?? 0) >= 1
    && isCount(knight.xp) && isCount(knight.totalXp)
    && knight.xp < xpRequiredForNextLevel(knight.level!)
}

type SharedSaveFields = Pick<ProgressionState, 'playerXp' | 'victories' | 'claimedCombatIds' | 'knights'>

function hasSharedFields(candidate: Record<string, unknown>): candidate is SharedSaveFields & Record<string, unknown> {
  return isCount(candidate.playerXp)
    && isCount(candidate.victories)
    && Array.isArray(candidate.claimedCombatIds)
    && candidate.claimedCombatIds.every((id) => typeof id === 'string')
    && Array.isArray(candidate.knights)
    && candidate.knights.every(isKnightProgress)
    && STARTER_KNIGHT_IDS.every((id) => (candidate.knights as KnightProgress[]).some((knight) => knight.id === id))
}

/** Keep only catalog knights, once each, with canonical names. */
function normalizeKnights(knights: KnightProgress[]): KnightProgress[] {
  const seen = new Set<string>()
  return knights.flatMap((knight) => {
    const definition = getKnightDefinition(knight.id)
    if (!definition || seen.has(knight.id)) return []
    seen.add(knight.id)
    return [{ id: knight.id, name: definition.name, level: knight.level, xp: knight.xp, totalXp: knight.totalXp }]
  })
}

function normalizeSquad(squad: unknown, knights: KnightProgress[]): string[] {
  const owned = new Set(knights.map((knight) => knight.id))
  const ids = Array.isArray(squad) ? squad.filter((id): id is string => typeof id === 'string' && owned.has(id)) : []
  const unique = [...new Set(ids)].slice(0, MAX_SQUAD_SIZE)
  return unique.length > 0 ? unique : STARTER_KNIGHT_IDS.filter((id) => owned.has(id)).slice(0, MAX_SQUAD_SIZE)
}

export function parseProgression(value: unknown): ProgressionState | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (!hasSharedFields(candidate)) return null

  if (candidate.version === 1) {
    // v1 saves only knew the three starters: grant retroactive shards for past victories.
    const knights = normalizeKnights(candidate.knights).filter((knight) => STARTER_KNIGHT_IDS.includes(knight.id))
    return {
      version: SAVE_VERSION,
      playerXp: candidate.playerXp,
      victories: candidate.victories,
      cosmosShards: candidate.victories * VICTORY_SHARDS,
      claimedCombatIds: [...new Set(candidate.claimedCombatIds)],
      knights,
      squad: normalizeSquad(STARTER_KNIGHT_IDS, knights),
      stardust: 0,
      inventory: [],
      equipment: {},
    }
  }

  if ((candidate.version === 2 || candidate.version === SAVE_VERSION) && isCount(candidate.cosmosShards)) {
    // v2 saves predate equipment: they start with no stardust and an empty inventory.
    const current = candidate.version === SAVE_VERSION
    if (current && (!isCount(candidate.stardust) || !Array.isArray(candidate.inventory))) return null
    const knights = normalizeKnights(candidate.knights)
    const inventory = current ? normalizeInventory(candidate.inventory as unknown[]) : []
    return {
      version: SAVE_VERSION,
      playerXp: candidate.playerXp,
      victories: candidate.victories,
      cosmosShards: candidate.cosmosShards,
      claimedCombatIds: [...new Set(candidate.claimedCombatIds)],
      knights,
      squad: normalizeSquad(candidate.squad, knights),
      stardust: current ? candidate.stardust as number : 0,
      inventory,
      equipment: current ? normalizeEquipment(candidate.equipment, knights, inventory) : {},
    }
  }

  return null
}

export function loadProgression(storage: StorageLike): ProgressionState {
  try {
    const raw = storage.getItem(SAVE_KEY)
    if (!raw) return createInitialProgression()
    // Unknown versions and malformed saves safely start from a clean schema.
    return parseProgression(JSON.parse(raw)) ?? createInitialProgression()
  } catch {
    return createInitialProgression()
  }
}

export function saveProgression(storage: StorageLike, progression: ProgressionState): void {
  storage.setItem(SAVE_KEY, JSON.stringify(progression))
}

/** Rewards the player and the knights that fought (the current squad by default). */
export function awardVictoryXp(
  progression: ProgressionState,
  combatId: string,
  combat: Pick<CombatState, 'status' | 'winner'>,
  participantIds: string[] = progression.squad,
): ProgressionState {
  if (!combatId.trim() || combat.status !== 'victory' || combat.winner !== 'player') return progression
  if (progression.claimedCombatIds.includes(combatId)) return progression

  const participants = new Set(participantIds)
  const knights = progression.knights.map((knight) => {
    if (!participants.has(knight.id)) return knight
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
    cosmosShards: progression.cosmosShards + VICTORY_SHARDS,
    stardust: progression.stardust + VICTORY_STARDUST,
    claimedCombatIds: [...progression.claimedCombatIds, combatId],
    knights,
  }
}

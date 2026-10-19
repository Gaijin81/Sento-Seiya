import { ENCOUNTERS } from '../campaign/encounters'
import { createCombat, getActiveUnit, performAction } from '../combat/engine'
import { createKnightUnit, getKnightDefinition } from '../combat/knights'
import { ARENA_BOARD, playActionAndResolveAi } from '../combat/session'
import type { CombatAction, CombatState, Position, UnitSetup } from '../combat/types'

export type LocalMode = 'pvp' | 'coop'
export type Controller = 'p1' | 'p2' | 'ai'

/** Every knight fights at the same level in local modes, for fairness. */
export const VERSUS_LEVEL = 3
export const MAX_PICKS: Record<LocalMode, number> = { pvp: 3, coop: 2 }

const LEFT_SPAWNS: Position[] = [{ x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 3 }, { x: 1, y: 2 }]
const RIGHT_SPAWNS: Position[] = [{ x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 1 }]

export type LocalMatch = {
  mode: LocalMode
  combat: CombatState
  controllers: Record<string, Controller>
}

export type MatchResult = { ok: true; match: LocalMatch } | { ok: false; error: string }

function knight(id: string): UnitSetup {
  const definition = getKnightDefinition(id)
  if (!definition) throw new Error(`Unknown knight: ${id}.`)
  return createKnightUnit(definition, VERSUS_LEVEL)
}

function validatePicks(mode: LocalMode, picks: string[], player: string): string | null {
  if (picks.length === 0) return `${player} doit choisir au moins un chevalier.`
  if (picks.length > MAX_PICKS[mode]) return `${player} ne peut engager que ${MAX_PICKS[mode]} chevalier(s).`
  if (new Set(picks).size !== picks.length) return `${player} a choisi deux fois le même chevalier.`
  if (picks.some((id) => !getKnightDefinition(id))) return 'Chevalier inconnu.'
  return null
}

/** PvP: player 2 commands the right side (team `enemy`). Coop: both players share the left side against the AI. */
export function createLocalMatch(mode: LocalMode, p1: string[], p2: string[]): MatchResult {
  const error = validatePicks(mode, p1, 'Joueur 1') ?? validatePicks(mode, p2, 'Joueur 2')
  if (error) return { ok: false, error }
  const controllers: Record<string, Controller> = {}
  let units: UnitSetup[]

  if (mode === 'pvp') {
    const left = p1.map((id, index) => ({ ...knight(id), position: { ...LEFT_SPAWNS[index] } }))
    const right = p2.map((id, index) => {
      const unit = knight(id)
      return { ...unit, id: 'p2-' + id, name: unit.name + ' (J2)', team: 'enemy' as const, position: { ...RIGHT_SPAWNS[index] } }
    })
    left.forEach((unit) => { controllers[unit.id] = 'p1' })
    right.forEach((unit) => { controllers[unit.id] = 'p2' })
    units = [...left, ...right]
  } else {
    if (p1.some((id) => p2.includes(id))) return { ok: false, error: 'En coop, un chevalier ne peut être choisi que par un seul joueur.' }
    const allies = [...p1, ...p2].map((id, index) => ({ ...knight(id), position: { ...LEFT_SPAWNS[index] } }))
    allies.forEach((unit) => { controllers[unit.id] = p1.includes(unit.id) ? 'p1' : 'p2' })
    const enemies = ENCOUNTERS.boss.enemies
    enemies.forEach((unit) => { controllers[unit.id] = 'ai' })
    units = [...allies, ...enemies]
  }

  return { ok: true, match: { mode, combat: createCombat(units, ARENA_BOARD), controllers } }
}

export function activeController(match: LocalMatch): Controller | null {
  const active = getActiveUnit(match.combat)
  return active && match.combat.status === 'ongoing' ? match.controllers[active.id] ?? null : null
}

export function playLocalAction(match: LocalMatch, actorId: string, action: CombatAction): MatchResult {
  if (match.controllers[actorId] === 'ai') return { ok: false, error: 'Cette unité est contrôlée par l’IA.' }
  const result = match.mode === 'pvp' ? performAction(match.combat, actorId, action) : playActionAndResolveAi(match.combat, actorId, action)
  return result.ok ? { ok: true, match: { ...match, combat: result.state } } : { ok: false, error: result.error }
}

/** The device must change hands when control passes from one human player to the other. */
export function needsHandoff(previous: Controller | null, next: Controller | null): boolean {
  return previous !== null && next !== null && previous !== 'ai' && next !== 'ai' && previous !== next
}

export function winnerLabel(match: LocalMatch): string | null {
  if (match.combat.status === 'ongoing') return null
  if (match.mode === 'pvp') return match.combat.status === 'victory' ? 'Joueur 1' : 'Joueur 2'
  return match.combat.status === 'victory' ? 'Les deux joueurs' : 'L’IA'
}

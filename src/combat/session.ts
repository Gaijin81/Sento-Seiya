import { chooseAiAction, createCombat, getActiveUnit, performAction } from './engine'
import { createKnightUnit, getKnightDefinition } from './knights'
import type { ProgressionState } from './progression'
import type { ActionResult, Board, CombatAction, CombatState, Position, UnitSetup } from './types'

const demoUnits: UnitSetup[] = [
  { id: 'seiya', name: 'Seiya', team: 'player', hp: 42, maxHp: 42, attack: 10, defense: 3, speed: 12, cosmos: 4, maxCosmos: 6, technique: { name: 'Météores de Pégase', cost: 3, power: 8, range: 2 }, move: 3, range: 1, position: { x: 0, y: 2 } },
  { id: 'shiryu', name: 'Shiryu', team: 'player', hp: 48, maxHp: 48, attack: 8, defense: 5, speed: 9, cosmos: 3, maxCosmos: 6, technique: { name: 'Colère du Dragon', cost: 3, power: 10, range: 1 }, move: 3, range: 1, position: { x: 0, y: 1 } },
  { id: 'hyoga', name: 'Hyoga', team: 'player', hp: 38, maxHp: 38, attack: 9, defense: 3, speed: 7, cosmos: 4, maxCosmos: 6, technique: { name: 'Poussière de Diamant', cost: 3, power: 9, range: 3 }, move: 3, range: 1, position: { x: 0, y: 3 } },
  { id: 'black-pega', name: 'Chevalier noir', team: 'enemy', hp: 34, maxHp: 34, attack: 8, defense: 2, speed: 6, cosmos: 2, maxCosmos: 4, technique: { name: 'Onde obscure', cost: 2, power: 6, range: 2 }, move: 3, range: 1, position: { x: 6, y: 1 } },
  { id: 'sanctuary-guard', name: 'Garde du Sanctuaire', team: 'enemy', hp: 30, maxHp: 30, attack: 7, defense: 3, speed: 5, cosmos: 0, maxCosmos: 2, move: 3, range: 1, position: { x: 6, y: 3 } },
]

/** Sanctuary arena: 7×5 cells with two broken pillars in the middle. */
export const ARENA_BOARD: Board = { width: 7, height: 5, obstacles: [{ x: 3, y: 1 }, { x: 3, y: 3 }] }
export const PLAYER_SPAWNS: Position[] = [{ x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 3 }]

export const DEMO_ENEMIES: UnitSetup[] = demoUnits.filter((unit) => unit.team === 'enemy')

export function createDemoCombat(): CombatState {
  return createCombat(demoUnits, ARENA_BOARD)
}

/** Builds the player's side from the saved squad, with stats scaled to each knight's level. */
export function createSquadUnits(progression: ProgressionState): UnitSetup[] {
  return progression.squad.flatMap((id) => {
    const definition = getKnightDefinition(id)
    const knight = progression.knights.find((entry) => entry.id === id)
    return definition && knight ? [createKnightUnit(definition, knight.level)] : []
  }).slice(0, PLAYER_SPAWNS.length).map((unit, index) => ({ ...unit, position: { ...PLAYER_SPAWNS[index] } }))
}

export function createSquadCombat(progression: ProgressionState): CombatState {
  return createCombat([...createSquadUnits(progression), ...DEMO_ENEMIES], ARENA_BOARD)
}

export function playActionAndResolveAi(state: CombatState, actorId: string, action: CombatAction): ActionResult {
  const first = performAction(state, actorId, action)
  if (!first.ok) return first
  let current = first.state
  // Each enemy activation is at most a move plus one ending action.
  let safety = current.turnOrder.length * 2
  while (current.status === 'ongoing' && safety > 0) {
    const active = getActiveUnit(current)
    if (!active || active.team !== 'enemy') break
    const aiAction = chooseAiAction(current, active.id)
    if (!aiAction) break
    const result = performAction(current, active.id, aiAction)
    if (!result.ok) break
    current = result.state
    safety -= 1
  }
  return { ok: true, state: current }
}

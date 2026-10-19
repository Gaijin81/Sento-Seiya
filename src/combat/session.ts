import { chooseAiAction, createCombat, getActiveUnit, performAction } from './engine'
import { createKnightUnit, getKnightDefinition } from './knights'
import type { ProgressionState } from './progression'
import type { ActionResult, CombatAction, CombatState, UnitSetup } from './types'

const demoUnits: UnitSetup[] = [
  { id: 'seiya', name: 'Seiya', team: 'player', hp: 42, maxHp: 42, attack: 10, defense: 3, speed: 12, cosmos: 4, maxCosmos: 6, technique: { name: 'Météores de Pégase', cost: 3, power: 8 } },
  { id: 'shiryu', name: 'Shiryu', team: 'player', hp: 48, maxHp: 48, attack: 8, defense: 5, speed: 9, cosmos: 3, maxCosmos: 6, technique: { name: 'Colère du Dragon', cost: 3, power: 10 } },
  { id: 'hyoga', name: 'Hyoga', team: 'player', hp: 38, maxHp: 38, attack: 9, defense: 3, speed: 7, cosmos: 4, maxCosmos: 6, technique: { name: 'Poussière de Diamant', cost: 3, power: 9 } },
  { id: 'black-pega', name: 'Chevalier noir', team: 'enemy', hp: 34, maxHp: 34, attack: 8, defense: 2, speed: 6, cosmos: 2, maxCosmos: 4, technique: { name: 'Onde obscure', cost: 2, power: 6 } },
  { id: 'sanctuary-guard', name: 'Garde du Sanctuaire', team: 'enemy', hp: 30, maxHp: 30, attack: 7, defense: 3, speed: 5, cosmos: 0, maxCosmos: 2 },
]

export const DEMO_ENEMIES: UnitSetup[] = demoUnits.filter((unit) => unit.team === 'enemy')

export function createDemoCombat(): CombatState {
  return createCombat(demoUnits)
}

/** Builds the player's side from the saved squad, with stats scaled to each knight's level. */
export function createSquadUnits(progression: ProgressionState): UnitSetup[] {
  return progression.squad.flatMap((id) => {
    const definition = getKnightDefinition(id)
    const knight = progression.knights.find((entry) => entry.id === id)
    return definition && knight ? [createKnightUnit(definition, knight.level)] : []
  })
}

export function createSquadCombat(progression: ProgressionState): CombatState {
  return createCombat([...createSquadUnits(progression), ...DEMO_ENEMIES])
}

export function playActionAndResolveAi(state: CombatState, actorId: string, action: CombatAction): ActionResult {
  const first = performAction(state, actorId, action)
  if (!first.ok) return first
  let current = first.state
  let safety = current.turnOrder.length
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

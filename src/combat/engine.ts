import type {
  ActionResult,
  CombatAction,
  CombatState,
  CombatUnit,
  Team,
  UnitSetup,
} from './types'

const MIN_STAT = 0

function assertValidUnit(unit: UnitSetup): void {
  if (!unit.id.trim() || !unit.name.trim()) throw new Error('Unit id and name are required.')
  if (!Number.isFinite(unit.hp) || !Number.isFinite(unit.maxHp) || unit.maxHp <= 0 || unit.hp < 0 || unit.hp > unit.maxHp) {
    throw new Error(`Invalid HP values for ${unit.id}.`)
  }
  for (const [name, value] of Object.entries({
    attack: unit.attack,
    defense: unit.defense,
    speed: unit.speed,
    cosmos: unit.cosmos,
    maxCosmos: unit.maxCosmos,
  })) {
    if (!Number.isFinite(value) || value < MIN_STAT) throw new Error(`Invalid ${name} value for ${unit.id}.`)
  }
  if (unit.cosmos > unit.maxCosmos) throw new Error(`Cosmos exceeds maximum for ${unit.id}.`)
  if (unit.technique && (
    !unit.technique.name.trim() ||
    !Number.isFinite(unit.technique.cost) ||
    !Number.isFinite(unit.technique.power) ||
    unit.technique.cost < 0 ||
    unit.technique.power < 0
  )) {
    throw new Error(`Invalid technique for ${unit.id}.`)
  }
}

export function createCombat(setups: UnitSetup[]): CombatState {
  if (setups.length < 2) throw new Error('Combat requires at least two units.')
  const ids = new Set<string>()
  for (const unit of setups) {
    assertValidUnit(unit)
    if (ids.has(unit.id)) throw new Error(`Duplicate unit id: ${unit.id}.`)
    ids.add(unit.id)
  }
  const teams = new Set(setups.map((unit) => unit.team))
  if (!teams.has('player') || !teams.has('enemy')) throw new Error('Combat requires player and enemy teams.')
  if (!setups.some((unit) => unit.team === 'player' && unit.hp > 0)) throw new Error('Player team needs a living unit.')
  if (!setups.some((unit) => unit.team === 'enemy' && unit.hp > 0)) throw new Error('Enemy team needs a living unit.')

  const units: CombatUnit[] = setups.map((unit) => ({ ...unit, technique: unit.technique ? { ...unit.technique } : undefined, guarding: false }))
  const turnOrder = [...units]
    .sort((a, b) => b.speed - a.speed || setups.findIndex((unit) => unit.id === a.id) - setups.findIndex((unit) => unit.id === b.id))
    .map((unit) => unit.id)

  return { units, turnOrder, activeIndex: 0, round: 1, status: 'ongoing', winner: null, log: [] }
}

export function getActiveUnit(state: CombatState): CombatUnit | null {
  if (state.status !== 'ongoing') return null
  const id = state.turnOrder[state.activeIndex]
  return state.units.find((unit) => unit.id === id && unit.hp > 0) ?? null
}

function livingTeamExists(units: CombatUnit[], team: Team): boolean {
  return units.some((unit) => unit.team === team && unit.hp > 0)
}

function appendLog(state: CombatState, actor: CombatUnit, action: CombatAction, message: string): CombatState {
  return { ...state, log: [...state.log, { round: state.round, actorId: actor.id, action: action.type, message }] }
}

function finishOrAdvance(state: CombatState): CombatState {
  const playerAlive = livingTeamExists(state.units, 'player')
  const enemyAlive = livingTeamExists(state.units, 'enemy')
  if (!playerAlive || !enemyAlive) {
    return { ...state, status: playerAlive ? 'victory' : 'defeat', winner: playerAlive ? 'player' : 'enemy' }
  }

  let nextIndex = state.activeIndex
  let wrapped = false
  for (let attempts = 0; attempts < state.turnOrder.length; attempts += 1) {
    nextIndex += 1
    if (nextIndex >= state.turnOrder.length) {
      nextIndex = 0
      wrapped = true
    }
    const nextId = state.turnOrder[nextIndex]
    if (state.units.some((unit) => unit.id === nextId && unit.hp > 0)) {
      return { ...state, activeIndex: nextIndex, round: state.round + (wrapped ? 1 : 0) }
    }
  }
  return state
}

function updateUnit(state: CombatState, updated: CombatUnit): CombatState {
  return { ...state, units: state.units.map((unit) => unit.id === updated.id ? updated : unit) }
}

function damageTarget(state: CombatState, actor: CombatUnit, target: CombatUnit, power: number, action: CombatAction): CombatState {
  const rawDamage = Math.max(1, power - target.defense)
  const damage = target.guarding ? Math.max(1, Math.ceil(rawDamage / 2)) : rawDamage
  const updatedTarget = { ...target, hp: Math.max(0, target.hp - damage), guarding: false }
  const next = updateUnit(state, updatedTarget)
  return appendLog(next, actor, action, `${actor.name} inflige ${damage} dégâts à ${target.name}.`)
}

/** Apply one legal action for the current unit. Invalid actions return the original state unchanged. */
export function performAction(state: CombatState, actorId: string, action: CombatAction): ActionResult {
  if (state.status !== 'ongoing') return { ok: false, error: 'Combat is already finished.', state }
  const actor = getActiveUnit(state)
  if (!actor || actor.id !== actorId) return { ok: false, error: 'It is not this unit\'s turn.', state }

  let next: CombatState
  if (action.type === 'guard') {
    next = updateUnit(state, { ...actor, guarding: true })
    next = appendLog(next, actor, action, `${actor.name} se met en garde.`)
  } else if (action.type === 'focus') {
    const gained = Math.min(2, actor.maxCosmos - actor.cosmos)
    next = updateUnit(state, { ...actor, cosmos: actor.cosmos + gained })
    next = appendLog(next, actor, action, `${actor.name} concentre son Cosmos (+${gained}).`)
  } else {
    const targetId = action.targetId
    const target = state.units.find((unit) => unit.id === targetId)
    if (!target || target.hp <= 0) return { ok: false, error: 'Target is missing or already defeated.', state }
    if (target.team === actor.team) return { ok: false, error: 'You cannot attack an ally.', state }

    if (action.type === 'attack') {
      next = damageTarget(state, actor, target, actor.attack, action)
    } else {
      const technique = actor.technique
      if (!technique) return { ok: false, error: 'This unit has no technique.', state }
      if (actor.cosmos < technique.cost) return { ok: false, error: 'Not enough Cosmos.', state }
      const paidActor = { ...actor, cosmos: actor.cosmos - technique.cost }
      next = updateUnit(state, paidActor)
      const currentTarget = next.units.find((unit) => unit.id === target.id)!
      next = damageTarget(next, paidActor, currentTarget, actor.attack + technique.power, action)
      const lastLog = next.log[next.log.length - 1]
      const dealtDamage = target.hp - (next.units.find((unit) => unit.id === target.id)?.hp ?? target.hp)\n      next = { ...next, log: [...next.log.slice(0, -1), { ...lastLog, message: `${actor.name} utilise ${technique.name} et inflige ${dealtDamage} dégâts à ${target.name}.` }] }
    }
  }

  next = finishOrAdvance(next)
  return { ok: true, state: next }
}

/** Simple deterministic enemy policy for the first playable prototype. */
export function chooseAiAction(state: CombatState, actorId: string): CombatAction | null {
  const actor = state.units.find((unit) => unit.id === actorId && unit.hp > 0)
  if (!actor || actor.team !== 'enemy' || state.status !== 'ongoing') return null
  const target = state.units
    .filter((unit) => unit.team !== actor.team && unit.hp > 0)
    .sort((a, b) => a.hp - b.hp || a.id.localeCompare(b.id))[0]
  if (!target) return null
  if (actor.technique && actor.cosmos >= actor.technique.cost && actor.technique.power > 0) {
    return { type: 'technique', targetId: target.id }
  }
  return { type: 'attack', targetId: target.id }
}

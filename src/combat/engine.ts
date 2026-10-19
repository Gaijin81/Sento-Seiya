import { attackRange, COVER_REDUCTION, distance, isInside, isObstacle, isWithinRange, reachableCells, samePosition, techniqueRange, terrainAt } from './board'
import type {
  ActionResult,
  Board,
  CombatAction,
  CombatState,
  CombatUnit,
  Position,
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

function assertValidBoard(board: Board, setups: UnitSetup[]): void {
  if (!Number.isInteger(board.width) || !Number.isInteger(board.height) || board.width < 2 || board.height < 1) {
    throw new Error('Invalid board size.')
  }
  for (const obstacle of board.obstacles) {
    if (!isInside(board, obstacle)) throw new Error('Obstacle outside the board.')
  }
  for (const [index, cell] of (board.terrain ?? []).entries()) {
    if (!isInside(board, cell) || isObstacle(board, cell)) throw new Error('Terrain must be on a free cell of the board.')
    if (board.terrain!.findIndex((other) => samePosition(other, cell)) !== index) throw new Error('Two terrain cells share a position.')
  }
  const occupied: { x: number; y: number }[] = []
  for (const unit of setups) {
    const position = unit.position
    if (!position || !isInside(board, position)) throw new Error(`Unit ${unit.id} needs a position on the board.`)
    if (isObstacle(board, position)) throw new Error(`Unit ${unit.id} is placed on an obstacle.`)
    if (occupied.some((cell) => samePosition(cell, position))) throw new Error(`Two units share a cell at ${position.x},${position.y}.`)
    occupied.push(position)
    for (const [name, value] of Object.entries({ move: unit.move, range: unit.range, techniqueRange: unit.technique?.range })) {
      if (value !== undefined && (!Number.isInteger(value) || value < 0)) throw new Error(`Invalid ${name} for ${unit.id}.`)
    }
  }
}

export function createCombat(setups: UnitSetup[], board?: Board): CombatState {
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
  if (board) assertValidBoard(board, setups)

  const units: CombatUnit[] = setups.map((unit) => ({
    ...unit,
    technique: unit.technique ? { ...unit.technique } : undefined,
    position: unit.position ? { ...unit.position } : undefined,
    guarding: false,
  }))
  const turnOrder = [...units]
    .sort((a, b) => b.speed - a.speed || setups.findIndex((unit) => unit.id === a.id) - setups.findIndex((unit) => unit.id === b.id))
    .map((unit) => unit.id)

  const combatBoard = board ? { ...board, obstacles: board.obstacles.map((cell) => ({ ...cell })), terrain: board.terrain?.map((cell) => ({ ...cell })) } : undefined
  return { units, turnOrder, activeIndex: 0, round: 1, status: 'ongoing', winner: null, log: [], board: combatBoard, moved: false }
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
      return { ...state, activeIndex: nextIndex, round: state.round + (wrapped ? 1 : 0), moved: false }
    }
  }
  return state
}

function updateUnit(state: CombatState, updated: CombatUnit): CombatState {
  return { ...state, units: state.units.map((unit) => unit.id === updated.id ? updated : unit) }
}

function damageTarget(state: CombatState, actor: CombatUnit, target: CombatUnit, power: number, action: CombatAction): CombatState {
  const covered = terrainAt(state.board, target.position) === 'cover'
  const rawDamage = Math.max(1, power - target.defense - (covered ? COVER_REDUCTION : 0))
  const damage = target.guarding ? Math.max(1, Math.ceil(rawDamage / 2)) : rawDamage
  const updatedTarget = { ...target, hp: Math.max(0, target.hp - damage), guarding: false }
  const next = updateUnit(state, updatedTarget)
  return appendLog(next, actor, action, `${actor.name} inflige ${damage} dégâts à ${target.name}${covered ? ' (à couvert)' : ''}.`)
}

/** Apply one legal action for the current unit. Invalid actions return the original state unchanged. */
export function performAction(state: CombatState, actorId: string, action: CombatAction): ActionResult {
  if (state.status !== 'ongoing') return { ok: false, error: 'Combat is already finished.', state }
  const actor = getActiveUnit(state)
  if (!actor || actor.id !== actorId) return { ok: false, error: 'It is not this unit\'s turn.', state }

  let next: CombatState
  if (action.type === 'move') {
    if (!state.board) return { ok: false, error: 'Aucun plateau : déplacement impossible.', state }
    if (state.moved) return { ok: false, error: 'Ce chevalier s’est déjà déplacé ce tour-ci.', state }
    if (!reachableCells(state, actor.id).some((cell) => samePosition(cell, action.to))) {
      return { ok: false, error: 'Case hors de portée de déplacement.', state }
    }
    const spring = terrainAt(state.board, action.to) === 'cosmos' && actor.cosmos < actor.maxCosmos
    next = updateUnit(state, { ...actor, position: { ...action.to }, cosmos: spring ? actor.cosmos + 1 : actor.cosmos })
    next = appendLog({ ...next, moved: true }, actor, action, `${actor.name} se déplace en ${action.to.x + 1}-${action.to.y + 1}${spring ? ' et puise dans la source de Cosmos (+1)' : ''}.`)
    return { ok: true, state: next }
  } else if (action.type === 'wait') {
    next = appendLog(state, actor, action, `${actor.name} termine son tour.`)
  } else if (action.type === 'guard') {
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

    const range = action.type === 'attack' ? attackRange(actor) : techniqueRange(actor)
    if (!isWithinRange(state, actor, target, range)) return { ok: false, error: 'Cible hors de portée.', state }

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
      const dealtDamage = target.hp - (next.units.find((unit) => unit.id === target.id)?.hp ?? target.hp)
      next = { ...next, log: [...next.log.slice(0, -1), { ...lastLog, message: `${actor.name} utilise ${technique.name} et inflige ${dealtDamage} dégâts à ${target.name}.` }] }
    }
  }

  next = finishOrAdvance(next)
  return { ok: true, state: next }
}

function pickTarget(targets: CombatUnit[]): CombatUnit | undefined {
  return [...targets].sort((a, b) => a.hp - b.hp || a.id.localeCompare(b.id))[0]
}

const TERRAIN_VALUE = { cover: 2, height: 1, cosmos: 1 } as const

/** How attractive ending a move on `cell` is: being able to strike dominates, then terrain, then closing the gap. */
function cellScore(state: CombatState, actor: CombatUnit, cell: Position, foes: CombatUnit[]): number {
  const shadow = { ...actor, position: cell }
  const technique = actor.technique
  const canUseTechnique = Boolean(technique && technique.power > 0 && actor.cosmos >= technique.cost)
  const range = Math.max(attackRange(actor), canUseTechnique ? techniqueRange(actor) : 0)
  const strikes = foes.some((foe) => isWithinRange(state, shadow, foe, range))
  const kind = terrainAt(state.board, cell)
  const moving = !samePosition(cell, actor.position!)
  const terrain = !kind || (kind === 'cosmos' && (!moving || actor.cosmos >= actor.maxCosmos)) ? 0 : TERRAIN_VALUE[kind]
  const gap = Math.min(...foes.map((foe) => distance(cell, foe.position!)))
  return strikes ? 100 + terrain : terrain - gap * 10
}

/**
 * Deterministic tactical policy usable for any team. Before acting, it moves when a reachable cell
 * scores better (a cell to strike from, ideally on cover, high ground or a Cosmos spring); then it strikes
 * the weakest foe in range (technique first when affordable), otherwise ends the turn.
 */
export function chooseTacticalAction(state: CombatState, actorId: string): CombatAction | null {
  if (state.status !== 'ongoing') return null
  const actor = state.units.find((unit) => unit.id === actorId && unit.hp > 0)
  if (!actor) return null
  const alreadyMoved = state.moved && getActiveUnit(state)?.id === actorId
  const foes = state.units.filter((unit) => unit.team !== actor.team && unit.hp > 0)
  if (foes.length === 0) return null

  if (state.board && actor.position && !alreadyMoved) {
    const origin = actor.position
    const here = cellScore(state, actor, origin, foes)
    const best = reachableCells(state, actor.id)
      .map((cell) => ({ cell, score: cellScore(state, actor, cell, foes) }))
      .sort((a, b) => b.score - a.score || a.cell.y - b.cell.y || a.cell.x - b.cell.x)[0]
    if (best && best.score > here) return { type: 'move', to: best.cell }
  }

  const technique = actor.technique
  if (technique && technique.power > 0 && actor.cosmos >= technique.cost) {
    const target = pickTarget(foes.filter((foe) => isWithinRange(state, actor, foe, techniqueRange(actor))))
    if (target) return { type: 'technique', targetId: target.id }
  }
  const target = pickTarget(foes.filter((foe) => isWithinRange(state, actor, foe, attackRange(actor))))
  if (target) return { type: 'attack', targetId: target.id }
  return { type: 'wait' }
}

/** Simple deterministic enemy policy. */
export function chooseAiAction(state: CombatState, actorId: string): CombatAction | null {
  const actor = state.units.find((unit) => unit.id === actorId && unit.hp > 0)
  if (!actor || actor.team !== 'enemy' || state.status !== 'ongoing') return null
  return chooseTacticalAction(state, actorId)
}

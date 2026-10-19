import type { Board, CombatState, CombatUnit, Position } from './types'

export const DEFAULT_MOVE = 3
export const DEFAULT_RANGE = 1

export function samePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y
}

/** Grid distance without diagonals (Manhattan). */
export function distance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function isInside(board: Board, position: Position): boolean {
  return Number.isInteger(position.x) && Number.isInteger(position.y) &&
    position.x >= 0 && position.y >= 0 && position.x < board.width && position.y < board.height
}

export function isObstacle(board: Board, position: Position): boolean {
  return board.obstacles.some((obstacle) => samePosition(obstacle, position))
}

export function unitAt(state: CombatState, position: Position): CombatUnit | undefined {
  return state.units.find((unit) => unit.hp > 0 && unit.position && samePosition(unit.position, position))
}

export function attackRange(unit: CombatUnit): number {
  return unit.range ?? DEFAULT_RANGE
}

export function techniqueRange(unit: CombatUnit): number {
  return unit.technique?.range ?? attackRange(unit)
}

/** True when there is no board (legacy duel) or the target sits within `range` cells. */
export function isWithinRange(state: CombatState, actor: CombatUnit, target: CombatUnit, range: number): boolean {
  if (!state.board) return true
  if (!actor.position || !target.position) return false
  return distance(actor.position, target.position) <= range
}

const STEPS: Position[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]

/** Cells the unit can end its move on: orthogonal steps, blocked by obstacles and living units. */
export function reachableCells(state: CombatState, unitId: string): Position[] {
  const board = state.board
  const unit = state.units.find((entry) => entry.id === unitId && entry.hp > 0)
  if (!board || !unit?.position) return []
  const budget = unit.move ?? DEFAULT_MOVE
  const key = (position: Position) => `${position.x},${position.y}`
  const seen = new Set([key(unit.position)])
  const result: Position[] = []
  let frontier = [unit.position]
  for (let step = 0; step < budget; step += 1) {
    const next: Position[] = []
    for (const cell of frontier) {
      for (const delta of STEPS) {
        const candidate = { x: cell.x + delta.x, y: cell.y + delta.y }
        if (seen.has(key(candidate)) || !isInside(board, candidate) || isObstacle(board, candidate) || unitAt(state, candidate)) continue
        seen.add(key(candidate))
        next.push(candidate)
        result.push(candidate)
      }
    }
    frontier = next
  }
  return result.sort((a, b) => a.y - b.y || a.x - b.x)
}

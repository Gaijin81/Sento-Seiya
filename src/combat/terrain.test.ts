import { describe, expect, it } from 'vitest'
import { isWithinRange, terrainAt } from './board'
import { createCombat, performAction } from './engine'
import { ARENA_BOARD } from './session'
import type { Board, UnitSetup } from './types'

const hero: UnitSetup = { id: 'hero', name: 'Héros', team: 'player', hp: 30, maxHp: 30, attack: 10, defense: 2, speed: 9, cosmos: 0, maxCosmos: 3, move: 3, range: 1, position: { x: 0, y: 0 } }
const foe: UnitSetup = { id: 'foe', name: 'Ennemi', team: 'enemy', hp: 30, maxHp: 30, attack: 6, defense: 2, speed: 1, cosmos: 0, maxCosmos: 2, move: 3, range: 1, position: { x: 1, y: 0 } }
const board: Board = { width: 5, height: 3, obstacles: [], terrain: [{ x: 1, y: 0, kind: 'cover' }, { x: 0, y: 2, kind: 'height' }, { x: 2, y: 1, kind: 'cosmos' }] }

describe('terrain', () => {
  it('reduces damage taken on cover, with a minimum of 1', () => {
    const covered = performAction(createCombat([hero, foe], board), 'hero', { type: 'attack', targetId: 'foe' })
    expect(covered.ok && covered.state.units.find((unit) => unit.id === 'foe')?.hp).toBe(30 - (10 - 2 - 2))
    expect(covered.ok && covered.state.log.at(-1)?.message).toContain('à couvert')
    const weak = performAction(createCombat([{ ...hero, attack: 3 }, foe], board), 'hero', { type: 'attack', targetId: 'foe' })
    expect(weak.ok && weak.state.units.find((unit) => unit.id === 'foe')?.hp).toBe(29)
  })

  it('extends attack and technique range from high ground', () => {
    const state = createCombat([{ ...hero, position: { x: 0, y: 2 } }, { ...foe, position: { x: 2, y: 2 } }], board)
    const [actor, target] = state.units
    expect(isWithinRange(state, actor, target, 1)).toBe(true)
    expect(performAction(state, 'hero', { type: 'attack', targetId: 'foe' }).ok).toBe(true)
    const flat = createCombat([{ ...hero, position: { x: 4, y: 2 } }, { ...foe, position: { x: 2, y: 2 } }], board)
    expect(performAction(flat, 'hero', { type: 'attack', targetId: 'foe' }).ok).toBe(false)
  })

  it('grants 1 Cosmos when stopping on a spring, capped at the maximum', () => {
    const state = createCombat([{ ...hero, position: { x: 2, y: 2 } }, { ...foe, position: { x: 4, y: 0 } }], board)
    const moved = performAction(state, 'hero', { type: 'move', to: { x: 2, y: 1 } })
    expect(moved.ok && moved.state.units[0].cosmos).toBe(1)
    const full = performAction(createCombat([{ ...hero, cosmos: 3, position: { x: 2, y: 2 } }, { ...foe, position: { x: 4, y: 0 } }], board), 'hero', { type: 'move', to: { x: 2, y: 1 } })
    expect(full.ok && full.state.units[0].cosmos).toBe(3)
  })

  it('rejects invalid terrain and keeps the arena symmetric', () => {
    expect(() => createCombat([hero, foe], { ...board, terrain: [{ x: 9, y: 0, kind: 'cover' }] })).toThrow()
    expect(() => createCombat([hero, foe], { ...board, obstacles: [{ x: 3, y: 0 }], terrain: [{ x: 3, y: 0, kind: 'cover' }] })).toThrow()
    expect(() => createCombat([hero, foe], { ...board, terrain: [{ x: 3, y: 0, kind: 'cover' }, { x: 3, y: 0, kind: 'height' }] })).toThrow()
    for (const cell of ARENA_BOARD.terrain ?? []) expect(terrainAt(ARENA_BOARD, { x: ARENA_BOARD.width - 1 - cell.x, y: cell.y })).toBe(cell.kind)
  })
})

import { describe, expect, it } from 'vitest'
import { reachableCells } from './board'
import { chooseAiAction, createCombat, getActiveUnit, performAction } from './engine'
import type { Board, UnitSetup } from './types'

const board: Board = { width: 5, height: 3, obstacles: [{ x: 1, y: 1 }] }
const hero: UnitSetup = {
  id: 'hyoga', name: 'Hyoga', team: 'player', hp: 30, maxHp: 30, attack: 8, defense: 2, speed: 10,
  cosmos: 6, maxCosmos: 6, move: 2, range: 1, position: { x: 0, y: 1 },
  technique: { name: 'Poussière de Diamant', cost: 3, power: 5, range: 3 },
}
const foe: UnitSetup = {
  id: 'soldier', name: 'Soldat', team: 'enemy', hp: 20, maxHp: 20, attack: 6, defense: 1, speed: 4,
  cosmos: 0, maxCosmos: 2, move: 2, range: 1, position: { x: 3, y: 1 },
}

describe('tactical board', () => {
  it('computes reachable cells around obstacles, units and edges within the move budget', () => {
    const state = createCombat([hero, foe], board)
    expect(reachableCells(state, 'hyoga')).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 2 }, { x: 1, y: 2 }])
    const blocked = createCombat([hero, { ...foe, position: { x: 0, y: 0 } }], board)
    expect(reachableCells(blocked, 'hyoga')).toEqual([{ x: 0, y: 2 }, { x: 1, y: 2 }])
  })

  it('rejects invalid placements', () => {
    expect(() => createCombat([hero, { ...foe, position: undefined }], board)).toThrow(/needs a position/)
    expect(() => createCombat([hero, { ...foe, position: { x: 1, y: 1 } }], board)).toThrow(/obstacle/)
    expect(() => createCombat([hero, { ...foe, position: { x: 0, y: 1 } }], board)).toThrow(/share a cell/)
    expect(() => createCombat([hero, { ...foe, position: { x: 9, y: 1 } }], board)).toThrow(/needs a position/)
  })

  it('allows one move per activation and keeps the turn until an ending action', () => {
    const state = createCombat([hero, foe], board)
    expect(performAction(state, 'hyoga', { type: 'move', to: { x: 2, y: 1 } }).ok).toBe(false)
    const moved = performAction(state, 'hyoga', { type: 'move', to: { x: 1, y: 2 } })
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    expect(moved.state.units[0].position).toEqual({ x: 1, y: 2 })
    expect(getActiveUnit(moved.state)?.id).toBe('hyoga')
    expect(performAction(moved.state, 'hyoga', { type: 'move', to: { x: 2, y: 2 } }).ok).toBe(false)
    const ended = performAction(moved.state, 'hyoga', { type: 'wait' })
    expect(ended.ok && getActiveUnit(ended.state)?.id).toBe('soldier')
    expect(ended.ok && ended.state.moved).toBe(false)
  })

  it('enforces attack and technique ranges', () => {
    const state = createCombat([hero, foe], board)
    expect(performAction(state, 'hyoga', { type: 'attack', targetId: 'soldier' })).toMatchObject({ ok: false, error: 'Cible hors de portée.' })
    const technique = performAction(state, 'hyoga', { type: 'technique', targetId: 'soldier' })
    expect(technique.ok).toBe(true)
    expect(technique.state.units[1].hp).toBe(8)
  })

  it('keeps legacy duels without a board free of positions and movement', () => {
    const duel = createCombat([{ ...hero, position: undefined }, { ...foe, position: undefined }])
    expect(performAction(duel, 'hyoga', { type: 'attack', targetId: 'soldier' }).ok).toBe(true)
    expect(performAction(duel, 'hyoga', { type: 'move', to: { x: 1, y: 1 } }).ok).toBe(false)
  })

  it('lets the AI close the distance, then strike once in range', () => {
    const far = createCombat([{ ...hero, speed: 1, position: { x: 0, y: 0 } }, { ...foe, speed: 9, position: { x: 4, y: 2 } }], board)
    const step = chooseAiAction(far, 'soldier')
    expect(step).toEqual({ type: 'move', to: { x: 4, y: 0 } })
    const moved = performAction(far, 'soldier', step!)
    expect(moved.ok && chooseAiAction(moved.state, 'soldier')).toEqual({ type: 'wait' })

    const close = createCombat([{ ...hero, speed: 1, position: { x: 2, y: 2 } }, { ...foe, speed: 9, position: { x: 3, y: 2 } }], board)
    expect(chooseAiAction(close, 'soldier')).toEqual({ type: 'attack', targetId: 'hyoga' })
  })
})

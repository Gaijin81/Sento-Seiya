import { describe, expect, it } from 'vitest'
import { chooseAiAction, createCombat, getActiveUnit, performAction } from './engine'
import type { CombatState, UnitSetup } from './types'

const seiya: UnitSetup = {
  id: 'seiya', name: 'Seiya', team: 'player', hp: 20, maxHp: 20,
  attack: 7, defense: 2, speed: 10, cosmos: 4, maxCosmos: 6,
  technique: { name: 'Météores de Pégase', cost: 3, power: 5 },
}
const enemy: UnitSetup = {
  id: 'soldier', name: 'Soldat', team: 'enemy', hp: 18, maxHp: 18,
  attack: 5, defense: 1, speed: 4, cosmos: 0, maxCosmos: 2,
}

function battle(overrides: Partial<UnitSetup> = {}): CombatState {
  return createCombat([seiya, { ...enemy, ...overrides }])
}

describe('combat engine', () => {
  it('orders units by speed and starts with the fastest', () => {
    const state = battle()
    expect(getActiveUnit(state)?.id).toBe('seiya')
    expect(state.turnOrder).toEqual(['seiya', 'soldier'])
  })

  it('rejects invalid actions without changing the state', () => {
    const state = battle()
    const result = performAction(state, 'seiya', { type: 'technique', targetId: 'missing' })
    expect(result.ok).toBe(false)
    expect(result.state).toBe(state)
  })

  it('applies basic damage and advances the turn', () => {
    const state = battle()
    const result = performAction(state, 'seiya', { type: 'attack', targetId: 'soldier' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.units.find((unit) => unit.id === 'soldier')?.hp).toBe(12)
    expect(getActiveUnit(result.state)?.id).toBe('soldier')
  })

  it('spends Cosmos exactly once when a technique is used', () => {
    const state = battle()
    const result = performAction(state, 'seiya', { type: 'technique', targetId: 'soldier' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.units.find((unit) => unit.id === 'seiya')?.cosmos).toBe(1)
    expect(result.state.units.find((unit) => unit.id === 'soldier')?.hp).toBe(7)
  })

  it('does not spend Cosmos if a technique is unaffordable', () => {
    const state = createCombat([ { ...seiya, cosmos: 1 }, enemy ])
    const result = performAction(state, 'seiya', { type: 'technique', targetId: 'soldier' })
    expect(result.ok).toBe(false)
    expect(result.state).toBe(state)
    expect(result.state.units.find((unit) => unit.id === 'seiya')?.cosmos).toBe(1)
  })

  it('guards and halves the next incoming damage, rounding up', () => {
    const state = battle()
    const guarded = performAction(state, 'seiya', { type: 'guard' })
    expect(guarded.ok).toBe(true)
    if (!guarded.ok) return
    const enemyTurn = performAction(guarded.state, 'soldier', { type: 'attack', targetId: 'seiya' })
    expect(enemyTurn.ok).toBe(true)
    if (!enemyTurn.ok) return
    expect(enemyTurn.state.units.find((unit) => unit.id === 'seiya')?.hp).toBe(18)
    expect(enemyTurn.state.units.find((unit) => unit.id === 'seiya')?.guarding).toBe(false)
  })

  it('declares victory when the last enemy is defeated', () => {
    const state = battle({ hp: 6, maxHp: 6 })
    const result = performAction(state, 'seiya', { type: 'attack', targetId: 'soldier' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.status).toBe('victory')
    expect(result.state.winner).toBe('player')
    expect(getActiveUnit(result.state)).toBeNull()
  })

  it('lets the AI use a technique when affordable, otherwise attack', () => {
    const state = createCombat([seiya, { ...enemy, cosmos: 2, technique: { name: 'Frappe solaire', cost: 2, power: 3 } }])
    expect(chooseAiAction(state, 'soldier')).toEqual({ type: 'technique', targetId: 'seiya' })
    const lowCosmos = createCombat([seiya, { ...enemy, cosmos: 0, technique: { name: 'Frappe solaire', cost: 2, power: 3 } }])
    expect(chooseAiAction(lowCosmos, 'soldier')).toEqual({ type: 'attack', targetId: 'seiya' })
  })

  it('rejects duplicate IDs and invalid stats', () => {
    expect(() => createCombat([seiya, { ...enemy, id: 'seiya' }])).toThrow(/Duplicate unit id/)
    expect(() => createCombat([seiya, { ...enemy, attack: -1 }])).toThrow(/Invalid attack/)
  })
})

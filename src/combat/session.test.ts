import { describe, expect, it } from 'vitest'
import { getActiveUnit, performAction } from './engine'
import { createDemoCombat, playActionAndResolveAi } from './session'

describe('combat session used by the arena UI', () => {
  it('starts with three allies and two enemies', () => {
    const state = createDemoCombat()
    expect(state.units.filter((unit) => unit.team === 'player')).toHaveLength(3)
    expect(state.units.filter((unit) => unit.team === 'enemy')).toHaveLength(2)
    expect(getActiveUnit(state)?.id).toBe('seiya')
  })

  it('resolves enemy AI turns automatically after a player action', () => {
    const state = createDemoCombat()
    const first = playActionAndResolveAi(state, 'seiya', { type: 'attack', targetId: 'black-pega' })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const second = playActionAndResolveAi(first.state, 'shiryu', { type: 'attack', targetId: 'black-pega' })
    expect(second.ok).toBe(true)
    if (!second.ok) return
    const third = playActionAndResolveAi(second.state, 'hyoga', { type: 'attack', targetId: 'sanctuary-guard' })
    expect(third.ok).toBe(true)
    if (!third.ok) return
    expect(third.state.log.some((entry) => entry.actorId === 'seiya')).toBe(true)
    expect(third.state.log.some((entry) => entry.actorId === 'black-pega' || entry.actorId === 'sanctuary-guard')).toBe(true)
    expect(getActiveUnit(third.state)?.team).toBe('player')
  })

  it('rejects attempts to act out of turn without mutating combat state', () => {
    const state = createDemoCombat()
    const result = playActionAndResolveAi(state, 'shiryu', { type: 'guard' })
    expect(result.ok).toBe(false)
    expect(result.state).toBe(state)
  })

  it('allows the battle to progress through multiple turns deterministically', () => {
    let state = createDemoCombat()
    for (let i = 0; i < 30 && state.status === 'ongoing'; i += 1) {
      const active = getActiveUnit(state)
      if (!active) break
      if (active.team === 'enemy') {
        const enemyAction = active.technique && active.cosmos >= active.technique.cost
          ? { type: 'technique' as const, targetId: 'seiya' }
          : { type: 'attack' as const, targetId: 'seiya' }
        const result = performAction(state, active.id, enemyAction)
        if (result.ok) state = result.state
      } else {
        const target = state.units.find((unit) => unit.team === 'enemy' && unit.hp > 0)
        if (!target) break
        const result = playActionAndResolveAi(state, active.id, { type: 'attack', targetId: target.id })
        if (result.ok) state = result.state
      }
    }
    expect(['ongoing', 'victory', 'defeat']).toContain(state.status)
    expect(state.log.length).toBeGreaterThan(0)
  })
})

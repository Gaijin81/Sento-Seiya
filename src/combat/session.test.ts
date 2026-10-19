import { describe, expect, it } from 'vitest'
import { chooseTacticalAction, getActiveUnit } from './engine'
import { createDemoCombat, playActionAndResolveAi } from './session'

describe('combat session used by the arena UI', () => {
  it('starts with three allies and two enemies placed on the arena board', () => {
    const state = createDemoCombat()
    expect(state.units.filter((unit) => unit.team === 'player')).toHaveLength(3)
    expect(state.units.filter((unit) => unit.team === 'enemy')).toHaveLength(2)
    expect(state.board).toMatchObject({ width: 7, height: 5 })
    expect(state.units.every((unit) => unit.position)).toBe(true)
    expect(getActiveUnit(state)?.id).toBe('seiya')
  })

  it('lets a knight move once, then end the turn, and resolves enemy turns automatically', () => {
    const state = createDemoCombat()
    const moved = playActionAndResolveAi(state, 'seiya', { type: 'move', to: { x: 3, y: 2 } })
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    expect(getActiveUnit(moved.state)?.id).toBe('seiya')
    expect(moved.state.moved).toBe(true)
    expect(playActionAndResolveAi(moved.state, 'seiya', { type: 'move', to: { x: 4, y: 2 } }).ok).toBe(false)
    expect(playActionAndResolveAi(moved.state, 'seiya', { type: 'attack', targetId: 'black-pega' }).ok).toBe(false)

    let current = moved.state
    for (const id of ['seiya', 'shiryu', 'hyoga']) {
      const result = playActionAndResolveAi(current, id, { type: 'wait' })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      current = result.state
    }
    expect(current.round).toBe(2)
    expect(current.moved).toBe(false)
    expect(current.log.some((entry) => entry.actorId === 'black-pega' && entry.action === 'move')).toBe(true)
    expect(getActiveUnit(current)?.team).toBe('player')
  })

  it('rejects attempts to act out of turn without mutating combat state', () => {
    const state = createDemoCombat()
    const result = playActionAndResolveAi(state, 'shiryu', { type: 'guard' })
    expect(result.ok).toBe(false)
    expect(result.state).toBe(state)
  })

  it('reaches a result when both sides follow the tactical policy', () => {
    let state = createDemoCombat()
    for (let i = 0; i < 200 && state.status === 'ongoing'; i += 1) {
      const active = getActiveUnit(state)
      if (!active) break
      const action = chooseTacticalAction(state, active.id)
      if (!action) break
      const result = playActionAndResolveAi(state, active.id, action)
      expect(result.ok).toBe(true)
      if (result.ok) state = result.state
    }
    expect(state.status).not.toBe('ongoing')
    expect(state.log.some((entry) => entry.action === 'attack' || entry.action === 'technique')).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { chooseTacticalAction, getActiveUnit } from '../combat/engine'
import { activeController, createLocalMatch, needsHandoff, playLocalAction, winnerLabel, type LocalMatch } from './match'

function autoplay(match: LocalMatch): LocalMatch {
  let current = match
  for (let i = 0; i < 300 && current.combat.status === 'ongoing'; i += 1) {
    const active = getActiveUnit(current.combat)
    if (!active) break
    expect(activeController(current)).not.toBe('ai')
    const result = playLocalAction(current, active.id, chooseTacticalAction(current.combat, active.id)!)
    expect(result.ok).toBe(true)
    if (result.ok) current = result.match
  }
  return current
}

describe('local versus and coop', () => {
  it('builds a PvP match with each player on one side, mirrored knights allowed', () => {
    const result = createLocalMatch('pvp', ['seiya', 'hyoga'], ['seiya'])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.match.controllers).toEqual({ seiya: 'p1', hyoga: 'p1', 'p2-seiya': 'p2' })
    expect(result.match.combat.units.find((unit) => unit.id === 'p2-seiya')).toMatchObject({ team: 'enemy', name: 'Seiya (J2)', position: { x: 6, y: 2 } })
  })

  it('rejects invalid picks', () => {
    expect(createLocalMatch('pvp', [], ['seiya'])).toMatchObject({ ok: false })
    expect(createLocalMatch('pvp', ['seiya', 'hyoga', 'shun', 'ikki'], ['seiya'])).toMatchObject({ ok: false })
    expect(createLocalMatch('pvp', ['seiya', 'seiya'], ['ikki'])).toMatchObject({ ok: false })
    expect(createLocalMatch('coop', ['seiya', 'hyoga', 'shun'], ['ikki'])).toMatchObject({ ok: false })
    expect(createLocalMatch('coop', ['seiya'], ['seiya'])).toMatchObject({ ok: false, error: expect.stringMatching(/un seul joueur/) })
    expect(createLocalMatch('pvp', ['zeus'], ['seiya'])).toMatchObject({ ok: false })
  })

  it('never lets the AI play in PvP and refuses out-of-turn actions', () => {
    const result = createLocalMatch('pvp', ['seiya'], ['ikki'])
    if (!result.ok) throw new Error(result.error)
    const first = getActiveUnit(result.match.combat)!
    const other = result.match.combat.units.find((unit) => unit.id !== first.id)!
    expect(playLocalAction(result.match, other.id, { type: 'wait' }).ok).toBe(false)
    const after = playLocalAction(result.match, first.id, { type: 'wait' })
    expect(after.ok && getActiveUnit(after.match.combat)?.id).toBe(other.id)
    const finished = autoplay(result.match)
    expect(finished.combat.status).not.toBe('ongoing')
    expect(['Joueur 1', 'Joueur 2']).toContain(winnerLabel(finished))
  })

  it('lets two players share a team against the AI in coop', () => {
    const result = createLocalMatch('coop', ['seiya', 'shiryu'], ['hyoga', 'shun'])
    if (!result.ok) throw new Error(result.error)
    expect(Object.values(result.match.controllers).filter((controller) => controller === 'ai')).toHaveLength(2)
    expect(result.match.combat.units.filter((unit) => unit.team === 'player')).toHaveLength(4)
    expect(playLocalAction(result.match, 'black-chief', { type: 'wait' })).toMatchObject({ ok: false })
    const finished = autoplay(result.match)
    expect(finished.combat.log.some((entry) => entry.actorId === 'black-chief')).toBe(true)
    expect(winnerLabel(finished)).not.toBeNull()
  })

  it('asks to pass the device only between two different human players', () => {
    expect(needsHandoff('p1', 'p2')).toBe(true)
    expect(needsHandoff('p2', 'p1')).toBe(true)
    expect(needsHandoff('p1', 'p1')).toBe(false)
    expect(needsHandoff('p1', 'ai')).toBe(false)
    expect(needsHandoff(null, 'p1')).toBe(false)
  })
})

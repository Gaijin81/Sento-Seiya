import { describe, expect, it } from 'vitest'
import { getActiveUnit } from '../combat/engine'
import { parseClientMessage } from './protocol'
import { RoomManager } from './rooms'

function manager() {
  let clock = 0
  let next = 0
  const rooms = new RoomManager(() => clock, Math.random, () => `token-${++next}`)
  return { rooms, tick: (ms: number) => { clock += ms } }
}

function activeSide(rooms: RoomManager, token: string) {
  const { room } = rooms.find(token)!
  const active = getActiveUnit(room.match!.combat)!
  return { active, side: room.match!.controllers[active.id] }
}

describe('online rooms', () => {
  it('creates a room with a shareable code and starts the duel when a second player joins', () => {
    const { rooms } = manager()
    const host = rooms.create('pvp', ['seiya'])
    expect(host.ok).toBe(true)
    if (!host.ok) return
    expect(host.room.code).toMatch(/^[A-Z2-9]{5}$/)
    expect(rooms.view(host.room, 'p1')).toMatchObject({ waiting: true, match: null })
    const guest = rooms.join(host.room.code, ['shiryu'])
    expect(guest.ok && guest.side).toBe('p2')
    expect(rooms.view(host.room, 'p1')).toMatchObject({ waiting: false, opponentConnected: true })
    expect(host.room.match?.combat.units).toHaveLength(2)
  })

  it('rejects invalid teams, unknown codes and full rooms', () => {
    const { rooms } = manager()
    expect(rooms.create('pvp', [])).toMatchObject({ ok: false })
    expect(rooms.create('pvp', ['seiya', 'seiya'])).toMatchObject({ ok: false })
    expect(rooms.join('ZZZZZ', ['seiya'])).toMatchObject({ ok: false, error: 'Aucun salon avec ce code.' })
    const host = rooms.create('coop', ['seiya'])
    if (!host.ok) throw new Error('setup')
    expect(rooms.join(host.room.code, ['seiya'])).toMatchObject({ ok: false })
    expect(rooms.join(host.room.code, ['hyoga']).ok).toBe(true)
    expect(rooms.join(host.room.code, ['shiryu'])).toMatchObject({ ok: false, error: 'Ce salon est déjà complet.' })
  })

  it('pairs quick-match players of the same mode only', () => {
    const { rooms } = manager()
    const first = rooms.quick('pvp', ['seiya'])
    const coop = rooms.quick('coop', ['hyoga'])
    const second = rooms.quick('pvp', ['shiryu'])
    if (!first.ok || !coop.ok || !second.ok) throw new Error('setup')
    expect(second.room.code).toBe(first.room.code)
    expect(coop.room.code).not.toBe(first.room.code)
    expect(rooms.create('pvp', ['seiya']).ok && rooms.quick('pvp', ['ikki'])).toMatchObject({ side: 'p1' })
  })

  it('only lets a player command their own unit on its turn', () => {
    const { rooms } = manager()
    const host = rooms.create('pvp', ['seiya'])
    if (!host.ok) throw new Error('setup')
    const guest = rooms.join(host.room.code, ['shiryu'])
    if (!guest.ok) throw new Error('setup')
    const { active, side } = activeSide(rooms, host.token)
    const [mine, theirs] = side === 'p1' ? [host.token, guest.token] : [guest.token, host.token]
    expect(rooms.act(theirs, active.id, { type: 'wait' })).toMatchObject({ ok: false, error: 'Cette unité ne t’appartient pas.' })
    expect(rooms.act(mine, active.id, { type: 'move', to: { x: 99, y: 99 } }).ok).toBe(false)
    expect(rooms.act(mine, active.id, { type: 'wait' }).ok).toBe(true)
    expect(rooms.act(mine, active.id, { type: 'wait' })).toMatchObject({ ok: false })
    expect(activeSide(rooms, host.token).side).not.toBe(side)
  })

  it('keeps the seat on disconnect so the player can resume, and closes rooms on leave or idleness', () => {
    const { rooms, tick } = manager()
    const host = rooms.create('pvp', ['seiya'])
    if (!host.ok) throw new Error('setup')
    const guest = rooms.join(host.room.code, ['shiryu'])
    if (!guest.ok) throw new Error('setup')
    rooms.disconnect(host.token)
    expect(rooms.view(host.room, 'p2').opponentConnected).toBe(false)
    expect(rooms.resume(host.token)).toMatchObject({ ok: true, side: 'p1' })
    expect(rooms.view(host.room, 'p2').opponentConnected).toBe(true)
    rooms.leave(guest.token)
    expect(rooms.resume(host.token).ok).toBe(false)
    const idle = rooms.create('pvp', ['seiya'])
    tick(1000)
    expect(rooms.cleanup(500).map((room) => room.code)).toEqual([idle.ok && idle.room.code])
    expect(rooms.rooms.size).toBe(0)
  })
})

describe('online protocol', () => {
  it('accepts well-formed messages and normalises room codes', () => {
    expect(parseClientMessage('{"type":"join","code":" abcde ","picks":["seiya"]}')).toEqual({ ok: true, message: { type: 'join', code: 'ABCDE', picks: ['seiya'] } })
    expect(parseClientMessage('{"type":"action","actorId":"seiya","action":{"type":"move","to":{"x":1,"y":2},"extra":1}}')).toEqual({ ok: true, message: { type: 'action', actorId: 'seiya', action: { type: 'move', to: { x: 1, y: 2 } } } })
  })

  it('rejects malformed or unexpected input', () => {
    for (const raw of ['nope', '[]', '{"type":"hack"}', '{"type":"create","mode":"solo","picks":[]}', '{"type":"action","actorId":"seiya","action":{"type":"move","to":{"x":1.5,"y":0}}}', '{"type":"action","actorId":"seiya","action":{"type":"heal"}}', '{"type":"create","mode":"pvp","picks":["a","b","c","d","e"]}']) {
      expect(parseClientMessage(raw).ok).toBe(false)
    }
  })
})

import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import { getActiveUnit } from '../src/combat/engine'
import type { ServerMessage } from '../src/online/protocol'
import { createGameServer, type GameServer } from './index'

type Client = { socket: WebSocket; next: (type: ServerMessage['type']) => Promise<ServerMessage>; send: (data: object) => void }

let server: GameServer
let url: string

beforeEach(async () => {
  server = createGameServer()
  await new Promise<void>((resolve) => server.http.listen(0, resolve))
  url = `ws://127.0.0.1:${(server.http.address() as AddressInfo).port}`
})
afterEach(() => server.close())

async function connect(): Promise<Client> {
  const socket = new WebSocket(url)
  const inbox: ServerMessage[] = []
  const waiters: (() => void)[] = []
  socket.on('message', (data) => { inbox.push(JSON.parse(String(data))); waiters.splice(0).forEach((wake) => wake()) })
  await new Promise((resolve) => socket.once('open', resolve))
  const next = async (type: ServerMessage['type']) => {
    for (;;) {
      const index = inbox.findIndex((message) => message.type === type)
      if (index >= 0) return inbox.splice(index, 1)[0]
      await new Promise<void>((resolve) => waiters.push(resolve))
    }
  }
  return { socket, next, send: (data) => socket.send(JSON.stringify(data)) }
}

describe('game server', () => {
  it('answers health checks', async () => {
    const response = await fetch(url.replace('ws', 'http') + '/health')
    expect(await response.json()).toEqual({ ok: true, rooms: 0 })
  })

  it('plays a validated online duel and lets a dropped player resume it', async () => {
    const host = await connect()
    host.send({ type: 'create', mode: 'pvp', picks: ['seiya'] })
    const session = await host.next('session')
    if (session.type !== 'session') throw new Error('session')
    expect((await host.next('room')).type).toBe('room')

    const guest = await connect()
    guest.send({ type: 'join', code: session.code.toLowerCase(), picks: ['shiryu'] })
    const update = await guest.next('room')
    await host.next('room')
    if (update.type !== 'room' || !update.room.match) throw new Error('room')
    const active = getActiveUnit(update.room.match.combat)!
    const owner = update.room.match.controllers[active.id] === 'p1' ? host : guest
    const other = owner === host ? guest : host

    other.send({ type: 'action', actorId: active.id, action: { type: 'wait' } })
    expect(await other.next('error')).toMatchObject({ message: 'Cette unité ne t’appartient pas.' })
    owner.send({ type: 'action', actorId: active.id, action: { type: 'wait' } })
    const after = await other.next('room')
    expect(after.type === 'room' && after.room.match?.combat.log.length).toBeGreaterThan(update.room.match.combat.log.length)
    await owner.next('room')

    host.socket.close()
    expect(await guest.next('room')).toMatchObject({ room: { opponentConnected: false } })
    const back = await connect()
    back.send({ type: 'resume', token: session.token })
    expect(await back.next('session')).toMatchObject({ side: 'p1', code: session.code })
    expect(await guest.next('room')).toMatchObject({ room: { opponentConnected: true } })

    back.send({ type: 'leave' })
    expect(await guest.next('closed')).toMatchObject({ reason: 'Ton adversaire a quitté la partie.' })
    ;[back, guest].forEach((client) => client.socket.close())
  })

  it('rejects malformed messages without crashing', async () => {
    const client = await connect()
    client.socket.send('not json')
    expect(await client.next('error')).toMatchObject({ message: 'Message illisible.' })
    client.send({ type: 'action', actorId: 'seiya', action: { type: 'wait' } })
    expect(await client.next('error')).toMatchObject({ message: 'Rejoins d’abord une partie.' })
    client.socket.close()
  })
})

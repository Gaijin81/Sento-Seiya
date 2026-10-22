import { getActiveUnit } from '../combat/engine'
import type { CombatAction } from '../combat/types'
import { createLocalMatch, playLocalAction, validatePicks, type LocalMatch, type LocalMode } from '../versus/match'
import { CODE_ALPHABET, CODE_LENGTH, type RoomView, type Side } from './protocol'

type Seat = { token: string; picks: string[]; connected: boolean }

export type Room = {
  code: string
  mode: LocalMode
  quick: boolean
  seats: Partial<Record<Side, Seat>>
  match: LocalMatch | null
  updatedAt: number
}

export type Seated = { ok: true; room: Room; side: Side; token: string }
export type RoomResult = Seated | { ok: false; error: string }

/** In-memory, server-authoritative rooms: every action is replayed through the shared combat engine. */
export class RoomManager {
  readonly rooms = new Map<string, Room>()
  private readonly tokens = new Map<string, { code: string; side: Side }>()

  constructor(
    private readonly now: () => number = Date.now,
    private readonly random: () => number = Math.random,
    private readonly newToken: () => string = () => globalThis.crypto.randomUUID(),
  ) {}

  private code(): string {
    for (;;) {
      const code = Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[Math.floor(this.random() * CODE_ALPHABET.length)]).join('')
      if (!this.rooms.has(code)) return code
    }
  }

  private seat(room: Room, side: Side, picks: string[]): Seated {
    const token = this.newToken()
    room.seats[side] = { token, picks, connected: true }
    room.updatedAt = this.now()
    this.tokens.set(token, { code: room.code, side })
    return { ok: true, room, side, token }
  }

  create(mode: LocalMode, picks: string[], quick = false): RoomResult {
    const error = validatePicks(mode, picks, 'Ton équipe')
    if (error) return { ok: false, error }
    const room: Room = { code: this.code(), mode, quick, seats: {}, match: null, updatedAt: this.now() }
    this.rooms.set(room.code, room)
    return this.seat(room, 'p1', picks)
  }

  join(code: string, picks: string[]): RoomResult {
    const room = this.rooms.get(code)
    if (!room) return { ok: false, error: 'Aucun salon avec ce code.' }
    if (room.seats.p2) return { ok: false, error: 'Ce salon est déjà complet.' }
    const started = createLocalMatch(room.mode, room.seats.p1!.picks, picks)
    if (!started.ok) return { ok: false, error: started.error.replace('Joueur 2', 'Ton équipe') }
    room.match = started.match
    return this.seat(room, 'p2', picks)
  }

  /** Matchmaking: joins the oldest open quick room of the same mode, or opens one. */
  quick(mode: LocalMode, picks: string[]): RoomResult {
    const open = [...this.rooms.values()]
      .filter((room) => room.quick && room.mode === mode && !room.seats.p2 && room.seats.p1?.connected)
      .sort((a, b) => a.updatedAt - b.updatedAt)
    for (const room of open) {
      const joined = this.join(room.code, picks)
      if (joined.ok) return joined
    }
    return this.create(mode, picks, true)
  }

  find(token: string): { room: Room; side: Side } | null {
    const entry = this.tokens.get(token)
    const room = entry && this.rooms.get(entry.code)
    return entry && room ? { room, side: entry.side } : null
  }

  resume(token: string): RoomResult {
    const found = this.find(token)
    if (!found) return { ok: false, error: 'Partie introuvable ou expirée.' }
    found.room.seats[found.side]!.connected = true
    found.room.updatedAt = this.now()
    return { ok: true, room: found.room, side: found.side, token }
  }

  act(token: string, actorId: string, action: CombatAction): RoomResult {
    const found = this.find(token)
    if (!found) return { ok: false, error: 'Partie introuvable ou expirée.' }
    const { room, side } = found
    if (!room.match) return { ok: false, error: 'La partie n’a pas encore commencé.' }
    if (room.match.combat.status !== 'ongoing') return { ok: false, error: 'La partie est terminée.' }
    if (room.match.controllers[actorId] !== side) return { ok: false, error: 'Cette unité ne t’appartient pas.' }
    if (getActiveUnit(room.match.combat)?.id !== actorId) return { ok: false, error: 'Ce n’est pas le tour de cette unité.' }
    const result = playLocalAction(room.match, actorId, action)
    if (!result.ok) return { ok: false, error: result.error }
    room.match = result.match
    room.updatedAt = this.now()
    return { ok: true, room, side, token }
  }

  disconnect(token: string): Room | null {
    const found = this.find(token)
    if (!found) return null
    found.room.seats[found.side]!.connected = false
    found.room.updatedAt = this.now()
    return found.room
  }

  /** Leaving closes the room for both players. */
  leave(token: string): Room | null {
    const found = this.find(token)
    if (!found) return null
    this.remove(found.room)
    return found.room
  }

  private remove(room: Room): void {
    this.rooms.delete(room.code)
    for (const seat of Object.values(room.seats)) if (seat) this.tokens.delete(seat.token)
  }

  /** Drops rooms nobody touched for `maxIdleMs`; returns them so their sockets can be told. */
  cleanup(maxIdleMs: number): Room[] {
    const stale = [...this.rooms.values()].filter((room) => this.now() - room.updatedAt > maxIdleMs)
    stale.forEach((room) => this.remove(room))
    return stale
  }

  view(room: Room, side: Side): RoomView {
    const other = room.seats[side === 'p1' ? 'p2' : 'p1']
    return { code: room.code, mode: room.mode, side, waiting: !room.seats.p2, opponentConnected: Boolean(other?.connected), match: room.match }
  }
}

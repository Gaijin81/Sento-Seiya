import type { CombatAction } from '../combat/types'
import type { LocalMatch, LocalMode } from '../versus/match'

export type Side = 'p1' | 'p2'

export type ClientMessage =
  | { type: 'create'; mode: LocalMode; picks: string[] }
  | { type: 'join'; code: string; picks: string[] }
  | { type: 'quick'; mode: LocalMode; picks: string[] }
  | { type: 'resume'; token: string }
  | { type: 'action'; actorId: string; action: CombatAction }
  | { type: 'leave' }

export type RoomView = {
  code: string
  mode: LocalMode
  side: Side
  waiting: boolean
  opponentConnected: boolean
  match: LocalMatch | null
}

export type ServerMessage =
  | { type: 'session'; token: string; side: Side; code: string }
  | { type: 'room'; room: RoomView }
  | { type: 'error'; message: string }
  | { type: 'closed'; reason: string }

export const DEFAULT_SERVER_URL = 'ws://localhost:8787'
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 5

type Parsed = { ok: true; message: ClientMessage } | { ok: false; error: string }

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const isMode = (value: unknown): value is LocalMode => value === 'pvp' || value === 'coop'
const isPicks = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 4 && value.every((id) => typeof id === 'string' && id.length <= 40)
const isId = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 64

function parseAction(value: unknown): CombatAction | null {
  if (!isRecord(value)) return null
  switch (value.type) {
    case 'attack':
    case 'technique':
      return isId(value.targetId) ? { type: value.type, targetId: value.targetId } : null
    case 'move': {
      const to = value.to
      return isRecord(to) && Number.isInteger(to.x) && Number.isInteger(to.y) ? { type: 'move', to: { x: to.x as number, y: to.y as number } } : null
    }
    case 'guard':
    case 'focus':
    case 'wait':
      return { type: value.type }
    default:
      return null
  }
}

/** Validates untrusted client input; the server never trusts anything else it receives. */
export function parseClientMessage(raw: string): Parsed {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'Message illisible.' }
  }
  if (!isRecord(data)) return { ok: false, error: 'Message invalide.' }
  switch (data.type) {
    case 'create':
    case 'quick':
      return isMode(data.mode) && isPicks(data.picks) ? { ok: true, message: { type: data.type, mode: data.mode, picks: data.picks } } : { ok: false, error: 'Mode ou équipe invalide.' }
    case 'join': {
      const code = typeof data.code === 'string' ? data.code.trim().toUpperCase() : ''
      return code.length === CODE_LENGTH && isPicks(data.picks) ? { ok: true, message: { type: 'join', code, picks: data.picks } } : { ok: false, error: 'Code de salon ou équipe invalide.' }
    }
    case 'resume':
      return isId(data.token) ? { ok: true, message: { type: 'resume', token: data.token } } : { ok: false, error: 'Jeton invalide.' }
    case 'action': {
      const action = parseAction(data.action)
      return action && isId(data.actorId) ? { ok: true, message: { type: 'action', actorId: data.actorId, action } } : { ok: false, error: 'Action invalide.' }
    }
    case 'leave':
      return { ok: true, message: { type: 'leave' } }
    default:
      return { ok: false, error: 'Type de message inconnu.' }
  }
}

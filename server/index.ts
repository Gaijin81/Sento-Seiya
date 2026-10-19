import { createServer, type Server } from 'node:http'
import { fileURLToPath } from 'node:url'
import { WebSocket, WebSocketServer } from 'ws'
import { parseClientMessage, type ServerMessage, type Side } from '../src/online/protocol'
import { RoomManager, type Room, type RoomResult } from '../src/online/rooms'

const MAX_MESSAGES_PER_SECOND = 20
const ROOM_IDLE_MS = 30 * 60 * 1000

export type GameServer = { http: Server; manager: RoomManager; close: () => Promise<void> }

export function createGameServer(manager = new RoomManager()): GameServer {
  const sockets = new Map<string, WebSocket>()
  const send = (socket: WebSocket | undefined, message: ServerMessage) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
  }
  const broadcast = (room: Room) => {
    for (const side of ['p1', 'p2'] as Side[]) {
      const seat = room.seats[side]
      if (seat) send(sockets.get(seat.token), { type: 'room', room: manager.view(room, side) })
    }
  }
  const closeRoom = (room: Room, reason: string, except?: string) => {
    for (const seat of Object.values(room.seats)) if (seat && seat.token !== except) send(sockets.get(seat.token), { type: 'closed', reason })
    for (const seat of Object.values(room.seats)) if (seat) sockets.delete(seat.token)
  }

  const http = createServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      response.end(JSON.stringify({ ok: true, rooms: manager.rooms.size }))
      return
    }
    response.writeHead(404, { 'content-type': 'text/plain' })
    response.end('Sento Seiya — serveur de jeu en ligne. Connecte-toi en WebSocket.')
  })
  const wss = new WebSocketServer({ server: http, maxPayload: 16 * 1024 })

  wss.on('connection', (socket) => {
    let token: string | null = null
    let windowStart = Date.now()
    let count = 0

    const seated = (result: RoomResult) => {
      if (!result.ok) { send(socket, { type: 'error', message: result.error }); return }
      if (token && token !== result.token) sockets.delete(token)
      token = result.token
      const previous = sockets.get(token)
      if (previous && previous !== socket) previous.close(4000, 'Reconnecté ailleurs')
      sockets.set(token, socket)
      send(socket, { type: 'session', token, side: result.side, code: result.room.code })
      broadcast(result.room)
    }

    socket.on('message', (data) => {
      const now = Date.now()
      if (now - windowStart > 1000) { windowStart = now; count = 0 }
      if (++count > MAX_MESSAGES_PER_SECOND) { socket.close(4008, 'Trop de messages'); return }
      const parsed = parseClientMessage(String(data))
      if (!parsed.ok) { send(socket, { type: 'error', message: parsed.error }); return }
      const message = parsed.message
      switch (message.type) {
        case 'create': return seated(manager.create(message.mode, message.picks))
        case 'join': return seated(manager.join(message.code, message.picks))
        case 'quick': return seated(manager.quick(message.mode, message.picks))
        case 'resume': return seated(manager.resume(message.token))
        case 'action': {
          if (!token) { send(socket, { type: 'error', message: 'Rejoins d’abord une partie.' }); return }
          const result = manager.act(token, message.actorId, message.action)
          if (!result.ok) { send(socket, { type: 'error', message: result.error }); return }
          broadcast(result.room)
          return
        }
        case 'leave': {
          if (!token) return
          const room = manager.leave(token)
          if (room) closeRoom(room, 'Ton adversaire a quitté la partie.', token)
          sockets.delete(token)
          token = null
        }
      }
    })

    socket.on('close', () => {
      if (!token || sockets.get(token) !== socket) return
      sockets.delete(token)
      const room = manager.disconnect(token)
      if (room) broadcast(room)
    })
  })

  const timer = setInterval(() => {
    for (const room of manager.cleanup(ROOM_IDLE_MS)) closeRoom(room, 'Partie expirée après 30 minutes d’inactivité.')
  }, 60_000)
  timer.unref()

  return {
    http,
    manager,
    close: () => new Promise((resolve) => {
      clearInterval(timer)
      wss.clients.forEach((client) => client.terminate())
      wss.close(() => http.close(() => resolve()))
    }),
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT ?? 8787)
  createGameServer().http.listen(port, () => console.log(`Serveur Sento Seiya en écoute sur le port ${port}`))
}

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Flame, Globe, Handshake, LogIn, LogOut, Search, Shield, SkipForward, Sparkles, Swords, Trophy, Wifi, WifiOff } from 'lucide-react'
import { attackRange, isWithinRange, reachableCells, samePosition, techniqueRange, unitAt } from '../combat/board'
import { getActiveUnit } from '../combat/engine'
import { KNIGHT_CATALOG } from '../combat/knights'
import TacticalBoard, { unitGlyph } from '../combat/TacticalBoard'
import type { CombatAction, CombatUnit, Position } from '../combat/types'
import { activeController, MAX_PICKS, VERSUS_LEVEL, type LocalMode } from '../versus/match'
import { DEFAULT_SERVER_URL, type ClientMessage, type RoomView, type ServerMessage, type Side } from './protocol'

export const SERVER_URL_KEY = 'sento-seiya-server'
export const ONLINE_SESSION_KEY = 'sento-seiya-online-session'
const RETRY_MS = 2000

type StoredSession = { token: string; url: string }
type Props = { initialMode?: LocalMode; onBack: () => void }

export function defaultServerUrl(): string {
  return localStorage.getItem(SERVER_URL_KEY) || import.meta.env.VITE_SERVER_URL || DEFAULT_SERVER_URL
}

function readSession(): StoredSession | null {
  try {
    const session = JSON.parse(localStorage.getItem(ONLINE_SESSION_KEY) ?? 'null') as StoredSession | null
    return session && typeof session.token === 'string' && typeof session.url === 'string' ? session : null
  } catch {
    return null
  }
}

const sideLabel = (side: Side | 'ai' | undefined, mine: Side, mode: LocalMode) => (side === 'ai' || !side ? 'IA' : side === mine ? 'Toi' : mode === 'coop' ? 'Allié' : 'Adversaire')

export default function OnlineVersus({ initialMode = 'pvp', onBack }: Props) {
  const [mode, setMode] = useState<LocalMode>(initialMode)
  const [picks, setPicks] = useState<string[]>(['seiya'])
  const [serverUrl, setServerUrl] = useState(defaultServerUrl)
  const [joinCode, setJoinCode] = useState('')
  const [room, setRoom] = useState<RoomView | null>(null)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'online' | 'retrying'>('idle')
  const [feedback, setFeedback] = useState('')
  const [targetId, setTargetId] = useState('')
  const socketRef = useRef<WebSocket | null>(null)
  const sessionRef = useRef<StoredSession | null>(readSession())
  const retryRef = useRef<number | undefined>(undefined)

  const disconnect = () => {
    window.clearTimeout(retryRef.current)
    const socket = socketRef.current
    socketRef.current = null
    socket?.close()
  }

  const forget = () => {
    sessionRef.current = null
    localStorage.removeItem(ONLINE_SESSION_KEY)
  }

  const connect = (url: string, first: ClientMessage) => {
    disconnect()
    setStatus('connecting')
    let socket: WebSocket
    try {
      socket = new WebSocket(url)
    } catch {
      setStatus('idle')
      setFeedback('Adresse de serveur invalide.')
      return
    }
    socketRef.current = socket
    let seated = false
    socket.onopen = () => { setStatus('online'); socket.send(JSON.stringify(first)) }
    socket.onmessage = (event) => {
      const message = JSON.parse(String(event.data)) as ServerMessage
      if (message.type === 'session') {
        seated = true
        sessionRef.current = { token: message.token, url }
        localStorage.setItem(ONLINE_SESSION_KEY, JSON.stringify(sessionRef.current))
      } else if (message.type === 'room') {
        setRoom(message.room)
      } else if (message.type === 'error') {
        if (first.type === 'resume' && !seated) { forget(); setRoom(null) }
        setFeedback(message.message)
      } else {
        forget()
        setRoom(null)
        setFeedback(message.reason)
        disconnect()
        setStatus('idle')
      }
    }
    socket.onclose = () => {
      if (socketRef.current !== socket) return
      socketRef.current = null
      const session = sessionRef.current
      if (!session) { setStatus('idle'); setFeedback((current) => current || 'Impossible de joindre le serveur.'); return }
      setStatus('retrying')
      retryRef.current = window.setTimeout(() => connect(session.url, { type: 'resume', token: session.token }), RETRY_MS)
    }
  }

  useEffect(() => {
    const session = sessionRef.current
    if (session) connect(session.url, { type: 'resume', token: session.token })
    return disconnect
  }, [])

  const send = (message: ClientMessage) => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
    else setFeedback('Connexion perdue, reconnexion en cours…')
  }

  const start = (message: ClientMessage) => {
    const url = serverUrl.trim()
    localStorage.setItem(SERVER_URL_KEY, url)
    forget()
    setFeedback('')
    connect(url, message)
  }

  const leave = () => {
    send({ type: 'leave' })
    forget()
    disconnect()
    setRoom(null)
    setStatus('idle')
    setFeedback('')
  }

  const togglePick = (id: string) => {
    setPicks(picks.includes(id) ? picks.filter((entry) => entry !== id) : picks.length < MAX_PICKS[mode] ? [...picks, id] : picks)
  }
  const changeMode = (next: LocalMode) => { setMode(next); setPicks(picks.slice(0, MAX_PICKS[next])) }

  const connection = status === 'retrying' ? <span className="online-pill offline"><WifiOff size={13} /> Reconnexion…</span> : status === 'online' ? <span className="online-pill"><Wifi size={13} /> Connecté</span> : null

  if (!room) {
    const busy = status === 'connecting' || status === 'retrying'
    const ready = picks.length > 0 && !busy
    return (
      <section className="page-section combat-page" aria-label="Partie en ligne">
        <button className="text-button combat-back" onClick={onBack}><ArrowLeft size={15} /> Retour aux arènes</button>
        <div className="eyebrow">EN LIGNE · 2 JOUEURS</div>
        <div className="combat-title-row"><div><h1>Partie en ligne</h1><p className="page-intro">Crée un salon et partage son code, rejoins celui d’un ami ou lance une recherche rapide. Le serveur vérifie chaque action. Tous les chevaliers combattent au niveau {VERSUS_LEVEL}.</p></div>{connection}</div>
        <div className="mode-switch" role="radiogroup" aria-label="Mode de jeu">
          <button role="radio" aria-checked={mode === 'pvp'} className={mode === 'pvp' ? 'active' : ''} onClick={() => changeMode('pvp')}><Swords size={16} /> Joueur contre Joueur</button>
          <button role="radio" aria-checked={mode === 'coop'} className={mode === 'coop' ? 'active' : ''} onClick={() => changeMode('coop')}><Handshake size={16} /> Coop contre l’IA</button>
        </div>
        <div className="panel">
          <div className="panel-heading"><div><div className="eyebrow">TON ÉQUIPE</div><h2>Choisis tes chevaliers</h2></div><span className="log-count">{picks.length}/{MAX_PICKS[mode]}</span></div>
          <div className="pick-grid">
            {KNIGHT_CATALOG.map((knight) => {
              const selected = picks.includes(knight.id)
              return (
                <button key={knight.id} className={'pick-chip' + (selected ? ' selected' : '')} aria-pressed={selected} disabled={!selected && picks.length >= MAX_PICKS[mode]} onClick={() => togglePick(knight.id)}>
                  <span className={'battle-avatar ' + knight.color}>{knight.glyph}</span><span>{knight.name}<small>{knight.technique.name}</small></span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="combat-controls panel online-setup">
          <label className="online-field"><span>Serveur</span><input value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} spellCheck={false} autoCapitalize="off" aria-describedby="server-hint" /></label>
          <p className="control-hint" id="server-hint">En local : <code>npm run server</code>, puis {DEFAULT_SERVER_URL}. Depuis un autre appareil, remplace localhost par l’adresse IP du PC, ou indique l’adresse du serveur en ligne (wss://…).</p>
          <div className="prep-buttons">
            <button className="primary-button" disabled={!ready} onClick={() => start({ type: 'create', mode, picks })}><Globe size={16} /> Créer un salon</button>
            <button className="secondary-button" disabled={!ready} onClick={() => start({ type: 'quick', mode, picks })}><Search size={15} /> Recherche rapide</button>
          </div>
          <div className="online-join">
            <label className="online-field"><span>Code du salon</span><input value={joinCode} maxLength={5} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} autoCapitalize="characters" spellCheck={false} placeholder="ABCDE" /></label>
            <button className="secondary-button" disabled={!ready || joinCode.trim().length !== 5} onClick={() => start({ type: 'join', code: joinCode, picks })}><LogIn size={15} /> Rejoindre</button>
          </div>
          {(busy || feedback) && <p className="control-hint" role="status">{status === 'retrying' ? 'Serveur injoignable, nouvel essai…' : busy ? 'Connexion au serveur…' : feedback}</p>}
          {busy && <div className="prep-buttons"><button className="text-button" onClick={leave}>Annuler</button></div>}
        </div>
      </section>
    )
  }

  if (!room.match) {
    return (
      <section className="page-section combat-page" aria-label="Salon en ligne">
        <div className="eyebrow">{room.mode === 'pvp' ? 'JOUEUR CONTRE JOUEUR' : 'COOPÉRATION'} · EN LIGNE</div>
        <div className="combat-title-row"><div><h1>Salon en attente</h1></div>{connection}</div>
        <div className="panel handoff-panel" role="status">
          <Globe size={30} />
          <h2>Code du salon : <span className="room-code">{room.code}</span></h2>
          <p className="page-intro">Donne ce code à l’autre joueur, ou attends qu’un joueur en recherche rapide te rejoigne.</p>
          <button className="secondary-button" onClick={leave}><LogOut size={15} /> Quitter le salon</button>
        </div>
        {feedback && <p className="control-hint">{feedback}</p>}
      </section>
    )
  }

  const match = room.match
  const combat = match.combat
  const active = getActiveUnit(combat)
  const controller = activeController(match)
  const myTurn = controller === room.side
  const canAct = Boolean(active && myTurn && status === 'online')
  const foes = active ? combat.units.filter((unit) => unit.team !== active.team && unit.hp > 0) : []
  const target = foes.find((unit) => unit.id === targetId) ?? foes[0]
  const inRange = (unit: CombatUnit | undefined, range: (actor: CombatUnit) => number) => Boolean(active && unit && isWithinRange(combat, active, unit, range(active)))
  const finished = combat.status !== 'ongoing'
  const won = room.mode === 'coop' ? combat.status === 'victory' : (combat.status === 'victory') === (room.side === 'p1')
  const lastLog = combat.log[combat.log.length - 1]?.message ?? ''

  const act = (action: CombatAction) => {
    if (!active || !canAct) return
    setFeedback('')
    send({ type: 'action', actorId: active.id, action })
  }

  const onCellClick = (cell: Position) => {
    const occupant = unitAt(combat, cell)
    if (occupant && active && occupant.team !== active.team) { setTargetId(occupant.id); return }
    if (active && !combat.moved && reachableCells(combat, active.id).some((entry) => samePosition(entry, cell))) act({ type: 'move', to: cell })
  }

  const turnLabel = finished ? (won ? 'Victoire !' : 'Défaite…') : active ? `${active.name} — ${myTurn ? 'à toi de jouer' : controller === 'ai' ? 'l’IA joue' : room.mode === 'coop' ? 'tour de ton allié' : 'tour de l’adversaire'}` : ''

  return (
    <section className="page-section combat-page" aria-label="Partie en ligne en cours">
      <div className="eyebrow">{room.mode === 'pvp' ? 'JOUEUR CONTRE JOUEUR' : 'COOPÉRATION'} · EN LIGNE · SALON {room.code}</div>
      <div className="combat-title-row"><div><h1>{room.mode === 'pvp' ? 'Duel en ligne' : 'Alliance en ligne'}</h1></div><div className="round-pill">TOUR <strong>{combat.round}</strong></div>{connection}</div>
      <div className="combat-status" role="status"><Sparkles size={17} /><span>{turnLabel}</span><span className={'status-tag' + (finished ? (won ? ' victory' : ' defeat') : '')}>{finished ? 'TERMINÉ' : myTurn ? 'TON TOUR' : 'ATTENTE'}</span></div>
      {!room.opponentConnected && !finished && <p className="control-hint online-warning"><WifiOff size={14} /> {room.mode === 'coop' ? 'Ton allié' : 'L’autre joueur'} est déconnecté. La partie reprendra à son retour.</p>}
      <TacticalBoard combat={combat} canAct={canAct} selectedTargetId={target?.id} eyebrow={active ? sideLabel(match.controllers[active.id], room.side, room.mode).toUpperCase() + ' · ' + active.name.toUpperCase() : 'PLATEAU'} onCellClick={onCellClick} />
      <div className="combat-controls panel">
        {finished ? (
          <div className="victory-reward" role="status"><Trophy size={16} /> {won ? 'Victoire en ligne !' : 'Défaite en ligne.'} Les parties en ligne ne modifient pas ta progression.</div>
        ) : (
          <div className="combat-action-grid">
            <button className="combat-action primary-action" onClick={() => target && act({ type: 'attack', targetId: target.id })} disabled={!canAct || !inRange(target, attackRange)}><Swords size={18} /><span><strong>Attaque</strong><small>{target ? (inRange(target, attackRange) ? target.name : 'Cible hors de portée') : 'Aucune cible'}</small></span></button>
            <button className="combat-action" onClick={() => target && act({ type: 'technique', targetId: target.id })} disabled={!canAct || !inRange(target, techniqueRange) || !active?.technique || active.cosmos < active.technique.cost}><Flame size={18} /><span><strong>{active?.technique?.name ?? 'Technique'}</strong><small>{active?.technique ? `${active.technique.cost} Cosmos` : '—'}</small></span></button>
            <button className="combat-action" onClick={() => act({ type: 'guard' })} disabled={!canAct}><Shield size={18} /><span><strong>Garde</strong><small>Réduit les dégâts</small></span></button>
            <button className="combat-action" onClick={() => act({ type: 'focus' })} disabled={!canAct || !active || active.cosmos >= active.maxCosmos}><Sparkles size={18} /><span><strong>Concentration</strong><small>+2 Cosmos</small></span></button>
            <button className="combat-action" onClick={() => act({ type: 'wait' })} disabled={!canAct}><SkipForward size={18} /><span><strong>Fin du tour</strong><small>Passer</small></span></button>
          </div>
        )}
        <div className="combat-feedback" aria-live="polite">{feedback || lastLog}</div>
        <div className="prep-buttons"><button className="secondary-button rematch-button" onClick={leave}><LogOut size={15} /> {finished ? 'Quitter le salon' : 'Abandonner'}</button></div>
      </div>
      <div className="panel versus-roster">
        {combat.units.map((unit) => (
          <div key={unit.id} className={'versus-unit' + (unit.hp <= 0 ? ' unit-defeated' : '') + (unit.id === active?.id ? ' unit-active' : '')}>
            <span className={'battle-avatar ' + (unit.team === 'player' ? '' : 'enemy-avatar')}>{unitGlyph(unit)}</span>
            <span><strong>{unit.name}</strong><small>{sideLabel(match.controllers[unit.id], room.side, room.mode)} · PV {Math.max(0, unit.hp)}/{unit.maxHp} · Cosmos {unit.cosmos}/{unit.maxCosmos}</small></span>
          </div>
        ))}
      </div>
    </section>
  )
}

import { useState } from 'react'
import { ArrowLeft, Flame, Handshake, RotateCcw, Shield, SkipForward, Sparkles, Swords, Trophy, Users } from 'lucide-react'
import { attackRange, isWithinRange, reachableCells, samePosition, techniqueRange, unitAt } from '../combat/board'
import { getActiveUnit } from '../combat/engine'
import { KNIGHT_CATALOG } from '../combat/knights'
import TacticalBoard, { unitGlyph } from '../combat/TacticalBoard'
import type { CombatAction, CombatUnit, Position } from '../combat/types'
import { activeController, createLocalMatch, MAX_PICKS, needsHandoff, playLocalAction, VERSUS_LEVEL, winnerLabel, type Controller, type LocalMatch, type LocalMode } from './match'

const PLAYER_NAMES: Record<Controller, string> = { p1: 'Joueur 1', p2: 'Joueur 2', ai: 'IA' }

type Props = { initialMode?: LocalMode; onBack: () => void }

export default function LocalVersus({ initialMode = 'pvp', onBack }: Props) {
  const [mode, setMode] = useState<LocalMode>(initialMode)
  const [picks, setPicks] = useState<Record<'p1' | 'p2', string[]>>({ p1: ['seiya'], p2: ['shiryu'] })
  const [match, setMatch] = useState<LocalMatch | null>(null)
  const [handoff, setHandoff] = useState<Controller | null>(null)
  const [targetId, setTargetId] = useState('')
  const [feedback, setFeedback] = useState('')

  const togglePick = (player: 'p1' | 'p2', id: string) => {
    const current = picks[player]
    const next = current.includes(id) ? current.filter((entry) => entry !== id) : current.length < MAX_PICKS[mode] ? [...current, id] : current
    setPicks({ ...picks, [player]: next })
  }

  const changeMode = (next: LocalMode) => {
    setMode(next)
    setPicks({ p1: picks.p1.slice(0, MAX_PICKS[next]), p2: picks.p2.slice(0, MAX_PICKS[next]) })
  }

  const start = () => {
    const result = createLocalMatch(mode, picks.p1, picks.p2)
    if (!result.ok) { setFeedback(result.error); return }
    setMatch(result.match)
    setHandoff(activeController(result.match))
    setTargetId('')
    setFeedback('')
  }

  if (!match) {
    const setupError = (['p1', 'p2'] as const).some((player) => picks[player].length === 0) ? 'Chaque joueur doit choisir au moins un chevalier.'
      : mode === 'coop' && picks.p1.some((id) => picks.p2.includes(id)) ? 'En coop, chaque chevalier ne peut être pris que par un joueur.' : ''
    return (
      <section className="page-section combat-page" aria-label="Partie locale">
        <button className="text-button combat-back" onClick={onBack}><ArrowLeft size={15} /> Retour aux arènes</button>
        <div className="eyebrow">MÊME APPAREIL · 2 JOUEURS</div>
        <div className="combat-title-row"><div><h1>Partie locale</h1><p className="page-intro">Choisis le mode, puis chaque joueur compose son équipe. Tous les chevaliers combattent au niveau {VERSUS_LEVEL}.</p></div></div>
        <div className="mode-switch" role="radiogroup" aria-label="Mode de jeu">
          <button role="radio" aria-checked={mode === 'pvp'} className={mode === 'pvp' ? 'active' : ''} onClick={() => changeMode('pvp')}><Swords size={16} /> Joueur contre Joueur</button>
          <button role="radio" aria-checked={mode === 'coop'} className={mode === 'coop' ? 'active' : ''} onClick={() => changeMode('coop')}><Handshake size={16} /> Coop contre l’IA</button>
        </div>
        <div className="versus-setup">
          {(['p1', 'p2'] as const).map((player) => (
            <div className="panel" key={player}>
              <div className="panel-heading"><div><div className="eyebrow">{mode === 'pvp' ? (player === 'p1' ? 'CAMP GAUCHE' : 'CAMP DROIT') : 'ALLIÉ'}</div><h2>{PLAYER_NAMES[player]}</h2></div><span className="log-count">{picks[player].length}/{MAX_PICKS[mode]}</span></div>
              <div className="pick-grid">
                {KNIGHT_CATALOG.map((knight) => {
                  const selected = picks[player].includes(knight.id)
                  const taken = mode === 'coop' && picks[player === 'p1' ? 'p2' : 'p1'].includes(knight.id)
                  return (
                    <button key={knight.id} className={'pick-chip' + (selected ? ' selected' : '')} aria-pressed={selected} disabled={taken || (!selected && picks[player].length >= MAX_PICKS[mode])} onClick={() => togglePick(player, knight.id)}>
                      <span className={'battle-avatar ' + knight.color}>{knight.glyph}</span><span>{knight.name}<small>{taken ? 'Pris par l’autre joueur' : knight.technique.name}</small></span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="combat-controls panel prep-actions">
          <p className="control-hint">{setupError || (mode === 'pvp' ? 'Le Joueur 1 joue à gauche, le Joueur 2 à droite. Passez-vous l’appareil à chaque changement de joueur.' : 'Vous partagez le camp gauche contre le chef des chevaliers noirs et son escorte, contrôlés par l’IA.')}</p>
          {feedback && <p className="control-hint">{feedback}</p>}
          <div className="prep-buttons"><button className="primary-button" onClick={start} disabled={Boolean(setupError)}><Swords size={16} /> Lancer la partie</button></div>
        </div>
      </section>
    )
  }

  const combat = match.combat
  const active = getActiveUnit(combat)
  const controller = activeController(match)
  const canAct = Boolean(active && controller && controller !== 'ai' && !handoff)
  const foes = active ? combat.units.filter((unit) => unit.team !== active.team && unit.hp > 0) : []
  const target = foes.find((unit) => unit.id === targetId) ?? foes[0]
  const inRange = (unit: CombatUnit | undefined, range: (actor: CombatUnit) => number) => Boolean(active && unit && isWithinRange(combat, active, unit, range(active)))
  const winner = winnerLabel(match)

  const act = (action: CombatAction) => {
    if (!active || !canAct) return
    const result = playLocalAction(match, active.id, action)
    if (!result.ok) { setFeedback(result.error); return }
    const next = activeController(result.match)
    setMatch(result.match)
    if (needsHandoff(controller, next)) setHandoff(next)
    setFeedback(result.match.combat.log[result.match.combat.log.length - 1]?.message ?? '')
  }

  const onCellClick = (cell: Position) => {
    const occupant = unitAt(combat, cell)
    if (occupant && active && occupant.team !== active.team) { setTargetId(occupant.id); return }
    if (active && !combat.moved && reachableCells(combat, active.id).some((entry) => samePosition(entry, cell))) act({ type: 'move', to: cell })
  }

  return (
    <section className="page-section combat-page" aria-label="Partie locale en cours">
      <button className="text-button combat-back" onClick={() => setMatch(null)}><ArrowLeft size={15} /> Changer d’équipes</button>
      <div className="eyebrow">{match.mode === 'pvp' ? 'JOUEUR CONTRE JOUEUR' : 'COOPÉRATION'} · MÊME APPAREIL</div>
      <div className="combat-title-row"><div><h1>{match.mode === 'pvp' ? 'Duel de chevaliers' : 'Alliance contre les ombres'}</h1></div><div className="round-pill">TOUR <strong>{combat.round}</strong></div></div>
      <div className="combat-status" role="status"><Sparkles size={17} /><span>{winner ? `${winner} remporte la partie !` : active ? `${active.name} — ${PLAYER_NAMES[controller ?? 'ai']}` : ''}</span><span className={'status-tag ' + (controller ?? '')}>{winner ? 'TERMINÉ' : PLAYER_NAMES[controller ?? 'ai'].toUpperCase()}</span></div>
      {handoff && !winner ? (
        <div className="panel handoff-panel" role="dialog" aria-label="Passage de main">
          <Users size={30} />
          <h2>Au tour du {PLAYER_NAMES[handoff]}</h2>
          <p className="page-intro">Passe l’appareil au {PLAYER_NAMES[handoff]}.</p>
          <button className="primary-button" onClick={() => setHandoff(null)}>Je suis prêt</button>
        </div>
      ) : (
        <>
          <TacticalBoard combat={combat} canAct={canAct} selectedTargetId={target?.id} eyebrow={active && controller ? PLAYER_NAMES[controller].toUpperCase() + ' · ' + active.name.toUpperCase() : 'PLATEAU'} onCellClick={onCellClick} />
          <div className="combat-controls panel">
            {winner ? (
              <div className="victory-reward" role="status"><Trophy size={16} /> {winner} remporte la partie. Les parties locales ne modifient pas ta progression.</div>
            ) : (
              <div className="combat-action-grid">
                <button className="combat-action primary-action" onClick={() => target && act({ type: 'attack', targetId: target.id })} disabled={!canAct || !inRange(target, attackRange)}><Swords size={18} /><span><strong>Attaque</strong><small>{target ? (inRange(target, attackRange) ? target.name : 'Cible hors de portée') : 'Aucune cible'}</small></span></button>
                <button className="combat-action" onClick={() => target && act({ type: 'technique', targetId: target.id })} disabled={!canAct || !inRange(target, techniqueRange) || !active?.technique || active.cosmos < active.technique.cost}><Flame size={18} /><span><strong>{active?.technique?.name ?? 'Technique'}</strong><small>Coût : {active?.technique?.cost ?? 0} Cosmos</small></span></button>
                <button className="combat-action" onClick={() => act({ type: 'guard' })} disabled={!canAct}><Shield size={18} /><span><strong>Garde</strong><small>Réduit les dégâts</small></span></button>
                <button className="combat-action" onClick={() => act({ type: 'focus' })} disabled={!canAct || !active || active.cosmos >= active.maxCosmos}><Sparkles size={18} /><span><strong>Concentration</strong><small>+2 Cosmos</small></span></button>
                <button className="combat-action" onClick={() => act({ type: 'wait' })} disabled={!canAct}><SkipForward size={18} /><span><strong>Fin du tour</strong><small>Passer</small></span></button>
              </div>
            )}
            {feedback && <div className="combat-feedback" aria-live="polite">{feedback}</div>}
            {winner && <div className="prep-buttons"><button className="primary-button rematch-button" onClick={start}><RotateCcw size={16} /> Revanche</button><button className="secondary-button rematch-button" onClick={() => setMatch(null)}><Users size={15} /> Changer d’équipes</button></div>}
          </div>
          <div className="panel versus-roster">
            {combat.units.map((unit) => (
              <div key={unit.id} className={'versus-unit' + (unit.hp <= 0 ? ' unit-defeated' : '') + (unit.id === active?.id ? ' unit-active' : '')}>
                <span className={'battle-avatar ' + (unit.team === 'player' ? '' : 'enemy-avatar')}>{unitGlyph(unit)}</span>
                <span><strong>{unit.name}</strong><small>{PLAYER_NAMES[match.controllers[unit.id] ?? 'ai']} · PV {Math.max(0, unit.hp)}/{unit.maxHp} · Cosmos {unit.cosmos}/{unit.maxCosmos}</small></span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

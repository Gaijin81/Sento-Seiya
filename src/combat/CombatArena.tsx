import { useState } from 'react'
import { ArrowLeft, Crosshair, Flame, Footprints, Heart, RotateCcw, Shield, SkipForward, Sparkles, Swords, Trophy, Users, Zap } from 'lucide-react'
import { attackRange, isObstacle, isWithinRange, reachableCells, samePosition, techniqueRange, unitAt } from './board'
import { getActiveUnit } from './engine'
import { getKnightDefinition } from './knights'
import { createSquadCombat, createSquadUnits, DEMO_ENEMIES, playActionAndResolveAi } from './session'
import type { CombatAction, CombatState, CombatUnit, Position } from './types'
import { awardVictoryXp, VICTORY_SHARDS, VICTORY_XP, type ProgressionState } from './progression'

type Props = {
  progression: ProgressionState
  /** Persists the new progression; returns false when the browser blocked the save. */
  onProgressionChanged: (progression: ProgressionState) => boolean
  onBack: () => void
  onEditSquad: () => void
}

function unitGlyph(unit: CombatUnit): string {
  if (unit.team === 'player') return getKnightDefinition(unit.id)?.glyph ?? '?'
  return unit.name === 'Chevalier noir' ? '影' : '守'
}

function createCombatId(): string {
  return 'combat-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)
}

export default function CombatArena({ progression, onProgressionChanged, onBack, onEditSquad }: Props) {
  const [phase, setPhase] = useState<'preparation' | 'battle'>('preparation')
  const [combat, setCombat] = useState<CombatState>(() => createSquadCombat(progression))
  const [combatId, setCombatId] = useState(() => createCombatId())
  const [saveWarning, setSaveWarning] = useState(false)
  const [targetId, setTargetId] = useState('black-pega')
  const [feedback, setFeedback] = useState('Déplace-toi sur une case dorée ou choisis une action.')
  const active = getActiveUnit(combat)
  const allies = combat.units.filter((unit) => unit.team === 'player')
  const enemies = combat.units.filter((unit) => unit.team === 'enemy')
  const livingEnemies = enemies.filter((unit) => unit.hp > 0)
  const livingAllies = allies.filter((unit) => unit.hp > 0)
  const selectedTarget = livingEnemies.find((unit) => unit.id === targetId) ?? livingEnemies[0]
  const isPlayerTurn = active?.team === 'player' && combat.status === 'ongoing'
  const moveCells = isPlayerTurn && active && !combat.moved ? reachableCells(combat, active.id) : []
  const inAttackRange = (target?: CombatUnit) => Boolean(active && target && isWithinRange(combat, active, target, attackRange(active)))
  const inTechniqueRange = (target?: CombatUnit) => Boolean(active && target && isWithinRange(combat, active, target, techniqueRange(active)))

  const onCellClick = (cell: Position) => {
    if (!isPlayerTurn) return
    const occupant = unitAt(combat, cell)
    if (occupant?.team === 'enemy') {
      setTargetId(occupant.id)
      setFeedback(occupant.name + ' ciblé' + (inAttackRange(occupant) || inTechniqueRange(occupant) ? '.' : ' : hors de portée, rapproche-toi.'))
      return
    }
    if (moveCells.some((reachable) => samePosition(reachable, cell))) act({ type: 'move', to: cell })
  }

  const act = (action: CombatAction) => {
    if (!active || !isPlayerTurn) return
    const result = playActionAndResolveAi(combat, active.id, action)
    if (!result.ok) {
      setFeedback(result.error)
      return
    }
    setCombat(result.state)
    if (result.state.status === 'victory') {
      const participants = result.state.units.filter((unit) => unit.team === 'player').map((unit) => unit.id)
      const rewarded = awardVictoryXp(progression, combatId, result.state, participants)
      if (rewarded !== progression) setSaveWarning(!onProgressionChanged(rewarded))
    }
    const latest = result.state.log[result.state.log.length - 1]
    setFeedback(result.state.status === 'victory'
      ? 'Victoire ! Tous les adversaires sont hors combat.'
      : result.state.status === 'defeat'
        ? 'Défaite. Ton équipe ne peut plus combattre.'
        : latest?.message ?? 'Action terminée.')
  }

  const startBattle = () => {
    setCombat(createSquadCombat(progression))
    setCombatId(createCombatId())
    setTargetId('black-pega')
    setFeedback('Nouveau combat : déplace-toi sur une case dorée ou choisis une action.')
    setPhase('battle')
  }

  if (phase === 'preparation') {
    const squad = createSquadUnits(progression)
    return (
      <section className="page-section combat-page" aria-label="Préparation du combat">
        <button className="text-button combat-back" onClick={onBack}><ArrowLeft size={15} /> Retour aux arènes</button>
        <div className="eyebrow">ÉPREUVE DU SANCTUAIRE · PRÉPARATION</div>
        <div className="combat-title-row">
          <div><h1>Prépare ton escouade</h1><p className="page-intro">Vérifie tes chevaliers engagés et leurs statistiques actuelles avant d’entrer dans l’arène.</p></div>
          <div className="round-pill">ESCOUADE <strong>{squad.length}/3</strong></div>
        </div>
        <div className="battlefield prep-field">
          <div className="battle-side">
            <div className="battle-side-heading"><span>CHEVALIERS ENGAGÉS</span><span>{squad.length} prêt(s)</span></div>
            {squad.map((unit) => {
              const definition = getKnightDefinition(unit.id)
              const level = progression.knights.find((knight) => knight.id === unit.id)?.level ?? 1
              return (
                <article className="battle-unit ally" key={unit.id}>
                  <div className={'battle-avatar ' + (definition?.color ?? '')}>{definition?.glyph ?? '?'}</div>
                  <div className="battle-unit-main">
                    <div className="battle-unit-name"><strong>{unit.name}</strong><span>NIV. {level}</span></div>
                    <div className="meter-label"><Heart size={12} /> PV <b>{unit.maxHp}</b></div>
                    <div className="meter-label"><Zap size={12} /> ATQ <b>{unit.attack}</b><span className="enemy-defense">DÉF {unit.defense} · VIT {unit.speed}</span></div>
                    <div className="meter-label"><Flame size={12} /> {unit.technique?.name} <b>{unit.technique?.cost} Cosmos</b></div>
                  </div>
                </article>
              )
            })}
          </div>
          <div className="battle-divider"><span>VS</span><i /></div>
          <div className="battle-side enemy-side">
            <div className="battle-side-heading"><span>ADVERSAIRES ATTENDUS</span><span>{DEMO_ENEMIES.length}</span></div>
            {DEMO_ENEMIES.map((unit) => (
              <article className="battle-unit enemy" key={unit.id}>
                <div className="battle-avatar enemy-avatar">{unit.name === 'Chevalier noir' ? '影' : '守'}</div>
                <div className="battle-unit-main">
                  <div className="battle-unit-name"><strong>{unit.name}</strong><span>ENNEMI</span></div>
                  <div className="meter-label"><Heart size={12} /> PV <b>{unit.maxHp}</b></div>
                  <div className="meter-label"><Zap size={12} /> ATQ <b>{unit.attack}</b><span className="enemy-defense">DÉF {unit.defense}</span></div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="combat-controls panel prep-actions">
          <p className="control-hint">Récompense de victoire : +{VICTORY_XP} XP pour chaque chevalier engagé et +{VICTORY_SHARDS} éclats de Cosmos pour recruter.</p>
          <div className="prep-buttons">
            <button className="secondary-button" onClick={onEditSquad}><Users size={15} /> Modifier l’escouade</button>
            <button className="primary-button" onClick={startBattle}><Swords size={16} /> Lancer le combat</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page-section combat-page" aria-label="Combat tactique">
      <button className="text-button combat-back" onClick={onBack}><ArrowLeft size={15} /> Retour aux arènes</button>
      <div className="eyebrow">ÉPREUVE DU SANCTUAIRE · COMBAT TACTIQUE</div>
      <div className="combat-title-row">
        <div><h1>Le réveil du Cosmos</h1><p className="page-intro">Déplace tes chevaliers sur le plateau, puis frappe les adversaires à portée. Les tours de l’IA se résolvent automatiquement.</p></div>
        <div className="round-pill">TOUR <strong>{combat.round}</strong></div>
      </div>
      <div className="progression-summary" aria-label="Progression sauvegardée"><span><Sparkles size={14} /> EXPÉRIENCE DU JOUEUR <strong>{progression.playerXp} XP</strong></span><span>VICTOIRES <strong>{progression.victories}</strong></span><span>ÉCLATS <strong>{progression.cosmosShards}</strong></span></div>
      <div className="combat-status" role="status"><Sparkles size={17} /><span>{combat.status === 'victory' ? 'Victoire — le Sanctuaire reconnaît ta force.' : combat.status === 'defeat' ? 'Défaite — retente ta chance.' : active ? 'Au tour de ' + active.name + (active.team === 'enemy' ? ' (IA).' : '.') : 'Combat terminé.'}</span><span className={'status-tag ' + combat.status}>{combat.status === 'ongoing' ? 'EN COURS' : combat.status === 'victory' ? 'VICTOIRE' : 'DÉFAITE'}</span></div>
      {combat.board && (
        <div className="panel tactical-panel">
          <div className="panel-heading"><div><div className="eyebrow">PLATEAU · ARÈNE DU SANCTUAIRE</div><h2>{!isPlayerTurn ? 'Plateau' : combat.moved ? 'Agis ou termine ton tour' : 'Touche une case dorée pour te déplacer'}</h2></div>{active && isPlayerTurn && <span className="control-hint"><Footprints size={13} /> Mouv. {active.move ?? 3} · Portée {attackRange(active)} · Technique {techniqueRange(active)}</span>}</div>
          <div className="tactical-board" role="grid" aria-label="Plateau de combat" style={{ gridTemplateColumns: `repeat(${combat.board.width}, minmax(0, 1fr))` }}>
            {Array.from({ length: combat.board.height }, (_, y) => Array.from({ length: combat.board!.width }, (_, x) => {
              const cell = { x, y }
              const occupant = unitAt(combat, cell)
              const obstacle = isObstacle(combat.board!, cell)
              const reachable = moveCells.some((entry) => samePosition(entry, cell))
              const targetable = occupant?.team === 'enemy' && isPlayerTurn && (inAttackRange(occupant) || inTechniqueRange(occupant))
              const classes = ['board-cell',
                obstacle ? 'cell-obstacle' : '',
                reachable ? 'cell-reachable' : '',
                occupant ? 'cell-' + (occupant.team === 'player' ? 'ally' : 'enemy') : '',
                occupant && occupant.id === active?.id ? 'cell-active' : '',
                occupant && occupant.id === selectedTarget?.id ? 'cell-target' : '',
                targetable ? 'cell-in-range' : ''].filter(Boolean).join(' ')
              const label = 'Case ' + (x + 1) + '-' + (y + 1) + (obstacle ? ', pilier' : '') + (occupant ? ', ' + occupant.name + ' ' + occupant.hp + '/' + occupant.maxHp + ' PV' : '') + (reachable ? ', déplacement possible' : '') + (targetable ? ', à portée' : '')
              return (
                <button type="button" role="gridcell" key={x + '-' + y} className={classes} aria-label={label} onClick={() => onCellClick(cell)} disabled={!isPlayerTurn || obstacle || (!reachable && occupant?.team !== 'enemy')}>
                  {obstacle && <span className="pillar" aria-hidden="true">▲</span>}
                  {occupant && <span className={'board-token ' + (occupant.team === 'player' ? getKnightDefinition(occupant.id)?.color ?? '' : 'enemy-avatar')} aria-hidden="true">{unitGlyph(occupant)}<i style={{ width: (occupant.hp / occupant.maxHp * 100) + '%' }} /></span>}
                </button>
              )
            }))}
          </div>
        </div>
      )}
      <div className="battlefield">
        <div className="battle-side">
          <div className="battle-side-heading"><span>TES CHEVALIERS</span><span>{livingAllies.length}/{allies.length} actifs</span></div>
          {allies.map((unit) => (
            <article className={'battle-unit ally ' + (active?.id === unit.id ? 'unit-active ' : '') + (unit.hp <= 0 ? 'unit-defeated' : '')} key={unit.id}>
              <div className={'battle-avatar ' + (getKnightDefinition(unit.id)?.color ?? '')}>{getKnightDefinition(unit.id)?.glyph ?? '?'}</div>
              <div className="battle-unit-main">
                <div className="battle-unit-name"><strong>{unit.name}</strong><span>{unit.hp <= 0 ? 'HORS COMBAT' : active?.id === unit.id ? 'À TOI DE JOUER' : 'NIV. ' + (progression.knights.find((knight) => knight.id === unit.id)?.level ?? 1)}</span></div>
                <div className="meter-label"><Heart size={12} /> PV <b>{unit.hp}/{unit.maxHp}</b></div>
                <div className="battle-meter hp-meter"><span style={{ width: (unit.hp / unit.maxHp * 100) + '%' }} /></div>
                <div className="meter-label"><Flame size={12} /> Cosmos <b>{unit.cosmos}/{unit.maxCosmos}</b></div>
                <div className="battle-meter cosmos-meter"><span style={{ width: (unit.cosmos / unit.maxCosmos * 100) + '%' }} /></div>
              </div>
              {unit.guarding && <Shield className="guard-indicator" size={17} aria-label="En garde" />}
            </article>
          ))}
        </div>
        <div className="battle-divider"><span>VS</span><i /></div>
        <div className="battle-side enemy-side">
          <div className="battle-side-heading"><span>ADVERSAIRES</span><span>{livingEnemies.length}/{enemies.length} actifs</span></div>
          {enemies.map((unit) => (
            <button type="button" className={'battle-unit enemy ' + (targetId === unit.id && unit.hp > 0 ? 'target-selected ' : '') + (unit.hp <= 0 ? 'unit-defeated' : '')} key={unit.id} onClick={() => unit.hp > 0 && setTargetId(unit.id)} disabled={unit.hp <= 0 || !isPlayerTurn} aria-pressed={targetId === unit.id}>
              <div className="battle-avatar enemy-avatar">{unit.name === 'Chevalier noir' ? '影' : '守'}</div>
              <div className="battle-unit-main">
                <div className="battle-unit-name"><strong>{unit.name}</strong><span>{unit.hp <= 0 ? 'VAINCU' : targetId === unit.id ? 'CIBLE' : 'ENNEMI'}</span></div>
                <div className="meter-label"><Heart size={12} /> PV <b>{unit.hp}/{unit.maxHp}</b></div>
                <div className="battle-meter hp-meter"><span style={{ width: (unit.hp / unit.maxHp * 100) + '%' }} /></div>
                <div className="meter-label"><Zap size={12} /> ATQ <b>{unit.attack}</b><span className="enemy-defense">DÉF {unit.defense}</span></div>
              </div>
              {targetId === unit.id && unit.hp > 0 && <Crosshair className="target-icon" size={17} aria-label="Cible sélectionnée" />}
            </button>
          ))}
        </div>
      </div>
      <div className="combat-controls panel">
        <div className="panel-heading"><div><div className="eyebrow">ORDRES DE COMBAT</div><h2>{active?.team === 'player' ? active.name : 'Résolution du tour'}</h2></div><span className="control-hint">Choisis une action légale</span></div>
        <div className="combat-action-grid">
          <button className="combat-action primary-action" onClick={() => selectedTarget && act({ type: 'attack', targetId: selectedTarget.id })} disabled={!isPlayerTurn || !inAttackRange(selectedTarget)}><Swords size={18} /><span><strong>Attaque</strong><small>{selectedTarget && !inAttackRange(selectedTarget) ? 'Cible hors de portée' : 'Dégâts physiques'}</small></span></button>
          <button className="combat-action" onClick={() => selectedTarget && act({ type: 'technique', targetId: selectedTarget.id })} disabled={!isPlayerTurn || !inTechniqueRange(selectedTarget) || !active?.technique || active.cosmos < (active.technique?.cost ?? 0)}><Flame size={18} /><span><strong>{active?.technique?.name ?? 'Technique'}</strong><small>Coût : {active?.technique?.cost ?? 0} Cosmos</small></span></button>
          <button className="combat-action" onClick={() => act({ type: 'guard' })} disabled={!isPlayerTurn}><Shield size={18} /><span><strong>Garde</strong><small>Réduit les prochains dégâts</small></span></button>
          <button className="combat-action" onClick={() => act({ type: 'focus' })} disabled={!isPlayerTurn || !active || active.cosmos >= active.maxCosmos}><Sparkles size={18} /><span><strong>Concentration</strong><small>Récupère jusqu’à 2 Cosmos</small></span></button>
          {combat.board && <button className="combat-action" onClick={() => act({ type: 'wait' })} disabled={!isPlayerTurn}><SkipForward size={18} /><span><strong>Fin du tour</strong><small>{combat.moved ? 'Garder la position' : 'Attendre sans agir'}</small></span></button>}
        </div>
        <div className="combat-feedback" aria-live="polite">{feedback}</div>
        {combat.status === 'victory' && <div className="victory-reward" role="status"><Trophy size={16} /> Victoire récompensée : +{VICTORY_XP} XP pour chaque chevalier engagé et +{VICTORY_SHARDS} éclats de Cosmos. {saveWarning ? 'Attention : le navigateur a bloqué la sauvegarde locale.' : 'Progression sauvegardée sur cet appareil.'}</div>}
        {combat.status !== 'ongoing' && <div className="prep-buttons"><button className="primary-button rematch-button" onClick={startBattle}><RotateCcw size={16} /> Recommencer le combat</button><button className="secondary-button rematch-button" onClick={() => setPhase('preparation')}><Users size={15} /> Retour à la préparation</button></div>}
      </div>
      <div className="panel combat-log"><div className="panel-heading"><div><div className="eyebrow">CHRONIQUE DU COMBAT</div><h2>Journal des actions</h2></div><span className="log-count">{combat.log.length} action(s)</span></div>
        {combat.log.length === 0 ? <p className="empty-log">Les actions apparaîtront ici au fil du combat.</p> : <ol>{[...combat.log].reverse().map((entry, index) => {
          const actor = combat.units.find((unit) => unit.id === entry.actorId)
          return <li key={entry.round + '-' + entry.actorId + '-' + index}><span className="log-round">T{entry.round}</span><span><strong>{actor?.name ?? entry.actorId}</strong> · {entry.message}</span></li>
        })}</ol>}
      </div>
      <p className="rights-note">La progression est sauvegardée dans le stockage local de ce navigateur. Effacer les données du site peut supprimer la sauvegarde ; aucune synchronisation cloud n’est activée.</p>
    </section>
  )
}

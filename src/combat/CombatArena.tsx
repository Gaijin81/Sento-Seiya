import { useState } from 'react'
import { ArrowLeft, Crosshair, Flame, Heart, RotateCcw, Shield, Sparkles, Swords, Trophy, Zap } from 'lucide-react'
import { getActiveUnit } from './engine'
import { createDemoCombat, playActionAndResolveAi } from './session'
import type { CombatAction, CombatState } from './types'
import { awardVictoryXp, createInitialProgression, loadProgression, saveProgression, VICTORY_XP, type ProgressionState } from './progression'

type Props = { onBack: () => void; onProgressionChanged?: (progression: ProgressionState) => void }

function createCombatId(): string {
  return 'combat-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)
}

export default function CombatArena({ onBack, onProgressionChanged }: Props) {
  const [combat, setCombat] = useState<CombatState>(() => createDemoCombat())
  const [combatId, setCombatId] = useState(() => createCombatId())
  const [progression, setProgression] = useState<ProgressionState>(() => {
    if (typeof window === 'undefined') return createInitialProgression()
    return loadProgression(window.localStorage)
  })
  const [targetId, setTargetId] = useState('black-pega')
  const [feedback, setFeedback] = useState('Choisis une action pour commencer le combat.')
  const active = getActiveUnit(combat)
  const allies = combat.units.filter((unit) => unit.team === 'player')
  const enemies = combat.units.filter((unit) => unit.team === 'enemy')
  const livingEnemies = enemies.filter((unit) => unit.hp > 0)
  const livingAllies = allies.filter((unit) => unit.hp > 0)
  const selectedTarget = livingEnemies.find((unit) => unit.id === targetId) ?? livingEnemies[0]
  const isPlayerTurn = active?.team === 'player' && combat.status === 'ongoing'

  const act = (action: CombatAction) => {
    if (!active || !isPlayerTurn) return
    const result = playActionAndResolveAi(combat, active.id, action)
    if (!result.ok) {
      setFeedback(result.error)
      return
    }
    setCombat(result.state)
    if (result.state.status === 'victory') {
      const rewarded = awardVictoryXp(progression, combatId, result.state)
      if (rewarded !== progression) {
        setProgression(rewarded)
        onProgressionChanged?.(rewarded)
        try {
          if (typeof window !== 'undefined') saveProgression(window.localStorage, rewarded)
        } catch {
          setFeedback('Victoire ! Les récompenses sont attribuées, mais le navigateur a bloqué la sauvegarde locale.')
        }
      }
    }
    const latest = result.state.log[result.state.log.length - 1]
    setFeedback(result.state.status === 'victory'
      ? 'Victoire ! Tous les adversaires sont hors combat.'
      : result.state.status === 'defeat'
        ? 'Défaite. Ton équipe ne peut plus combattre.'
        : latest?.message ?? 'Action terminée.')
  }

  const reset = () => {
    setCombat(createDemoCombat())
    setCombatId(createCombatId())
    setTargetId('black-pega')
    setFeedback('Nouveau combat : choisis une action.')
  }

  return (
    <section className="page-section combat-page" aria-label="Combat tactique">
      <button className="text-button combat-back" onClick={onBack}><ArrowLeft size={15} /> Retour aux arènes</button>
      <div className="eyebrow">ÉPREUVE DU SANCTUAIRE · COMBAT TACTIQUE</div>
      <div className="combat-title-row">
        <div><h1>Le réveil du Cosmos</h1><p className="page-intro">Élimine les adversaires. Les tours de l’IA se résolvent automatiquement.</p></div>
        <div className="round-pill">TOUR <strong>{combat.round}</strong></div>
      </div>
      <div className="progression-summary" aria-label="Progression sauvegardée"><span><Sparkles size={14} /> EXPÉRIENCE DU JOUEUR <strong>{progression.playerXp} XP</strong></span><span>VICTOIRES <strong>{progression.victories}</strong></span></div>
      <div className="combat-status" role="status"><Sparkles size={17} /><span>{combat.status === 'victory' ? 'Victoire — le Sanctuaire reconnaît ta force.' : combat.status === 'defeat' ? 'Défaite — retente ta chance.' : active ? 'Au tour de ' + active.name + (active.team === 'enemy' ? ' (IA).' : '.') : 'Combat terminé.'}</span><span className={'status-tag ' + combat.status}>{combat.status === 'ongoing' ? 'EN COURS' : combat.status === 'victory' ? 'VICTOIRE' : 'DÉFAITE'}</span></div>
      <div className="battlefield">
        <div className="battle-side">
          <div className="battle-side-heading"><span>TES CHEVALIERS</span><span>{livingAllies.length}/{allies.length} actifs</span></div>
          {allies.map((unit) => (
            <article className={'battle-unit ally ' + (active?.id === unit.id ? 'unit-active ' : '') + (unit.hp <= 0 ? 'unit-defeated' : '')} key={unit.id}>
              <div className="battle-avatar">{unit.name === 'Seiya' ? '天' : unit.name === 'Shiryu' ? '龍' : '白'}</div>
              <div className="battle-unit-main">
                <div className="battle-unit-name"><strong>{unit.name}</strong><span>{unit.hp <= 0 ? 'HORS COMBAT' : active?.id === unit.id ? 'À TOI DE JOUER' : 'CHEVALIER DE BRONZE'}</span></div>
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
          <button className="combat-action primary-action" onClick={() => selectedTarget && act({ type: 'attack', targetId: selectedTarget.id })} disabled={!isPlayerTurn || !selectedTarget}><Swords size={18} /><span><strong>Attaque</strong><small>Dégâts physiques</small></span></button>
          <button className="combat-action" onClick={() => selectedTarget && act({ type: 'technique', targetId: selectedTarget.id })} disabled={!isPlayerTurn || !selectedTarget || !active?.technique || active.cosmos < (active.technique?.cost ?? 0)}><Flame size={18} /><span><strong>{active?.technique?.name ?? 'Technique'}</strong><small>Coût : {active?.technique?.cost ?? 0} Cosmos</small></span></button>
          <button className="combat-action" onClick={() => act({ type: 'guard' })} disabled={!isPlayerTurn}><Shield size={18} /><span><strong>Garde</strong><small>Réduit les prochains dégâts</small></span></button>
          <button className="combat-action" onClick={() => act({ type: 'focus' })} disabled={!isPlayerTurn || !active || active.cosmos >= active.maxCosmos}><Sparkles size={18} /><span><strong>Concentration</strong><small>Récupère jusqu’à 2 Cosmos</small></span></button>
        </div>
        <div className="combat-feedback" aria-live="polite">{feedback}</div>
        {combat.status === 'victory' && <div className="victory-reward" role="status"><Trophy size={16} /> Victoire récompensée : +{VICTORY_XP} XP pour chacun de tes chevaliers. Progression sauvegardée sur cet appareil.</div>}
        {combat.status !== 'ongoing' && <button className="primary-button rematch-button" onClick={reset}><RotateCcw size={16} /> Recommencer le combat</button>}
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

import { BookOpen, Crown, Flag, Gem, Heart, Lock, RotateCcw, ScrollText, Swords } from 'lucide-react'
import type { ProgressionState } from '../combat/progression'
import { getNode, listChoices, pendingEncounter } from './engine'
import { ENCOUNTERS } from './encounters'
import type { CampaignState, Chapter, NodeKind } from './types'

const KIND_LABELS: Record<NodeKind, string> = { start: 'DÉPART', story: 'RÉCIT', combat: 'COMBAT', treasure: 'TRÉSOR', rest: 'REPOS', boss: 'BOSS', ending: 'FIN' }
const KIND_ICONS = { start: Flag, story: ScrollText, combat: Swords, treasure: Gem, rest: Heart, boss: Crown, ending: BookOpen }

type Props = {
  chapter: Chapter
  state: CampaignState
  progression: ProgressionState
  outcome: string
  onChoose: (choiceId: string) => void
  onResumeCombat: () => void
  onRetreat: () => void
  onRestart: () => void
}

export default function CampaignBoard({ chapter, state, progression, outcome, onChoose, onResumeCombat, onRetreat, onRestart }: Props) {
  const node = getNode(chapter, state.nodeId)
  if (!node) return null
  const choices = listChoices(chapter, state, progression)
  const nextIds = new Set(state.pending ? [] : choices.filter((view) => !view.locked).map((view) => view.choice.goTo))
  const pendingId = pendingEncounter(chapter, state)
  const pendingChoice = node.choices.find((choice) => choice.id === state.pending?.choiceId)
  const center = (x: number, y: number) => ({ x: x + 0.5, y: y + 0.5 })

  return (
    <section className="section-block campaign-board-section" id="campaign-board" aria-label="Plateau d’aventure">
      <div className="section-heading"><div><div className="eyebrow">PLATEAU D’AVENTURE</div><h2>{chapter.title}</h2></div><span className="log-count">{state.visited.length}/{chapter.nodes.length} cases explorées</span></div>
      <div className="panel adventure-panel">
        <div className="adventure-map" style={{ aspectRatio: `${chapter.width} / ${chapter.height}` }}>
          <svg viewBox={`0 0 ${chapter.width} ${chapter.height}`} preserveAspectRatio="none" aria-hidden="true">
            {chapter.nodes.flatMap((from) => from.choices.map((choice) => {
              const to = getNode(chapter, choice.goTo)
              if (!to) return null
              const a = center(from.x, from.y)
              const b = center(to.x, to.y)
              const travelled = state.history.some((step) => step.nodeId === from.id && getNode(chapter, from.choices.find((entry) => entry.id === step.choiceId)?.goTo ?? '')?.id === to.id)
              return <line key={from.id + choice.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={travelled ? 'path-travelled' : from.id === node.id ? 'path-open' : ''} vectorEffect="non-scaling-stroke" />
            }))}
          </svg>
          {chapter.nodes.map((entry) => {
            const Icon = KIND_ICONS[entry.kind]
            const status = entry.id === node.id ? 'node-current' : nextIds.has(entry.id) ? 'node-next' : state.visited.includes(entry.id) ? 'node-visited' : ''
            return (
              <div key={entry.id} className={`adventure-node kind-${entry.kind} ${status}`} style={{ left: `${(entry.x + 0.5) / chapter.width * 100}%`, top: `${(entry.y + 0.5) / chapter.height * 100}%` }} title={entry.title} aria-label={`${entry.title} (${KIND_LABELS[entry.kind]})${entry.id === node.id ? ', position actuelle' : ''}`}>
                <Icon size={18} />
              </div>
            )
          })}
        </div>
        <article className="scene-card" aria-live="polite">
          <div className="eyebrow">{KIND_LABELS[node.kind]} · CASE {state.visited.length}</div>
          <h3>{node.title}</h3>
          {outcome && <p className="scene-outcome">{outcome}</p>}
          <p className="scene-text">{node.text}</p>
          {state.pending && pendingId ? (
            <div className="choice-list">
              <p className="control-hint">Combat en attente : « {pendingChoice?.label} » contre {ENCOUNTERS[pendingId]?.title ?? 'l’adversaire'}.</p>
              <button className="choice-button" onClick={onResumeCombat}><Swords size={16} /> <span>Rejoindre le combat</span></button>
              <button className="choice-button" onClick={onRetreat}><RotateCcw size={16} /> <span>Renoncer et choisir autre chose</span></button>
            </div>
          ) : state.completed ? (
            <div className="choice-list">
              <p className="control-hint">Chapitre terminé en {state.history.length} choix. Rejoue-le pour découvrir les autres chemins (les récompenses déjà obtenues ne sont pas redonnées).</p>
              <button className="choice-button" onClick={onRestart}><RotateCcw size={16} /> <span>Rejouer le chapitre</span></button>
            </div>
          ) : (
            <ol className="choice-list">
              {choices.map(({ choice, locked }, index) => (
                <li key={choice.id}>
                  <button className={'choice-button' + (locked ? ' choice-locked' : '')} onClick={() => onChoose(choice.id)} disabled={Boolean(locked)}>
                    <b>{index + 1}</b>
                    <span>{choice.label}{choice.combat && <small><Swords size={11} /> Combat : {ENCOUNTERS[choice.combat]?.title}</small>}{locked && <small><Lock size={11} /> {locked}</small>}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </article>
      </div>
    </section>
  )
}

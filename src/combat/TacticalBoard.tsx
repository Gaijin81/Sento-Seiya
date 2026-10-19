import { Footprints, Mountain, Shield, Sparkles } from 'lucide-react'
import { attackRange, isObstacle, isWithinRange, rangeBonus, reachableCells, samePosition, TERRAIN_LABELS, techniqueRange, terrainAt, unitAt } from './board'
import { getActiveUnit } from './engine'
import { getKnightDefinition } from './knights'
import type { CombatState, CombatUnit, Position } from './types'

const knightOf = (unit: Pick<CombatUnit, 'id'>) => getKnightDefinition(unit.id.replace(/^p2-/, ''))

export function unitGlyph(unit: Pick<CombatUnit, 'id' | 'name' | 'team'>): string {
  const definition = knightOf(unit)
  if (definition) return definition.glyph
  return /noir/i.test(unit.name) ? '影' : '守'
}

type Props = {
  combat: CombatState
  /** Whether a human controls the active unit right now. */
  canAct: boolean
  selectedTargetId?: string
  heading?: string
  eyebrow?: string
  onCellClick: (cell: Position) => void
}

export default function TacticalBoard({ combat, canAct, selectedTargetId, heading, eyebrow = 'PLATEAU · ARÈNE DU SANCTUAIRE', onCellClick }: Props) {
  const board = combat.board
  if (!board) return null
  const active = getActiveUnit(combat)
  const moveCells = canAct && active && !combat.moved ? reachableCells(combat, active.id) : []
  const inRange = (target: CombatUnit) => Boolean(active && (isWithinRange(combat, active, target, attackRange(active)) || isWithinRange(combat, active, target, techniqueRange(active))))
  const title = heading ?? (!canAct ? 'Plateau' : combat.moved ? 'Agis ou termine ton tour' : 'Touche une case dorée pour te déplacer')

  return (
    <div className="panel tactical-panel">
      <div className="panel-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div>{active && canAct && <span className="control-hint"><Footprints size={13} /> Mouv. {active.move ?? 3} · Portée {attackRange(active) + rangeBonus(combat, active)} · Technique {techniqueRange(active) + rangeBonus(combat, active)}</span>}</div>
      <div className="tactical-board" role="grid" aria-label="Plateau de combat" style={{ gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))` }}>
        {Array.from({ length: board.height }, (_, y) => Array.from({ length: board.width }, (_, x) => {
          const cell = { x, y }
          const occupant = unitAt(combat, cell)
          const obstacle = isObstacle(board, cell)
          const terrain = terrainAt(board, cell)
          const reachable = moveCells.some((entry) => samePosition(entry, cell))
          const foe = Boolean(occupant && active && occupant.team !== active.team)
          const targetable = foe && canAct && inRange(occupant!)
          const classes = ['board-cell',
            obstacle ? 'cell-obstacle' : '',
            terrain ? 'cell-' + terrain : '',
            reachable ? 'cell-reachable' : '',
            occupant ? 'cell-' + (occupant.team === 'player' ? 'ally' : 'enemy') : '',
            occupant && occupant.id === active?.id ? 'cell-active' : '',
            occupant && occupant.id === selectedTargetId ? 'cell-target' : '',
            targetable ? 'cell-in-range' : ''].filter(Boolean).join(' ')
          const label = 'Case ' + (x + 1) + '-' + (y + 1) + (obstacle ? ', pilier' : '') + (terrain ? ', ' + TERRAIN_LABELS[terrain] : '') + (occupant ? ', ' + occupant.name + ' ' + occupant.hp + '/' + occupant.maxHp + ' PV' : '') + (reachable ? ', déplacement possible' : '') + (targetable ? ', à portée' : '')
          return (
            <button type="button" role="gridcell" key={x + '-' + y} className={classes} aria-label={label} onClick={() => onCellClick(cell)} disabled={!canAct || obstacle || (!reachable && !foe)}>
              {obstacle && <span className="pillar" aria-hidden="true">▲</span>}
              {terrain && <span className="terrain-mark" aria-hidden="true">{terrain === 'cover' ? <Shield size={12} /> : terrain === 'height' ? <Mountain size={12} /> : <Sparkles size={12} />}</span>}
              {occupant && <span className={'board-token ' + (occupant.team === 'player' ? knightOf(occupant)?.color ?? '' : 'enemy-avatar')} aria-hidden="true">{unitGlyph(occupant)}<i style={{ width: (occupant.hp / occupant.maxHp * 100) + '%' }} /></span>}
            </button>
          )
        }))}
      </div>
      {board.terrain && board.terrain.length > 0 && <p className="terrain-legend"><span><Shield size={12} /> Couverture : −2 dégâts subis</span><span><Mountain size={12} /> Hauteur : +1 portée</span><span><Sparkles size={12} /> Source : +1 Cosmos en s’y arrêtant</span></p>}
    </div>
  )
}

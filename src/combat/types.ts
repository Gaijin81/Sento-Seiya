export type Team = 'player' | 'enemy'
export type CombatStatus = 'ongoing' | 'victory' | 'defeat'

export type Technique = {
  name: string
  cost: number
  power: number
  /** Board range in cells; defaults to the unit's attack range. */
  range?: number
}

export type Position = { x: number; y: number }

export type TerrainKind = 'cover' | 'height' | 'cosmos'

export type Board = {
  width: number
  height: number
  obstacles: Position[]
  /** Special cells: cover (−2 damage taken), height (+1 range), cosmos spring (+1 Cosmos when stopping there). */
  terrain?: (Position & { kind: TerrainKind })[]
}

export type CombatUnit = {
  id: string
  name: string
  team: Team
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  cosmos: number
  maxCosmos: number
  technique?: Technique
  guarding: boolean
  position?: Position
  /** Cells the unit may move per activation on a board. */
  move?: number
  /** Basic attack range in cells on a board. */
  range?: number
}

export type UnitSetup = Omit<CombatUnit, 'guarding'>

export type CombatAction =
  | { type: 'attack'; targetId: string }
  | { type: 'technique'; targetId: string }
  | { type: 'guard' }
  | { type: 'focus' }
  | { type: 'move'; to: Position }
  | { type: 'wait' }

export type CombatLogEntry = {
  round: number
  actorId: string
  action: CombatAction['type']
  message: string
}

export type CombatState = {
  units: CombatUnit[]
  turnOrder: string[]
  activeIndex: number
  round: number
  status: CombatStatus
  winner: Team | null
  log: CombatLogEntry[]
  /** Present for tactical board combats; absent for legacy duels without positions. */
  board?: Board
  /** Whether the active unit already moved during its activation. */
  moved: boolean
}

export type ActionResult =
  | { ok: true; state: CombatState }
  | { ok: false; error: string; state: CombatState }

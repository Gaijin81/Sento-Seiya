export type Team = 'player' | 'enemy'
export type CombatStatus = 'ongoing' | 'victory' | 'defeat'

export type Technique = {
  name: string
  cost: number
  power: number
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
}

export type UnitSetup = Omit<CombatUnit, 'guarding'>

export type CombatAction =
  | { type: 'attack'; targetId: string }
  | { type: 'technique'; targetId: string }
  | { type: 'guard' }
  | { type: 'focus' }

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
}

export type ActionResult =
  | { ok: true; state: CombatState }
  | { ok: false; error: string; state: CombatState }

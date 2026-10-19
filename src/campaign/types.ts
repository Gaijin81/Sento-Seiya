import type { UnitSetup } from '../combat/types'

export type NodeKind = 'start' | 'story' | 'combat' | 'treasure' | 'rest' | 'boss' | 'ending'

/** Every listed condition must hold for the choice to be available. */
export type Requirement = {
  flag?: string
  /** Knight recruited in the collection. */
  knight?: string
  /** Knight currently engaged in the squad. */
  squad?: string
  minShards?: number
}

export type Effects = {
  flags?: string[]
  shards?: number
  recruit?: string
}

export type Choice = {
  id: string
  label: string
  goTo: string
  /** Text shown once the choice is resolved. */
  outcome?: string
  requires?: Requirement
  effects?: Effects
  /** Encounter to win before the choice resolves. */
  combat?: string
}

export type CampaignNode = {
  id: string
  kind: NodeKind
  title: string
  text: string
  /** Cell on the adventure board. */
  x: number
  y: number
  choices: Choice[]
}

export type Chapter = {
  id: string
  title: string
  width: number
  height: number
  start: string
  nodes: CampaignNode[]
}

export type Encounter = {
  id: string
  title: string
  enemies: UnitSetup[]
}

export type CampaignState = {
  version: 1
  chapterId: string
  nodeId: string
  visited: string[]
  flags: string[]
  history: { nodeId: string; choiceId: string }[]
  /** Choice waiting for a combat victory. */
  pending: { nodeId: string; choiceId: string } | null
  /** `node:choice` keys whose rewards were already granted, kept across replays. */
  rewarded: string[]
  completed: boolean
}

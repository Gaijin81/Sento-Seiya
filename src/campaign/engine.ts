import { MAX_SQUAD_SIZE, createKnightProgress, type ProgressionState, type StorageLike } from '../combat/progression'
import { getKnightDefinition } from '../combat/knights'
import type { CampaignNode, CampaignState, Chapter, Choice, Requirement } from './types'

export const CAMPAIGN_KEY = 'sento-seiya-campaign'

export type CampaignResult =
  | { ok: true; state: CampaignState; progression: ProgressionState; outcome: string; encounter?: string }
  | { ok: false; error: string }

export type ChoiceView = { choice: Choice; locked: string | null }

export function createCampaign(chapter: Chapter, rewarded: string[] = []): CampaignState {
  return { version: 1, chapterId: chapter.id, nodeId: chapter.start, visited: [chapter.start], flags: [], history: [], pending: null, rewarded: [...rewarded], completed: false }
}

export function getNode(chapter: Chapter, id: string): CampaignNode | undefined {
  return chapter.nodes.find((node) => node.id === id)
}

const knightName = (id: string) => getKnightDefinition(id)?.name ?? id

/** Returns null when the requirement holds, otherwise why the choice is locked. */
export function lockReason(requirement: Requirement | undefined, state: CampaignState, progression: ProgressionState): string | null {
  if (!requirement) return null
  if (requirement.flag && !state.flags.includes(requirement.flag)) return 'Un choix précédent te manque.'
  if (requirement.knight && !progression.knights.some((knight) => knight.id === requirement.knight)) return `Requiert ${knightName(requirement.knight)} dans ta collection.`
  if (requirement.squad && !progression.squad.includes(requirement.squad)) return `Requiert ${knightName(requirement.squad)} dans l’escouade.`
  if (requirement.minShards !== undefined && progression.cosmosShards < requirement.minShards) return `Requiert ${requirement.minShards} éclats de Cosmos.`
  return null
}

export function listChoices(chapter: Chapter, state: CampaignState, progression: ProgressionState): ChoiceView[] {
  const node = getNode(chapter, state.nodeId)
  return node ? node.choices.map((choice) => ({ choice, locked: lockReason(choice.requires, state, progression) })) : []
}

function recruit(progression: ProgressionState, id: string): ProgressionState {
  if (!getKnightDefinition(id) || progression.knights.some((knight) => knight.id === id)) return progression
  return {
    ...progression,
    knights: [...progression.knights, createKnightProgress(id)],
    squad: progression.squad.length < MAX_SQUAD_SIZE ? [...progression.squad, id] : progression.squad,
  }
}

function resolve(chapter: Chapter, state: CampaignState, progression: ProgressionState, node: CampaignNode, choice: Choice): CampaignResult {
  const destination = getNode(chapter, choice.goTo)
  if (!destination) return { ok: false, error: 'Destination inconnue.' }
  const key = `${node.id}:${choice.id}`
  const effects = choice.effects ?? {}
  let next = progression
  if (!state.rewarded.includes(key)) {
    if (effects.shards) next = { ...next, cosmosShards: Math.max(0, next.cosmosShards + effects.shards) }
    if (effects.stardust) next = { ...next, stardust: Math.max(0, next.stardust + effects.stardust) }
    if (effects.recruit) next = recruit(next, effects.recruit)
  }
  return {
    ok: true,
    progression: next,
    outcome: choice.outcome ?? '',
    state: {
      ...state,
      nodeId: destination.id,
      visited: state.visited.includes(destination.id) ? state.visited : [...state.visited, destination.id],
      flags: [...new Set([...state.flags, ...(effects.flags ?? [])])],
      history: [...state.history, { nodeId: node.id, choiceId: choice.id }],
      pending: null,
      rewarded: state.rewarded.includes(key) || (!effects.shards && !effects.stardust && !effects.recruit) ? state.rewarded : [...state.rewarded, key],
      completed: destination.kind === 'ending',
    },
  }
}

export function chooseOption(chapter: Chapter, state: CampaignState, progression: ProgressionState, choiceId: string): CampaignResult {
  if (state.completed) return { ok: false, error: 'Le chapitre est terminé.' }
  if (state.pending) return { ok: false, error: 'Un combat t’attend avant de continuer.' }
  const node = getNode(chapter, state.nodeId)
  const choice = node?.choices.find((entry) => entry.id === choiceId)
  if (!node || !choice) return { ok: false, error: 'Choix indisponible.' }
  const locked = lockReason(choice.requires, state, progression)
  if (locked) return { ok: false, error: locked }
  if (choice.combat) {
    return { ok: true, progression, outcome: '', encounter: choice.combat, state: { ...state, pending: { nodeId: node.id, choiceId: choice.id } } }
  }
  return resolve(chapter, state, progression, node, choice)
}

/** Victory resolves the pending choice; defeat cancels it so the player can choose again. */
export function resolveEncounter(chapter: Chapter, state: CampaignState, progression: ProgressionState, victory: boolean): CampaignResult {
  if (!state.pending) return { ok: false, error: 'Aucun combat en attente.' }
  const node = getNode(chapter, state.pending.nodeId)
  const choice = node?.choices.find((entry) => entry.id === state.pending?.choiceId)
  if (!node || !choice) return { ok: false, error: 'Combat inconnu.' }
  if (!victory) return { ok: true, progression, outcome: 'Tu te replies pour reprendre des forces. Choisis ta prochaine action.', state: { ...state, pending: null } }
  return resolve(chapter, state, progression, node, choice)
}

export function pendingEncounter(chapter: Chapter, state: CampaignState): string | undefined {
  if (!state.pending) return undefined
  return getNode(chapter, state.pending.nodeId)?.choices.find((choice) => choice.id === state.pending?.choiceId)?.combat
}

/** Lists structural problems: unknown destinations, encounters, unreachable nodes or dead ends. */
export function validateChapter(chapter: Chapter, encounterIds: string[]): string[] {
  const errors: string[] = []
  const ids = new Set(chapter.nodes.map((node) => node.id))
  if (ids.size !== chapter.nodes.length) errors.push('Duplicate node id.')
  if (!ids.has(chapter.start)) errors.push('Unknown start node.')
  for (const node of chapter.nodes) {
    if (node.x < 0 || node.y < 0 || node.x >= chapter.width || node.y >= chapter.height) errors.push(`${node.id} is outside the board.`)
    if (node.kind !== 'ending' && node.choices.length === 0) errors.push(`${node.id} is a dead end.`)
    for (const choice of node.choices) {
      if (!ids.has(choice.goTo)) errors.push(`${node.id}:${choice.id} goes to unknown ${choice.goTo}.`)
      if (choice.combat && !encounterIds.includes(choice.combat)) errors.push(`${node.id}:${choice.id} uses unknown encounter ${choice.combat}.`)
    }
    if (node.choices.length > 0 && node.choices.every((choice) => choice.requires)) errors.push(`${node.id} may lock every choice.`)
  }
  const seen = new Set([chapter.start])
  const queue = [chapter.start]
  while (queue.length > 0) {
    for (const choice of getNode(chapter, queue.shift()!)?.choices ?? []) {
      if (!seen.has(choice.goTo)) { seen.add(choice.goTo); queue.push(choice.goTo) }
    }
  }
  for (const id of ids) if (!seen.has(id)) errors.push(`${id} is unreachable.`)
  return errors
}

const isStringList = (value: unknown): value is string[] => Array.isArray(value) && value.every((entry) => typeof entry === 'string')

export function parseCampaign(value: unknown, chapter: Chapter): CampaignState | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<CampaignState>
  if (candidate.version !== 1 || candidate.chapterId !== chapter.id || typeof candidate.nodeId !== 'string' || !getNode(chapter, candidate.nodeId)) return null
  if (!isStringList(candidate.visited) || !isStringList(candidate.flags) || !isStringList(candidate.rewarded) || !Array.isArray(candidate.history)) return null
  const pending = candidate.pending
  const validPending = pending === null || (typeof pending === 'object' && pending !== undefined && getNode(chapter, pending.nodeId)?.choices.some((choice) => choice.id === pending.choiceId && choice.combat))
  if (!validPending) return null
  return {
    version: 1,
    chapterId: chapter.id,
    nodeId: candidate.nodeId,
    visited: [...new Set(candidate.visited)],
    flags: [...new Set(candidate.flags)],
    history: candidate.history.filter((entry): entry is CampaignState['history'][number] => Boolean(entry) && typeof entry.nodeId === 'string' && typeof entry.choiceId === 'string'),
    pending: pending ? { nodeId: pending.nodeId, choiceId: pending.choiceId } : null,
    rewarded: [...new Set(candidate.rewarded)],
    completed: getNode(chapter, candidate.nodeId)?.kind === 'ending',
  }
}

export function loadCampaign(storage: StorageLike, chapter: Chapter): CampaignState {
  try {
    const raw = storage.getItem(CAMPAIGN_KEY)
    return (raw && parseCampaign(JSON.parse(raw), chapter)) || createCampaign(chapter)
  } catch {
    return createCampaign(chapter)
  }
}

export function saveCampaign(storage: StorageLike, state: CampaignState): void {
  storage.setItem(CAMPAIGN_KEY, JSON.stringify(state))
}

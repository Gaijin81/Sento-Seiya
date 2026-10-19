import { getKnightDefinition, KNIGHT_CATALOG, type KnightDefinition } from './knights'
import { createKnightProgress, MAX_SQUAD_SIZE, type ProgressionState } from './progression'

export type ProgressionResult =
  | { ok: true; progression: ProgressionState }
  | { ok: false; error: string; progression: ProgressionState }

export type RecruitStatus = 'owned' | 'locked' | 'insufficient' | 'available'

export function getRecruitStatus(progression: ProgressionState, definition: KnightDefinition): RecruitStatus {
  if (progression.knights.some((knight) => knight.id === definition.id)) return 'owned'
  if (progression.victories < definition.requiredVictories) return 'locked'
  if (progression.cosmosShards < definition.recruitCost) return 'insufficient'
  return 'available'
}

export function getRecruitableKnights(progression: ProgressionState): KnightDefinition[] {
  return KNIGHT_CATALOG.filter((definition) => getRecruitStatus(progression, definition) !== 'owned')
}

/** Spends Cosmos shards to add a knight at level 1; joins the squad if a slot is free. */
export function recruitKnight(progression: ProgressionState, knightId: string): ProgressionResult {
  const definition = getKnightDefinition(knightId)
  if (!definition) return { ok: false, error: 'Chevalier inconnu.', progression }
  const status = getRecruitStatus(progression, definition)
  if (status === 'owned') return { ok: false, error: `${definition.name} a déjà rejoint ton équipe.`, progression }
  if (status === 'locked') return { ok: false, error: `${definition.name} exige ${definition.requiredVictories} victoire(s).`, progression }
  if (status === 'insufficient') return { ok: false, error: `Il faut ${definition.recruitCost} éclats de Cosmos pour recruter ${definition.name}.`, progression }

  return {
    ok: true,
    progression: {
      ...progression,
      cosmosShards: progression.cosmosShards - definition.recruitCost,
      knights: [...progression.knights, createKnightProgress(definition.id)],
      squad: progression.squad.length < MAX_SQUAD_SIZE ? [...progression.squad, definition.id] : progression.squad,
    },
  }
}

/** Adds or removes an owned knight from the squad (between 1 and MAX_SQUAD_SIZE members). */
export function toggleSquadMember(progression: ProgressionState, knightId: string): ProgressionResult {
  const knight = progression.knights.find((entry) => entry.id === knightId)
  if (!knight) return { ok: false, error: 'Ce chevalier n’a pas encore été recruté.', progression }
  if (progression.squad.includes(knightId)) {
    if (progression.squad.length <= 1) return { ok: false, error: 'L’escouade doit compter au moins un chevalier.', progression }
    return { ok: true, progression: { ...progression, squad: progression.squad.filter((id) => id !== knightId) } }
  }
  if (progression.squad.length >= MAX_SQUAD_SIZE) {
    return { ok: false, error: `L’escouade est limitée à ${MAX_SQUAD_SIZE} chevaliers.`, progression }
  }
  return { ok: true, progression: { ...progression, squad: [...progression.squad, knightId] } }
}

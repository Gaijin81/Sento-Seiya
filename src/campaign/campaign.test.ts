import { describe, expect, it } from 'vitest'
import { createInitialProgression, type ProgressionState } from '../combat/progression'
import { createEncounterCombat } from '../combat/session'
import { equipItem } from '../combat/equipment'
import { CHAPTER_ONE } from './chapter1'
import { ENCOUNTERS } from './encounters'
import { campaignKey, chooseOption, createCampaign, listChoices, loadCampaign, parseCampaign, resolveEncounter, saveCampaign, validateChapter } from './engine'
import type { CampaignState } from './types'

function play(steps: (string | boolean)[], progression: ProgressionState = createInitialProgression(), start: CampaignState = createCampaign(CHAPTER_ONE)) {
  let state = start
  let current = progression
  for (const step of steps) {
    const result = typeof step === 'boolean' ? resolveEncounter(CHAPTER_ONE, state, current, step) : chooseOption(CHAPTER_ONE, state, current, step)
    if (!result.ok) throw new Error(result.error)
    state = result.state
    current = result.progression
  }
  return { state, progression: current }
}

describe('campaign chapter 1', () => {
  it('has a consistent board: known destinations and encounters, everything reachable, an ending', () => {
    expect(validateChapter(CHAPTER_ONE, Object.keys(ENCOUNTERS))).toEqual([])
    expect(CHAPTER_ONE.nodes.some((node) => node.kind === 'ending')).toBe(true)
    expect(CHAPTER_ONE.nodes.some((node) => node.kind === 'boss')).toBe(true)
  })

  it('places every encounter on the tactical board', () => {
    for (const encounter of Object.values(ENCOUNTERS)) {
      expect(() => createEncounterCombat(createInitialProgression(), encounter.enemies)).not.toThrow()
    }
  })

  it('moves along the chosen path and records flags', () => {
    const { state } = play(['saluer'])
    expect(state.nodeId).toBe('rivaux')
    expect(state.flags).toContain('courtois')
    expect(state.visited).toEqual(['arrivee', 'rivaux'])
  })

  it('locks choices whose conditions are not met and explains why', () => {
    const progression = { ...createInitialProgression(), squad: ['seiya'] }
    const { state } = play(['saluer'], progression)
    const shiryu = listChoices(CHAPTER_ONE, state, progression).find((view) => view.choice.id === 'shiryu')
    expect(shiryu?.locked).toMatch(/Shiryu/)
    expect(chooseOption(CHAPTER_ONE, state, progression, 'shiryu')).toMatchObject({ ok: false })
  })

  it('requires a combat victory before resolving a fight choice; defeat lets the player choose again', () => {
    const { state: atRivals, progression } = play(['saluer'])
    const fight = chooseOption(CHAPTER_ONE, atRivals, progression, 'duel')
    expect(fight.ok && fight.encounter).toBe('jabu-duel')
    if (!fight.ok) return
    expect(fight.state.nodeId).toBe('rivaux')
    expect(chooseOption(CHAPTER_ONE, fight.state, progression, 'ignorer').ok).toBe(false)
    const defeat = resolveEncounter(CHAPTER_ONE, fight.state, progression, false)
    expect(defeat.ok && defeat.state.pending).toBeNull()
    expect(defeat.ok && defeat.state.nodeId).toBe('rivaux')
    const victory = resolveEncounter(CHAPTER_ONE, fight.state, progression, true)
    expect(victory.ok && victory.state.nodeId).toBe('coffre')
    expect(victory.ok && victory.progression.knights.map((knight) => knight.id)).toContain('jabu')
  })

  it('unlocks alternative routes from earlier choices and reaches a peaceful ending', () => {
    const { state, progression } = play(['saluer', 'duel', true, 'laisser'])
    expect(state.nodeId).toBe('vol')
    const views = listChoices(CHAPTER_ONE, state, progression)
    expect(views.find((view) => view.choice.id === 'jabu')?.locked).toBeNull()
    expect(views.find((view) => view.choice.id === 'cosmos')?.locked).not.toBeNull()
    const end = play(['jabu', 'avancer', 'loyaute'], progression, state)
    expect(end.state.completed).toBe(true)
    expect(end.state.flags).toEqual(expect.arrayContaining(['honnete', 'paix']))
    expect(end.progression.cosmosShards).toBe(30)
    expect(chooseOption(CHAPTER_ONE, end.state, end.progression, 'affronter').ok).toBe(false)
  })

  it('grants rare loot from campaign choices, once, and lets it be equipped', () => {
    const chest = play(['saluer', 'duel', true, 'prendre'])
    expect(chest.progression.inventory).toEqual(['larme-etoile'])
    const peaceful = play(['saluer', 'duel', true, 'laisser', 'jabu', 'avancer', 'loyaute'])
    expect(peaceful.progression.inventory).toEqual(['eclat-or'])
    const replay = play(['saluer', 'duel', true, 'laisser', 'jabu', 'avancer', 'loyaute'], peaceful.progression, createCampaign(CHAPTER_ONE, peaceful.state.rewarded))
    expect(replay.progression.inventory).toEqual(['eclat-or'])
    const equipped = equipItem(replay.progression, 'seiya', 'eclat-or')
    expect(equipped.ok && equipped.progression.equipment.seiya).toEqual({ charm: 'eclat-or' })
    expect(validateChapter({ ...CHAPTER_ONE, nodes: CHAPTER_ONE.nodes.map((node) => node.id === 'coffre' ? { ...node, choices: node.choices.map((choice) => ({ ...choice, effects: { items: ['objet-fantome'] } })) } : node) }, Object.keys(ENCOUNTERS))).toContain('coffre:prendre grants unknown item objet-fantome.')
  })

  it('grants treasure rewards only once across replays', () => {
    const first = play(['saluer', 'ignorer', 'combattre', true, 'mediter', 'cosmos'])
    expect(first.progression.cosmosShards).toBe(20)
    const replay = play(['saluer', 'ignorer', 'combattre', true, 'mediter', 'cosmos'], first.progression, createCampaign(CHAPTER_ONE, first.state.rewarded))
    expect(replay.progression.cosmosShards).toBe(20)
    expect(replay.state.nodeId).toBe('souterrain')
  })

  it('saves and restores the campaign, rejecting corrupted saves', () => {
    const store = new Map<string, string>()
    const storage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value) } }
    const fight = chooseOption(CHAPTER_ONE, play(['arene']).state, createInitialProgression(), 'combattre')
    if (!fight.ok) throw new Error('fight')
    saveCampaign(storage, fight.state)
    expect(loadCampaign(storage, CHAPTER_ONE)).toEqual(fight.state)
    store.set(campaignKey(CHAPTER_ONE.id), JSON.stringify({ ...fight.state, nodeId: 'nowhere' }))
    expect(loadCampaign(storage, CHAPTER_ONE)).toEqual(createCampaign(CHAPTER_ONE))
    store.set(campaignKey(CHAPTER_ONE.id), '{oops')
    expect(loadCampaign(storage, CHAPTER_ONE).nodeId).toBe('arrivee')
    expect(parseCampaign({ ...fight.state, pending: { nodeId: 'arrivee', choiceId: 'saluer' } }, CHAPTER_ONE)).toBeNull()
  })
})

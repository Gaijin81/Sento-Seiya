import { describe, expect, it } from 'vitest'
import { createInitialProgression, type ProgressionState } from '../combat/progression'
import { CHAPTER_ONE } from './chapter1'
import { CHAPTER_TWO } from './chapter2'
import { CHAPTERS, isChapterUnlocked } from './chapters'
import { ENCOUNTERS } from './encounters'
import { CAMPAIGN_KEY, campaignKey, chooseOption, createCampaign, loadCampaign, resolveEncounter, saveCampaign, validateChapter } from './engine'
import type { CampaignState } from './types'

function play(steps: (string | boolean)[], progression: ProgressionState = createInitialProgression(), start: CampaignState = createCampaign(CHAPTER_TWO)) {
  let state = start
  let current = progression
  for (const step of steps) {
    const result = typeof step === 'boolean' ? resolveEncounter(CHAPTER_TWO, state, current, step) : chooseOption(CHAPTER_TWO, state, current, step)
    if (!result.ok) throw new Error(`${String(step)}: ${result.error}`)
    state = result.state
    current = result.progression
  }
  return { state, progression: current }
}

const memoryStorage = () => {
  const store = new Map<string, string>()
  return { store, getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value) } }
}

describe('campaign chapter 2', () => {
  it('is a valid chapter whose node ids do not clash with chapter 1', () => {
    expect(validateChapter(CHAPTER_TWO, Object.keys(ENCOUNTERS))).toEqual([])
    const ids = new Set(CHAPTER_ONE.nodes.map((node) => node.id))
    expect(CHAPTER_TWO.nodes.some((node) => ids.has(node.id))).toBe(false)
  })

  it('recruits Ikki without a fight on the peaceful path', () => {
    const { state, progression } = play(['fondation', 'carte', 'combattre', true, 'grotte', 'mediter', 'parler'])
    expect(state.completed && state.cleared).toBe(true)
    expect(state.flags).toContain('phenix-pardon')
    expect(progression.knights.some((knight) => knight.id === 'ikki')).toBe(true)
    expect(progression.cosmosShards).toBe(40)
  })

  it('rewards the boss fight with legendary loot and gates the paid passage', () => {
    const { state, progression } = play(['port', 'barque', 'combattre', true, 'volcan', 'combattre', true, 'affronter', true])
    expect(state.flags).toContain('phenix-vaincu')
    expect(progression.inventory).toContain('cendre-phenix')
    expect(progression.stardust).toBe(60)
    expect(() => play(['port', 'payer'])).toThrow('30 éclats')
    const rich = play(['port', 'payer'], { ...createInitialProgression(), cosmosShards: 50 })
    expect(rich.progression.cosmosShards).toBe(20)
    expect(rich.state.nodeId).toBe('c2-ile')
  })

  it('keeps the cleared status when replaying and unlocks the next chapter', () => {
    const { state } = play(['fondation', 'carte', 'combattre', true, 'grotte', 'mediter', 'parler'])
    const replay = createCampaign(CHAPTER_TWO, state.rewarded, state.cleared)
    expect(replay.cleared).toBe(true)
    expect(isChapterUnlocked(CHAPTERS[0].id, [])).toBe(true)
    expect(isChapterUnlocked(CHAPTER_TWO.id, [])).toBe(false)
    expect(isChapterUnlocked(CHAPTER_TWO.id, [CHAPTER_ONE.id])).toBe(true)
    expect(isChapterUnlocked('inconnu', [CHAPTER_ONE.id])).toBe(false)
  })

  it('saves each chapter separately and reads the legacy chapter 1 save', () => {
    const storage = memoryStorage()
    const legacy = { ...createCampaign(CHAPTER_ONE), nodeId: 'epilogue', completed: true }
    storage.store.set(CAMPAIGN_KEY, JSON.stringify(legacy))
    expect(loadCampaign(storage, CHAPTER_ONE).cleared).toBe(true)
    const second = play(['port']).state
    saveCampaign(storage, second)
    expect(storage.store.has(campaignKey(CHAPTER_TWO.id))).toBe(true)
    expect(loadCampaign(storage, CHAPTER_TWO).nodeId).toBe('c2-port')
    expect(loadCampaign(storage, CHAPTER_ONE).nodeId).toBe('epilogue')
  })
})

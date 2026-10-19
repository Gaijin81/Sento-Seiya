import { describe, expect, it } from 'vitest'
import { createInitialProgression, type ProgressionState } from '../combat/progression'
import { CHAPTER_ONE } from './chapter1'
import { CHAPTER_TWO } from './chapter2'
import { CHAPTER_THREE } from './chapter3'
import { CHAPTERS, isChapterUnlocked } from './chapters'
import { ENCOUNTERS } from './encounters'
import { chooseOption, createCampaign, resolveEncounter, validateChapter } from './engine'

function play(steps: (string | boolean)[], progression: ProgressionState = createInitialProgression()) {
  let state = createCampaign(CHAPTER_THREE)
  let current = progression
  for (const step of steps) {
    const result = typeof step === 'boolean' ? resolveEncounter(CHAPTER_THREE, state, current, step) : chooseOption(CHAPTER_THREE, state, current, step)
    if (!result.ok) throw new Error(`${String(step)}: ${result.error}`)
    state = result.state
    current = result.progression
  }
  return { state, progression: current }
}

describe('campaign chapter 3', () => {
  it('is a valid chapter unlocked after chapter 2, with unique node ids', () => {
    expect(validateChapter(CHAPTER_THREE, Object.keys(ENCOUNTERS))).toEqual([])
    const ids = new Set([...CHAPTER_ONE.nodes, ...CHAPTER_TWO.nodes].map((node) => node.id))
    expect(CHAPTER_THREE.nodes.some((node) => ids.has(node.id))).toBe(false)
    expect(CHAPTERS.map((chapter) => chapter.id)).toEqual([CHAPTER_ONE.id, CHAPTER_TWO.id, CHAPTER_THREE.id])
    expect(isChapterUnlocked(CHAPTER_THREE.id, [CHAPTER_ONE.id])).toBe(false)
    expect(isChapterUnlocked(CHAPTER_THREE.id, [CHAPTER_ONE.id, CHAPTER_TWO.id])).toBe(true)
  })

  it('reaches the gold guardian peacefully through the village path', () => {
    const { state, progression } = play(['route', 'aider', 'combattre', true, 'sentier', 'prier', 'monter', 'convaincre'])
    expect(state.completed && state.cleared).toBe(true)
    expect(state.flags).toEqual(expect.arrayContaining(['villageois', 'benediction', 'gardien-allie']))
    expect(progression.cosmosShards).toBe(60)
    expect(progression.inventory).toContain('poussiere-or')
  })

  it('rewards the fighting path and gates squad choices', () => {
    const { state, progression } = play(['col', 'descendre', 'prendre', 'combattre', true, 'monter', 'affronter', true])
    expect(state.flags).toContain('gardien-vaincu')
    expect(progression.inventory).toEqual(expect.arrayContaining(['casque-argent', 'poussiere-or']))
    expect(progression.stardust).toBe(75)
    expect(() => play(['flammes'])).toThrow()
    expect(() => play(['col', 'descendre', 'honorer', 'convaincre'])).toThrow()
  })
})

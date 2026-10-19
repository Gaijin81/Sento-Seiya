import { describe, expect, it } from 'vitest'
import { CHAPTER_ONE } from '../campaign/chapter1'
import { CHAPTER_TWO } from '../campaign/chapter2'
import { createCampaign } from '../campaign/engine'
import { createInitialProgression } from '../combat/progression'
import { buildCodex } from './entries'

const section = (sections: ReturnType<typeof buildCodex>, category: string) => sections.find((entry) => entry.category === category)!

describe('codex', () => {
  it('starts with only the starter knights, forgeable items and the first place known', () => {
    const codex = buildCodex(createInitialProgression(), [createCampaign(CHAPTER_ONE), createCampaign(CHAPTER_TWO)])
    expect(section(codex, 'knights').entries.filter((entry) => entry.discovered).map((entry) => entry.id)).toEqual(['seiya', 'shiryu', 'hyoga'])
    expect(section(codex, 'items').entries.filter((entry) => !entry.discovered).length).toBe(7)
    expect(section(codex, 'places').entries.filter((entry) => entry.discovered).map((entry) => entry.id)).toEqual(['arrivee', 'c2-depart'])
    expect(section(codex, 'foes').entries.every((entry) => !entry.discovered)).toBe(true)
    expect(section(codex, 'chronicles').entries.every((entry) => !entry.discovered)).toBe(true)
  })

  it('unlocks entries from recruits, exploration and loot', () => {
    const progression = { ...createInitialProgression(), knights: [...createInitialProgression().knights, { id: 'ikki', name: 'Ikki', level: 1, xp: 0, totalXp: 0 }], inventory: ['eclat-or'] }
    const chapter = { ...createCampaign(CHAPTER_ONE), visited: ['arrivee', 'rivaux', 'repaire'], flags: ['courtois'] }
    const codex = buildCodex(progression, [chapter])
    expect(section(codex, 'knights').entries.find((entry) => entry.id === 'ikki')?.discovered).toBe(true)
    expect(section(codex, 'items').entries.find((entry) => entry.id === 'eclat-or')?.discovered).toBe(true)
    const foes = section(codex, 'foes').entries.filter((entry) => entry.discovered).map((entry) => entry.title)
    expect(foes).toContain('Jabu de la Licorne')
    expect(foes).toContain('Chef des chevaliers noirs')
    expect(new Set(section(codex, 'foes').entries.map((entry) => entry.title)).size).toBe(section(codex, 'foes').entries.length)
    expect(section(codex, 'chronicles').entries[0]).toMatchObject({ discovered: true })
    expect(section(codex, 'chronicles').entries[0].text).toContain('courtois')
  })
})

import { describe, expect, it } from 'vitest'
import {
  awardVictoryXp,
  createInitialProgression,
  loadProgression,
  SAVE_KEY,
  SAVE_VERSION,
  saveProgression,
  xpRequiredForNextLevel,
} from './progression'

function memoryStorage(initial?: string) {
  const values = new Map<string, string>()
  if (initial !== undefined) values.set(SAVE_KEY, initial)
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
  }
}

describe('persistent knight progression', () => {
  it('starts with the three known knights at level one', () => {
    const progression = createInitialProgression()
    expect(progression.version).toBe(SAVE_VERSION)
    expect(progression.knights.map((knight) => [knight.id, knight.level, knight.xp])).toEqual([
      ['seiya', 1, 0],
      ['shiryu', 1, 0],
      ['hyoga', 1, 0],
    ])
    expect(xpRequiredForNextLevel(1)).toBe(100)
    expect(xpRequiredForNextLevel(3)).toBe(300)
  })

  it('awards 50 XP to each knight and the player only for a player victory', () => {
    const initial = createInitialProgression()
    const won = awardVictoryXp(initial, 'combat-1', { status: 'victory', winner: 'player' })
    expect(won.playerXp).toBe(50)
    expect(won.victories).toBe(1)
    expect(won.knights.every((knight) => knight.xp === 50 && knight.totalXp === 50)).toBe(true)
    expect(won.claimedCombatIds).toEqual(['combat-1'])
  })

  it('does not award XP for defeat, an ongoing battle, or an invalid winner', () => {
    const initial = createInitialProgression()
    expect(awardVictoryXp(initial, 'lost', { status: 'defeat', winner: 'enemy' })).toBe(initial)
    expect(awardVictoryXp(initial, 'ongoing', { status: 'ongoing', winner: null })).toBe(initial)
    expect(awardVictoryXp(initial, 'wrong-winner', { status: 'victory', winner: 'enemy' })).toBe(initial)
  })

  it('claims each combat reward only once', () => {
    const first = awardVictoryXp(createInitialProgression(), 'combat-1', { status: 'victory', winner: 'player' })
    const duplicate = awardVictoryXp(first, 'combat-1', { status: 'victory', winner: 'player' })
    expect(duplicate).toBe(first)
    expect(duplicate.playerXp).toBe(50)
    expect(duplicate.victories).toBe(1)
  })

  it('levels up and carries overflow XP forward', () => {
    const initial = createInitialProgression()
    const nearLevel = {
      ...initial,
      knights: initial.knights.map((knight) => ({ ...knight, xp: 75, totalXp: 75 })),
    }
    const awarded = awardVictoryXp(nearLevel, 'combat-level-up', { status: 'victory', winner: 'player' })
    expect(awarded.knights.every((knight) => knight.level === 2 && knight.xp === 25 && knight.totalXp === 125)).toBe(true)
  })

  it('persists and restores progression after a reload', () => {
    const storage = memoryStorage()
    const won = awardVictoryXp(createInitialProgression(), 'combat-save', { status: 'victory', winner: 'player' })
    saveProgression(storage, won)
    const restored = loadProgression(storage)
    expect(restored).toEqual(won)
  })

  it('recovers safely from malformed, unsupported, or unreadable saves', () => {
    expect(loadProgression(memoryStorage('{not-json')).playerXp).toBe(0)
    expect(loadProgression(memoryStorage(JSON.stringify({ version: 999 }))).knights).toHaveLength(3)
    const brokenStorage = { getItem: () => { throw new Error('blocked') }, setItem: () => undefined }
    expect(loadProgression(brokenStorage).victories).toBe(0)
  })
})

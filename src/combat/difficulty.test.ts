import { describe, expect, it } from 'vitest'
import { applyDifficulty, DIFFICULTY_KEY, loadDifficulty, parseDifficulty, saveDifficulty } from './difficulty'
import { createInitialProgression } from './progression'
import { createEncounterCombat, DEMO_ENEMIES } from './session'

describe('difficulty', () => {
  it('scales only the enemies', () => {
    const guard = DEMO_ENEMIES.find((unit) => unit.id === 'sanctuary-guard')!
    const hard = applyDifficulty(DEMO_ENEMIES, 'hard').find((unit) => unit.id === guard.id)!
    expect(hard).toMatchObject({ maxHp: Math.round(guard.maxHp * 1.25), hp: Math.round(guard.hp * 1.25), attack: guard.attack + 2, defense: guard.defense + 1 })
    const easy = applyDifficulty(DEMO_ENEMIES, 'easy').find((unit) => unit.id === guard.id)!
    expect(easy).toMatchObject({ maxHp: Math.round(guard.maxHp * 0.8), attack: guard.attack - 2, defense: guard.defense })
    expect(applyDifficulty(DEMO_ENEMIES, 'normal')).toBe(DEMO_ENEMIES)
    const combat = createEncounterCombat(createInitialProgression(), applyDifficulty(DEMO_ENEMIES, 'hard'))
    const normal = createEncounterCombat(createInitialProgression(), DEMO_ENEMIES)
    expect(combat.units.filter((unit) => unit.team === 'player')).toEqual(normal.units.filter((unit) => unit.team === 'player'))
  })

  it('keeps stats valid for weak units', () => {
    const [weak] = applyDifficulty([{ ...DEMO_ENEMIES[0], hp: 1, maxHp: 1, attack: 1 }], 'easy')
    expect(weak).toMatchObject({ hp: 1, maxHp: 1, attack: 1 })
  })

  it('saves the setting and falls back to normal', () => {
    const store = new Map<string, string>()
    const storage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value) } }
    expect(loadDifficulty(storage)).toBe('normal')
    saveDifficulty(storage, 'hard')
    expect(loadDifficulty(storage)).toBe('hard')
    store.set(DIFFICULTY_KEY, 'impossible')
    expect(loadDifficulty(storage)).toBe('normal')
    expect(parseDifficulty(undefined)).toBe('normal')
  })
})

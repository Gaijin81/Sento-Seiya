import { describe, expect, it } from 'vitest'
import { adaptiveGap, adaptToSquad, loadAdaptive, saveAdaptive } from './difficulty'
import { chooseAiAction, createCombat } from './engine'
import type { Board, UnitSetup } from './types'

const hero: UnitSetup = { id: 'hero', name: 'Héros', team: 'player', hp: 30, maxHp: 30, attack: 10, defense: 2, speed: 1, cosmos: 0, maxCosmos: 3, move: 3, range: 1, position: { x: 0, y: 0 } }
const foe: UnitSetup = { id: 'foe', name: 'Ennemi', team: 'enemy', hp: 30, maxHp: 30, attack: 6, defense: 2, speed: 9, cosmos: 0, maxCosmos: 2, move: 3, range: 1, position: { x: 2, y: 0 } }

describe('smart AI', () => {
  it('prefers to strike from cover', () => {
    const board: Board = { width: 5, height: 3, obstacles: [], terrain: [{ x: 0, y: 1, kind: 'cover' }] }
    expect(chooseAiAction(createCombat([hero, foe], board), 'foe')).toEqual({ type: 'move', to: { x: 0, y: 1 } })
  })

  it('climbs high ground to strike from farther away', () => {
    const board: Board = { width: 5, height: 3, obstacles: [], terrain: [{ x: 2, y: 2, kind: 'height' }] }
    const state = createCombat([{ ...hero, position: { x: 0, y: 1 } }, { ...foe, range: 2, position: { x: 4, y: 1 } }], board)
    expect(chooseAiAction(state, 'foe')).toEqual({ type: 'move', to: { x: 2, y: 2 } })
  })

  it('steps into adjacent cover before striking, but stays put when nothing is better', () => {
    const covered: Board = { width: 5, height: 3, obstacles: [], terrain: [{ x: 1, y: 1, kind: 'cover' }] }
    const near = [hero, { ...foe, position: { x: 1, y: 0 } }]
    expect(chooseAiAction(createCombat([{ ...hero, position: { x: 0, y: 1 } }, near[1]], covered), 'foe')).toEqual({ type: 'move', to: { x: 1, y: 1 } })
    expect(chooseAiAction(createCombat(near, { width: 5, height: 3, obstacles: [] }), 'foe')).toEqual({ type: 'attack', targetId: 'hero' })
  })
})

describe('progressive difficulty', () => {
  it('scales enemies with the squad level gap, capped at 5', () => {
    expect(adaptiveGap(3.7, 1)).toBe(2)
    expect(adaptiveGap(2, 3)).toBe(0)
    expect(adaptiveGap(20)).toBe(5)
    expect(adaptToSquad([foe], 1)).toEqual([foe])
    expect(adaptToSquad([foe], 4, 1)[0]).toMatchObject({ maxHp: 37, hp: 37, attack: 9, defense: 3 })
  })

  it('stores the setting, enabled by default', () => {
    const data = new Map<string, string>()
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) }
    expect(loadAdaptive(storage)).toBe(true)
    saveAdaptive(storage, false)
    expect(loadAdaptive(storage)).toBe(false)
  })
})

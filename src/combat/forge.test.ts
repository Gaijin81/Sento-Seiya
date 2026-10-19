import { describe, expect, it } from 'vitest'
import { applyEquipment, forgeItem, getItem, MAX_FORGE_LEVEL, upgradeCost, upgradedBonus, upgradeItem } from './equipment'
import { createInitialProgression, parseProgression, type ProgressionState } from './progression'
import type { UnitSetup } from './types'

const rich = (stardust = 1000): ProgressionState => ({ ...createInitialProgression(), stardust })
const ok = (result: ReturnType<typeof forgeItem>) => { if (!result.ok) throw new Error(result.error); return result.progression }

describe('armors and forge levels', () => {
  it('gates silver and gold armors behind cleared chapters', () => {
    expect(forgeItem(rich(), 'armure-argent')).toMatchObject({ ok: false, error: expect.stringMatching(/chapitre 2/) })
    expect(forgeItem(rich(), 'armure-or', ['ile-du-phenix'])).toMatchObject({ ok: false, error: expect.stringMatching(/chapitre 3/) })
    const gold = ok(forgeItem(rich(), 'armure-or', ['ile-du-phenix', 'marches-du-sanctuaire']))
    expect(gold.inventory).toContain('armure-or')
    expect(gold.stardust).toBe(750)
    expect(ok(forgeItem(rich(), 'armure-bronze-renforcee')).inventory).toContain('armure-bronze-renforcee')
  })

  it('upgrades owned items up to the max level with rising costs', () => {
    expect(upgradeItem(rich(), 'bracelet-bronze')).toMatchObject({ ok: false, error: expect.stringMatching(/ne possèdes pas/) })
    let state = ok(forgeItem(rich(), 'bracelet-bronze'))
    for (let level = 0; level < MAX_FORGE_LEVEL; level += 1) state = ok(upgradeItem(state, 'bracelet-bronze'))
    expect(state.upgrades?.['bracelet-bronze']).toBe(3)
    expect(state.stardust).toBe(1000 - 20 - upgradeCost(0) - upgradeCost(1) - upgradeCost(2))
    expect(upgradeItem(state, 'bracelet-bronze')).toMatchObject({ ok: false, error: expect.stringMatching(/maximum/) })
    expect(upgradeItem({ ...state, stardust: 0, upgrades: {} }, 'bracelet-bronze')).toMatchObject({ ok: false, error: expect.stringMatching(/25 poussières/) })
  })

  it('applies upgraded bonuses in combat and keeps move/range fixed', () => {
    expect(upgradedBonus(getItem('armure-argent')!, 2)).toEqual({ hp: 14, attack: 3, defense: 5 })
    expect(upgradedBonus(getItem('sandales-ailees')!, 3).move).toBe(getItem('sandales-ailees')!.bonus.move)
    expect(upgradedBonus(getItem('lentille-stellaire')!, 3)).toEqual(getItem('lentille-stellaire')!.bonus)
    const base = { id: 'seiya', name: 'Seiya', team: 'player', hp: 40, maxHp: 40, attack: 10, defense: 3, speed: 8, cosmos: 0, maxCosmos: 5 } as UnitSetup
    expect(applyEquipment(base, { armor: 'armure-or' }, { 'armure-or': 1 })).toMatchObject({ hp: 56, maxHp: 56, attack: 14, defense: 8, maxCosmos: 6 })
  })

  it('saves forge levels and drops invalid ones', () => {
    const state = { ...rich(), inventory: ['bracelet-bronze'], upgrades: { 'bracelet-bronze': 2, 'cape-sanctuaire': 1, inconnu: 9 } }
    expect(parseProgression(JSON.parse(JSON.stringify(state)))?.upgrades).toEqual({ 'bracelet-bronze': 2 })
    const { upgrades: _upgrades, ...legacy } = state
    expect(parseProgression(JSON.parse(JSON.stringify(legacy)))?.upgrades ?? {}).toEqual({})
  })
})

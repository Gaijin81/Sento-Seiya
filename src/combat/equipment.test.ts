import { describe, expect, it } from 'vitest'
import { EQUIPMENT_CATALOG, applyEquipment, availableCount, bonusLabel, equipItem, forgeItem, grantItems, isForgeable, unequipItem } from './equipment'
import { createKnightUnit, getKnightDefinition } from './knights'
import { awardVictoryXp, createInitialProgression, parseProgression, SAVE_VERSION, VICTORY_STARDUST, type ProgressionState } from './progression'
import { createSquadUnits } from './session'

const rich = (): ProgressionState => ({ ...createInitialProgression(), stardust: 100 })
function ok(result: { ok: boolean; progression: ProgressionState; error?: string }): ProgressionState {
  if (!result.ok) throw new Error(result.error)
  return result.progression
}

describe('rare items', () => {
  it('cannot be forged and are only granted', () => {
    const rich = { ...createInitialProgression(), stardust: 999 }
    const forged = forgeItem(rich, 'fragment-argent')
    expect(forged.ok).toBe(false)
    expect(!forged.ok && forged.error).toContain('se trouve en campagne')
    expect(EQUIPMENT_CATALOG.filter((item) => !isForgeable(item)).map((item) => item.rarity)).toEqual(['rare', 'rare', 'legendary', 'rare', 'legendary'])
    expect(grantItems(rich, ['fragment-argent', 'inconnu']).inventory).toEqual(['fragment-argent'])
  })
})

describe('equipment', () => {
  it('starts with no stardust, items or loadouts', () => {
    expect(createInitialProgression()).toMatchObject({ version: SAVE_VERSION, stardust: 0, inventory: [], equipment: {} })
  })

  it('forges items with stardust, several copies allowed', () => {
    const forged = ok(forgeItem(ok(forgeItem(rich(), 'bracelet-bronze')), 'bracelet-bronze'))
    expect(forged.stardust).toBe(60)
    expect(forged.inventory).toEqual(['bracelet-bronze', 'bracelet-bronze'])
    expect(forgeItem(createInitialProgression(), 'bracelet-bronze')).toMatchObject({ ok: false, error: expect.stringMatching(/20 poussières/) })
    expect(forgeItem(rich(), 'excalibur').ok).toBe(false)
  })

  it('equips one copy per knight, swaps slots and frees copies', () => {
    let state = ok(forgeItem(ok(forgeItem(rich(), 'bracelet-bronze')), 'cape-sanctuaire'))
    state = ok(equipItem(state, 'seiya', 'bracelet-bronze'))
    expect(availableCount(state, 'bracelet-bronze')).toBe(0)
    expect(equipItem(state, 'shiryu', 'bracelet-bronze')).toMatchObject({ ok: false, error: expect.stringMatching(/Aucun exemplaire/) })
    expect(equipItem(state, 'seiya', 'bracelet-bronze').ok).toBe(false)
    expect(equipItem(state, 'ikki', 'cape-sanctuaire')).toMatchObject({ ok: false })
    state = ok(equipItem(state, 'seiya', 'cape-sanctuaire'))
    expect(state.equipment.seiya).toEqual({ relic: 'cape-sanctuaire' })
    expect(availableCount(state, 'bracelet-bronze')).toBe(1)
    state = ok(unequipItem(state, 'seiya', 'relic'))
    expect(state.equipment.seiya).toEqual({})
    expect(unequipItem(state, 'seiya', 'relic').ok).toBe(false)
  })

  it('adds item bonuses to combat units', () => {
    const base = createKnightUnit(getKnightDefinition('hyoga')!, 1)
    const geared = applyEquipment(base, { relic: 'lentille-stellaire', charm: 'sandales-ailees' })
    expect(geared.technique?.range).toBe((base.technique?.range ?? 1) + 1)
    expect(geared.move).toBe((base.move ?? 3) + 1)
    expect(geared.speed).toBe(base.speed + 1)
    expect(applyEquipment(base, { charm: 'plume-phenix' })).toMatchObject({ hp: base.hp + 8, maxHp: base.maxHp + 8 })
    expect(applyEquipment(base, undefined)).toBe(base)
    expect(bonusLabel({ attack: 2, hp: 8 })).toBe('+8 PV · +2 ATQ')
  })

  it('applies the squad loadouts when a combat starts', () => {
    const state = ok(equipItem(ok(forgeItem(rich(), 'bracelet-bronze')), 'seiya', 'bracelet-bronze'))
    const seiya = createSquadUnits(state).find((unit) => unit.id === 'seiya')!
    expect(seiya.attack).toBe(createKnightUnit(getKnightDefinition('seiya')!, 1).attack + 2)
  })

  it('earns stardust on victory', () => {
    const won = awardVictoryXp(createInitialProgression(), 'fight-1', { status: 'victory', winner: 'player' })
    expect(won.stardust).toBe(VICTORY_STARDUST)
  })

  it('migrates v2 saves and drops invalid loadouts in v3 saves', () => {
    const { stardust: _s, inventory: _i, equipment: _e, ...rest } = createInitialProgression()
    expect(parseProgression({ ...rest, version: 2, cosmosShards: 45 })).toMatchObject({ version: SAVE_VERSION, cosmosShards: 45, stardust: 0, inventory: [], equipment: {} })
    const parsed = parseProgression({
      ...createInitialProgression(),
      stardust: 5,
      inventory: ['bracelet-bronze', 'unknown-item'],
      equipment: { seiya: { relic: 'bracelet-bronze' }, shiryu: { relic: 'bracelet-bronze' }, hyoga: { charm: 'bracelet-bronze' }, ikki: { relic: 'bracelet-bronze' } },
    })
    expect(parsed).toMatchObject({ stardust: 5, inventory: ['bracelet-bronze'], equipment: { seiya: { relic: 'bracelet-bronze' } } })
    expect(Object.keys(parsed!.equipment)).toEqual(['seiya'])
    expect(parseProgression({ ...createInitialProgression(), stardust: -1 })).toBeNull()
  })
})

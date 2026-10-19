import { describe, expect, it } from 'vitest'
import { createKnightUnit, getKnightDefinition, KNIGHT_CATALOG, knightStatsAtLevel } from './knights'
import {
  awardVictoryXp,
  createInitialProgression,
  loadProgression,
  MAX_SQUAD_SIZE,
  SAVE_KEY,
  saveProgression,
  VICTORY_SHARDS,
  type ProgressionState,
} from './progression'
import { getRecruitableKnights, getRecruitStatus, recruitKnight, toggleSquadMember } from './recruitment'
import { createSquadCombat, playActionAndResolveAi } from './session'

const win = { status: 'victory', winner: 'player' } as const

function withShards(shards: number, victories = 0): ProgressionState {
  return { ...createInitialProgression(), cosmosShards: shards, victories }
}

function memoryStorage(initial?: string) {
  const values = new Map<string, string>()
  if (initial !== undefined) values.set(SAVE_KEY, initial)
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
  }
}

describe('knight catalog', () => {
  it('keeps unique ids and the three starters free', () => {
    expect(new Set(KNIGHT_CATALOG.map((knight) => knight.id)).size).toBe(KNIGHT_CATALOG.length)
    expect(KNIGHT_CATALOG.filter((knight) => knight.starter).map((knight) => [knight.id, knight.recruitCost])).toEqual([
      ['seiya', 0], ['shiryu', 0], ['hyoga', 0],
    ])
  })

  it('scales stats with level', () => {
    const seiya = getKnightDefinition('seiya')!
    expect(knightStatsAtLevel(seiya, 1)).toEqual(seiya.base)
    expect(knightStatsAtLevel(seiya, 3)).toMatchObject({ hp: 50, attack: 12, defense: 4, speed: 12 })
    const unit = createKnightUnit(seiya, 2)
    expect(unit).toMatchObject({ team: 'player', hp: 46, maxHp: 46, attack: 11 })
  })
})

describe('recruitment', () => {
  it('lists every non-owned knight as recruitable with its status', () => {
    const progression = withShards(30)
    expect(getRecruitableKnights(progression).map((knight) => knight.id)).toEqual(['jabu', 'shun', 'ikki'])
    expect(getRecruitStatus(progression, getKnightDefinition('jabu')!)).toBe('available')
    expect(getRecruitStatus(progression, getKnightDefinition('shun')!)).toBe('locked')
    expect(getRecruitStatus(withShards(0, 1), getKnightDefinition('shun')!)).toBe('insufficient')
  })

  it('spends shards and adds the knight at level 1 without exceeding the squad limit', () => {
    const result = recruitKnight(withShards(45), 'jabu')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.progression.cosmosShards).toBe(15)
    expect(result.progression.knights.find((knight) => knight.id === 'jabu')).toMatchObject({ level: 1, xp: 0 })
    expect(result.progression.squad).toHaveLength(MAX_SQUAD_SIZE)
    expect(result.progression.squad).not.toContain('jabu')
  })

  it('joins the squad automatically when a slot is free', () => {
    const base = withShards(30)
    const result = recruitKnight({ ...base, squad: ['seiya'] }, 'jabu')
    expect(result.ok && result.progression.squad).toEqual(['seiya', 'jabu'])
  })

  it('rejects locked, unaffordable, unknown or already owned knights without changes', () => {
    const poor = withShards(10)
    for (const [progression, id] of [[poor, 'jabu'], [withShards(500), 'shun'], [poor, 'unknown'], [poor, 'seiya']] as const) {
      const result = recruitKnight(progression, id)
      expect(result.ok).toBe(false)
      expect(result.progression).toBe(progression)
    }
  })
})

describe('squad composition', () => {
  it('limits the squad to three members and keeps at least one', () => {
    const recruited = recruitKnight(withShards(30), 'jabu')
    if (!recruited.ok) throw new Error('recruit failed')
    const full = toggleSquadMember(recruited.progression, 'jabu')
    expect(full.ok).toBe(false)

    const removed = toggleSquadMember(recruited.progression, 'hyoga')
    expect(removed.ok && removed.progression.squad).toEqual(['seiya', 'shiryu'])
    if (!removed.ok) return
    const added = toggleSquadMember(removed.progression, 'jabu')
    expect(added.ok && added.progression.squad).toEqual(['seiya', 'shiryu', 'jabu'])

    const solo = { ...createInitialProgression(), squad: ['seiya'] }
    expect(toggleSquadMember(solo, 'seiya').ok).toBe(false)
    expect(toggleSquadMember(solo, 'ikki').ok).toBe(false)
  })

  it('prepares a combat with the squad at its current level', () => {
    const progression: ProgressionState = {
      ...createInitialProgression(),
      squad: ['shiryu', 'seiya'],
      knights: createInitialProgression().knights.map((knight) => knight.id === 'shiryu' ? { ...knight, level: 3 } : knight),
    }
    const combat = createSquadCombat(progression)
    const allies = combat.units.filter((unit) => unit.team === 'player')
    expect(allies.map((unit) => unit.id)).toEqual(['shiryu', 'seiya'])
    expect(allies[0]).toMatchObject({ maxHp: 56, attack: 10, defense: 6 })
    expect(combat.units.filter((unit) => unit.team === 'enemy')).toHaveLength(2)
    expect(allies.map((unit) => unit.position)).toEqual([{ x: 0, y: 2 }, { x: 0, y: 1 }])
    expect(playActionAndResolveAi(combat, 'seiya', { type: 'wait' }).ok).toBe(true)
  })

  it('rewards only the knights that fought, plus Cosmos shards', () => {
    const progression = { ...createInitialProgression(), squad: ['seiya', 'hyoga'] }
    const rewarded = awardVictoryXp(progression, 'squad-win', win)
    expect(rewarded.cosmosShards).toBe(VICTORY_SHARDS)
    expect(rewarded.knights.map((knight) => [knight.id, knight.xp])).toEqual([['seiya', 50], ['shiryu', 0], ['hyoga', 50]])
  })
})

describe('save migration and persistence', () => {
  it('migrates a v1 save, keeping progress and granting shards for past victories', () => {
    const v1 = {
      version: 1,
      playerXp: 150,
      victories: 3,
      claimedCombatIds: ['a', 'b', 'c', 'c'],
      knights: [
        { id: 'seiya', name: 'Seiya', level: 2, xp: 50, totalXp: 150 },
        { id: 'shiryu', name: 'Shiryu', level: 2, xp: 50, totalXp: 150 },
        { id: 'hyoga', name: 'Hyoga', level: 2, xp: 50, totalXp: 150 },
      ],
    }
    const migrated = loadProgression(memoryStorage(JSON.stringify(v1)))
    expect(migrated).toMatchObject({ version: 3, stardust: 0, inventory: [], equipment: {}, playerXp: 150, victories: 3, cosmosShards: 3 * VICTORY_SHARDS, squad: ['seiya', 'shiryu', 'hyoga'] })
    expect(migrated.claimedCombatIds).toEqual(['a', 'b', 'c'])
    expect(migrated.knights.every((knight) => knight.level === 2)).toBe(true)
  })

  it('restores recruits and squad after a reload and sanitizes invalid squads', () => {
    const storage = memoryStorage()
    const recruited = recruitKnight({ ...withShards(30), squad: ['seiya'] }, 'jabu')
    if (!recruited.ok) throw new Error('recruit failed')
    saveProgression(storage, recruited.progression)
    expect(loadProgression(storage)).toEqual(recruited.progression)

    const tampered = { ...createInitialProgression(), squad: ['ikki', 'seiya', 'seiya', 'unknown'] }
    expect(loadProgression(memoryStorage(JSON.stringify(tampered))).squad).toEqual(['seiya'])
    const empty = { ...createInitialProgression(), squad: [] }
    expect(loadProgression(memoryStorage(JSON.stringify(empty))).squad).toEqual(['seiya', 'shiryu', 'hyoga'])
    const negative = { ...createInitialProgression(), cosmosShards: -5 }
    expect(loadProgression(memoryStorage(JSON.stringify(negative))).cosmosShards).toBe(0)
  })
})

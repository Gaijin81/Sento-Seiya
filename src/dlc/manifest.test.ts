import { afterEach, describe, expect, it } from 'vitest'
import { allItems, EQUIPMENT_CATALOG, forgeItem, getItem, setExtraItems } from '../combat/equipment'
import { createInitialProgression, parseProgression } from '../combat/progression'
import { EXAMPLE_PACK } from './examplePack'
import { activatePacks, DLC_KEY, installPack, loadInstalledPacks, saveInstalledPacks, uninstallPack, validatePack } from './manifest'

const memory = () => {
  const store = new Map<string, string>()
  return { store, getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value) } }
}

afterEach(() => setExtraItems([]))

describe('content packs', () => {
  it('accepts the example pack', () => {
    const result = validatePack(EXAMPLE_PACK)
    expect(result.ok).toBe(true)
    expect(result.ok && result.pack.items.map((item) => item.id)).toEqual(['anneau-de-givre', 'rune-boreale'])
  })

  it('rejects malformed manifests with readable errors', () => {
    const result = validatePack({
      format: 2, id: 'X', name: '', version: '1',
      items: [
        { id: 'bracelet-bronze', name: 'Copie', slot: 'relic', cost: 10, bonus: { attack: 1 } },
        { id: 'trop-fort', name: 'Trop fort', slot: 'casque', cost: 0, bonus: { attack: 9, magic: 1 } },
      ],
      music: { battle: 'javascript:alert(1)', boss: '/boss.ogg' },
    })
    expect(result.ok).toBe(false)
    const errors = result.ok ? [] : result.errors.join('\n')
    for (const fragment of ['Format', 'Identifiant', 'Nom', 'Version', 'existe déjà', 'emplacement', 'coût', '« attack »', 'bonus inconnu', 'Musique « battle »', 'Thème musical inconnu']) expect(errors).toContain(fragment)
    expect(validatePack([]).ok).toBe(false)
    expect(validatePack({ ...EXAMPLE_PACK, items: Array.from({ length: 13 }, (_, i) => ({ ...EXAMPLE_PACK.items[0], id: `objet-${i}` })) }).ok).toBe(false)
  })

  it('accepts https and same-site audio files only', () => {
    expect(validatePack({ ...EXAMPLE_PACK, music: { battle: 'https://exemple.com/combat.ogg', menu: '/audio/menu.mp3' } }).ok).toBe(true)
    expect(validatePack({ ...EXAMPLE_PACK, music: { menu: 'http://exemple.com/menu.mp3' } }).ok).toBe(false)
    expect(validatePack({ ...EXAMPLE_PACK, music: { menu: 'https://exemple.com/menu.exe' } }).ok).toBe(false)
  })

  it('installs, updates and uninstalls packs without item id clashes', () => {
    const first = installPack([], EXAMPLE_PACK)
    if (!first.ok) throw new Error(first.errors.join())
    const updated = installPack(first.packs, { ...EXAMPLE_PACK, version: '1.1.0' })
    expect(updated.ok && updated.packs).toHaveLength(1)
    expect(updated.ok && updated.packs[0].version).toBe('1.1.0')
    expect(installPack(first.packs, { ...EXAMPLE_PACK, id: 'autre-pack' })).toMatchObject({ ok: false })
    expect(uninstallPack(first.packs, EXAMPLE_PACK.id)).toEqual([])
  })

  it('makes pack items forgeable and drops them from saves once uninstalled', () => {
    const installed = installPack([], { ...EXAMPLE_PACK, music: { battle: '/combat.ogg' } })
    if (!installed.ok) throw new Error('install')
    expect(activatePacks(installed.packs)).toEqual({ battle: '/combat.ogg' })
    expect(allItems()).toHaveLength(EQUIPMENT_CATALOG.length + 2)
    const forged = forgeItem({ ...createInitialProgression(), stardust: 30 }, 'anneau-de-givre')
    expect(forged.ok && forged.progression.inventory).toEqual(['anneau-de-givre'])
    activatePacks([])
    expect(getItem('anneau-de-givre')).toBeUndefined()
    expect(parseProgression(forged.progression)?.inventory).toEqual([])
  })

  it('persists installed packs and ignores corrupted storage', () => {
    const storage = memory()
    const installed = installPack([], EXAMPLE_PACK)
    if (!installed.ok) throw new Error('install')
    saveInstalledPacks(storage, installed.packs)
    expect(loadInstalledPacks(storage)).toEqual(installed.packs)
    storage.store.set(DLC_KEY, JSON.stringify([{ ...EXAMPLE_PACK, version: 'x' }, EXAMPLE_PACK]))
    expect(loadInstalledPacks(storage).map((pack) => pack.version)).toEqual(['1.0.0'])
    storage.store.set(DLC_KEY, '{oops')
    expect(loadInstalledPacks(storage)).toEqual([])
  })
})

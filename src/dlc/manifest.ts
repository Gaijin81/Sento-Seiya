import { THEMES, type Theme } from '../audio/engine'
import { EQUIPMENT_CATALOG, EQUIPMENT_SLOTS, setExtraItems, type EquipmentItem, type ItemBonus } from '../combat/equipment'
import type { StorageLike } from '../combat/progression'

export const PACK_FORMAT = 1
export const DLC_KEY = 'sento-seiya-dlc'
export const MAX_PACK_ITEMS = 12

export type ContentPack = {
  format: typeof PACK_FORMAT
  id: string
  name: string
  version: string
  author?: string
  description?: string
  items: EquipmentItem[]
  music: Partial<Record<Theme, string>>
}

export type PackValidation = { ok: true; pack: ContentPack } | { ok: false; errors: string[] }

const BONUS_LIMITS: Record<keyof ItemBonus, number> = { hp: 20, attack: 3, defense: 3, speed: 3, maxCosmos: 2, move: 1, techniqueRange: 1 }
const ID = /^[a-z0-9][a-z0-9-]{2,39}$/
const AUDIO_URL = /^(https:\/\/|\/)[^\s"'<>]+\.(mp3|ogg|wav|m4a)$/i
const text = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.length <= max
const optionalText = (value: unknown, max: number) => value === undefined || text(value, max)

/** Packs are pure data: no code is ever executed, audio is only referenced by https or same-site URLs. */
export function validatePack(raw: unknown, reservedItemIds: string[] = EQUIPMENT_CATALOG.map((item) => item.id)): PackValidation {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, errors: ['Le pack doit être un objet JSON.'] }
  const pack = raw as Record<string, unknown>
  const errors: string[] = []
  if (pack.format !== PACK_FORMAT) errors.push(`Format non pris en charge (attendu : ${PACK_FORMAT}).`)
  if (typeof pack.id !== 'string' || !ID.test(pack.id)) errors.push('Identifiant invalide (3 à 40 caractères : minuscules, chiffres, tirets).')
  if (!text(pack.name, 60)) errors.push('Nom manquant ou trop long (60 caractères max).')
  if (typeof pack.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(pack.version)) errors.push('Version invalide (ex. 1.0.0).')
  if (!optionalText(pack.author, 60)) errors.push('Auteur invalide.')
  if (!optionalText(pack.description, 200)) errors.push('Description invalide (200 caractères max).')

  const items = pack.items ?? []
  if (!Array.isArray(items) || items.length > MAX_PACK_ITEMS) errors.push(`« items » doit être une liste de ${MAX_PACK_ITEMS} objets maximum.`)
  const seen = new Set(reservedItemIds)
  const validItems: EquipmentItem[] = []
  if (Array.isArray(items)) items.forEach((entry, index) => {
    const label = `Objet ${index + 1}`
    const item = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>
    const itemErrors: string[] = []
    if (typeof item.id !== 'string' || !ID.test(item.id)) itemErrors.push(`${label} : identifiant invalide.`)
    else if (seen.has(item.id)) itemErrors.push(`${label} : l’identifiant « ${item.id} » existe déjà.`)
    if (!text(item.name, 40)) itemErrors.push(`${label} : nom invalide.`)
    if (!optionalText(item.description, 120)) itemErrors.push(`${label} : description invalide.`)
    if (!EQUIPMENT_SLOTS.includes(item.slot as never)) itemErrors.push(`${label} : emplacement inconnu (${EQUIPMENT_SLOTS.join(' ou ')}).`)
    if (!Number.isInteger(item.cost) || (item.cost as number) < 1 || (item.cost as number) > 999) itemErrors.push(`${label} : coût entre 1 et 999.`)
    const bonus = (item.bonus && typeof item.bonus === 'object' ? item.bonus : null) as Record<string, unknown> | null
    const keys = bonus ? Object.keys(bonus) : []
    if (!bonus || keys.length === 0) itemErrors.push(`${label} : au moins un bonus est requis.`)
    keys.forEach((key) => {
      const limit = BONUS_LIMITS[key as keyof ItemBonus]
      const value = bonus![key]
      if (!limit) itemErrors.push(`${label} : bonus inconnu « ${key} ».`)
      else if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > limit) itemErrors.push(`${label} : « ${key} » doit être entre 1 et ${limit}.`)
    })
    errors.push(...itemErrors)
    if (itemErrors.length === 0) {
      seen.add(item.id as string)
      validItems.push({ id: item.id as string, name: item.name as string, slot: item.slot as EquipmentItem['slot'], cost: item.cost as number, description: (item.description as string | undefined) ?? '', bonus: { ...bonus } as ItemBonus })
    }
  })

  const music = pack.music ?? {}
  const validMusic: Partial<Record<Theme, string>> = {}
  if (!music || typeof music !== 'object' || Array.isArray(music)) errors.push('« music » doit associer un thème à une URL.')
  else Object.entries(music).forEach(([theme, url]) => {
    if (!THEMES.includes(theme as Theme)) errors.push(`Thème musical inconnu « ${theme} » (${THEMES.join(', ')}).`)
    else if (typeof url !== 'string' || !AUDIO_URL.test(url)) errors.push(`Musique « ${theme} » : URL https:// ou /chemin vers un fichier mp3, ogg, wav ou m4a.`)
    else validMusic[theme as Theme] = url
  })

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, pack: { format: PACK_FORMAT, id: pack.id as string, name: pack.name as string, version: pack.version as string, author: pack.author as string | undefined, description: pack.description as string | undefined, items: validItems, music: validMusic } }
}

const otherItemIds = (packs: ContentPack[], exceptId?: string) => [...EQUIPMENT_CATALOG.map((item) => item.id), ...packs.filter((pack) => pack.id !== exceptId).flatMap((pack) => pack.items.map((item) => item.id))]

/** Installs or updates (same id) a pack; item ids must not clash with the base game or other packs. */
export function installPack(packs: ContentPack[], raw: unknown): { ok: true; packs: ContentPack[]; pack: ContentPack } | { ok: false; errors: string[] } {
  const id = raw && typeof raw === 'object' ? (raw as { id?: unknown }).id : undefined
  const result = validatePack(raw, otherItemIds(packs, typeof id === 'string' ? id : undefined))
  if (!result.ok) return result
  return { ok: true, pack: result.pack, packs: [...packs.filter((pack) => pack.id !== result.pack.id), result.pack] }
}

export function uninstallPack(packs: ContentPack[], id: string): ContentPack[] {
  return packs.filter((pack) => pack.id !== id)
}

/** Makes the packs' items and music available to the game; returns the music overrides. */
export function activatePacks(packs: ContentPack[]): Partial<Record<Theme, string>> {
  setExtraItems(packs.flatMap((pack) => pack.items))
  return Object.assign({}, ...packs.map((pack) => pack.music))
}

export function loadInstalledPacks(storage: StorageLike): ContentPack[] {
  try {
    const raw = JSON.parse(storage.getItem(DLC_KEY) ?? '[]')
    if (!Array.isArray(raw)) return []
    return raw.reduce<ContentPack[]>((packs, entry) => {
      const result = installPack(packs, entry)
      return result.ok ? result.packs : packs
    }, [])
  } catch {
    return []
  }
}

export function saveInstalledPacks(storage: StorageLike, packs: ContentPack[]): void {
  storage.setItem(DLC_KEY, JSON.stringify(packs))
}

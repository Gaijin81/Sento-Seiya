import { DEFAULT_MOVE } from './board'
import type { KnightProgress, ProgressionState } from './progression'
import type { UnitSetup } from './types'

export type EquipmentSlot = 'relic' | 'charm'
export type Loadout = Partial<Record<EquipmentSlot, string>>
export type ItemBonus = { hp?: number; attack?: number; defense?: number; speed?: number; maxCosmos?: number; move?: number; techniqueRange?: number }
export type Rarity = 'common' | 'rare' | 'legendary'
export type EquipmentItem = { id: string; name: string; slot: EquipmentSlot; description: string; cost: number; bonus: ItemBonus; rarity?: Rarity }
export type GearResult = { ok: true; progression: ProgressionState } | { ok: false; error: string; progression: ProgressionState }

export const EQUIPMENT_SLOTS: EquipmentSlot[] = ['relic', 'charm']
export const SLOT_LABELS: Record<EquipmentSlot, string> = { relic: 'Relique', charm: 'Talisman' }
export const RARITY_LABELS: Record<Rarity, string> = { common: 'Commun', rare: 'Rare', legendary: 'Légendaire' }

/** Rare and legendary items cannot be forged: they are only found in the campaign. */
export const isForgeable = (item: EquipmentItem) => (item.rarity ?? 'common') === 'common'

export const EQUIPMENT_CATALOG: EquipmentItem[] = [
  { id: 'bracelet-bronze', name: 'Bracelet de bronze', slot: 'relic', cost: 20, description: 'Forgé dans les restes d’une armure brisée.', bonus: { attack: 2 } },
  { id: 'cape-sanctuaire', name: 'Cape du Sanctuaire', slot: 'relic', cost: 20, description: 'Tissée par les servantes du Sanctuaire.', bonus: { defense: 2 } },
  { id: 'lentille-stellaire', name: 'Lentille stellaire', slot: 'relic', cost: 40, description: 'Concentre le Cosmos vers les cibles lointaines.', bonus: { techniqueRange: 1 } },
  { id: 'plume-phenix', name: 'Plume ardente', slot: 'charm', cost: 20, description: 'Une plume tiède qui ne s’éteint jamais.', bonus: { hp: 8 } },
  { id: 'gemme-cosmos', name: 'Gemme de Cosmos', slot: 'charm', cost: 25, description: 'Un éclat cristallisé qui élargit le Cosmos.', bonus: { maxCosmos: 1 } },
  { id: 'sandales-ailees', name: 'Sandales ailées', slot: 'charm', cost: 35, description: 'Légères comme le vent du Sanctuaire.', bonus: { move: 1, speed: 1 } },
  { id: 'larme-etoile', name: 'Larme d’étoile filante', slot: 'charm', cost: 0, rarity: 'rare', description: 'Une goutte de lumière tombée du ciel le soir du tournoi.', bonus: { hp: 6, speed: 1 } },
  { id: 'fragment-argent', name: 'Fragment d’armure d’argent', slot: 'relic', cost: 0, rarity: 'rare', description: 'Arraché à l’armure noire du chef masqué : de l’argent véritable.', bonus: { attack: 2, defense: 1 } },
  { id: 'eclat-or', name: 'Éclat d’armure d’or', slot: 'charm', cost: 0, rarity: 'legendary', description: 'Confié en signe de respect. Il brille comme le Sagittaire.', bonus: { hp: 10, defense: 1, maxCosmos: 1 } },
  { id: 'plume-phenix', name: 'Plume de feu', slot: 'relic', cost: 0, rarity: 'rare', description: 'Trouvée dans la grotte sous le volcan. Elle ne refroidit jamais.', bonus: { attack: 1, speed: 2 } },
  { id: 'cendre-phenix', name: 'Cendres du Phénix', slot: 'charm', cost: 0, rarity: 'legendary', description: 'Ce qui reste du masque brisé. On dit que le Phénix renaît toujours.', bonus: { hp: 8, attack: 2 } },
]

let extraItems: EquipmentItem[] = []

/** Items added by installed content packs (DLC). */
export function setExtraItems(items: EquipmentItem[]): void {
  extraItems = [...items]
}

export function allItems(): EquipmentItem[] {
  return [...EQUIPMENT_CATALOG, ...extraItems]
}

const BONUS_LABELS: [keyof ItemBonus, string][] = [['hp', 'PV'], ['attack', 'ATQ'], ['defense', 'DÉF'], ['speed', 'VIT'], ['maxCosmos', 'Cosmos max'], ['move', 'déplacement'], ['techniqueRange', 'portée de technique']]

export function getItem(id: string): EquipmentItem | undefined {
  return allItems().find((item) => item.id === id)
}

export function bonusLabel(bonus: ItemBonus): string {
  return BONUS_LABELS.filter(([key]) => bonus[key]).map(([key, label]) => `+${bonus[key]} ${label}`).join(' · ')
}

export function ownedCount(progression: ProgressionState, itemId: string): number {
  return progression.inventory.filter((id) => id === itemId).length
}

export function equippedCount(progression: ProgressionState, itemId: string): number {
  return Object.values(progression.equipment).reduce((total, loadout) => total + EQUIPMENT_SLOTS.filter((slot) => loadout[slot] === itemId).length, 0)
}

export function availableCount(progression: ProgressionState, itemId: string): number {
  return ownedCount(progression, itemId) - equippedCount(progression, itemId)
}

/** Spends stardust to add one copy of an item to the inventory. */
export function forgeItem(progression: ProgressionState, itemId: string): GearResult {
  const item = getItem(itemId)
  if (!item) return { ok: false, error: 'Objet inconnu.', progression }
  if (!isForgeable(item)) return { ok: false, error: `${item.name} ne se forge pas : il se trouve en campagne.`, progression }
  if (progression.stardust < item.cost) return { ok: false, error: `Il faut ${item.cost} poussières d’étoiles pour forger ${item.name}.`, progression }
  return { ok: true, progression: { ...progression, stardust: progression.stardust - item.cost, inventory: [...progression.inventory, item.id] } }
}

/** Equips a free copy in the item's slot, replacing (and freeing) whatever was there. */
export function equipItem(progression: ProgressionState, knightId: string, itemId: string): GearResult {
  const item = getItem(itemId)
  if (!item) return { ok: false, error: 'Objet inconnu.', progression }
  if (!progression.knights.some((knight) => knight.id === knightId)) return { ok: false, error: 'Ce chevalier n’a pas rejoint ton équipe.', progression }
  const loadout = progression.equipment[knightId] ?? {}
  if (loadout[item.slot] === itemId) return { ok: false, error: `${item.name} est déjà équipé.`, progression }
  if (availableCount(progression, itemId) < 1) return { ok: false, error: `Aucun exemplaire libre de ${item.name}.`, progression }
  return { ok: true, progression: { ...progression, equipment: { ...progression.equipment, [knightId]: { ...loadout, [item.slot]: itemId } } } }
}

export function unequipItem(progression: ProgressionState, knightId: string, slot: EquipmentSlot): GearResult {
  const loadout = progression.equipment[knightId]
  if (!loadout?.[slot]) return { ok: false, error: 'Cet emplacement est déjà vide.', progression }
  const { [slot]: _removed, ...rest } = loadout
  return { ok: true, progression: { ...progression, equipment: { ...progression.equipment, [knightId]: rest } } }
}

export function applyEquipment(unit: UnitSetup, loadout: Loadout | undefined): UnitSetup {
  const items = EQUIPMENT_SLOTS.flatMap((slot) => {
    const item = loadout?.[slot] ? getItem(loadout[slot]!) : undefined
    return item ? [item.bonus] : []
  })
  if (items.length === 0) return unit
  const sum = (key: keyof ItemBonus) => items.reduce((total, bonus) => total + (bonus[key] ?? 0), 0)
  const hp = sum('hp')
  const techniqueRange = sum('techniqueRange')
  return {
    ...unit,
    hp: unit.hp + hp,
    maxHp: unit.maxHp + hp,
    attack: unit.attack + sum('attack'),
    defense: unit.defense + sum('defense'),
    speed: unit.speed + sum('speed'),
    maxCosmos: unit.maxCosmos + sum('maxCosmos'),
    move: (unit.move ?? DEFAULT_MOVE) + sum('move'),
    technique: unit.technique && techniqueRange ? { ...unit.technique, range: (unit.technique.range ?? 1) + techniqueRange } : unit.technique,
  }
}

export function normalizeInventory(raw: unknown[]): string[] {
  return raw.filter((id): id is string => typeof id === 'string' && Boolean(getItem(id)))
}

/** Drops loadouts of unknown knights, wrong slots and copies the inventory does not hold. */
export function normalizeEquipment(raw: unknown, knights: KnightProgress[], inventory: string[]): Record<string, Loadout> {
  if (!raw || typeof raw !== 'object') return {}
  const remaining = new Map<string, number>()
  inventory.forEach((id) => remaining.set(id, (remaining.get(id) ?? 0) + 1))
  const result: Record<string, Loadout> = {}
  for (const knight of knights) {
    const loadout = (raw as Record<string, unknown>)[knight.id]
    if (!loadout || typeof loadout !== 'object') continue
    const kept: Loadout = {}
    for (const slot of EQUIPMENT_SLOTS) {
      const id = (loadout as Record<string, unknown>)[slot]
      if (typeof id !== 'string' || getItem(id)?.slot !== slot || (remaining.get(id) ?? 0) < 1) continue
      remaining.set(id, remaining.get(id)! - 1)
      kept[slot] = id
    }
    if (Object.keys(kept).length > 0) result[knight.id] = kept
  }
  return result
}

/** Adds found items (campaign loot) to the inventory; unknown ids are ignored. */
export function grantItems(progression: ProgressionState, itemIds: string[]): ProgressionState {
  const found = itemIds.filter((id) => getItem(id))
  return found.length ? { ...progression, inventory: [...progression.inventory, ...found] } : progression
}

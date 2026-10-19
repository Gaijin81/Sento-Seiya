import type { StorageLike } from './progression'
import type { UnitSetup } from './types'

export type Difficulty = 'easy' | 'normal' | 'hard'

export const DIFFICULTY_KEY = 'sento-seiya-difficulty'
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']
export const DIFFICULTY_INFO: Record<Difficulty, { label: string; description: string; hp: number; attack: number; defense: number }> = {
  easy: { label: 'Facile', description: 'Adversaires −20 % PV, −2 ATQ.', hp: 0.8, attack: -2, defense: 0 },
  normal: { label: 'Normal', description: 'L’expérience prévue.', hp: 1, attack: 0, defense: 0 },
  hard: { label: 'Difficile', description: 'Adversaires +25 % PV, +2 ATQ, +1 DÉF.', hp: 1.25, attack: 2, defense: 1 },
}

/** Scales the AI side only; player knights keep their stats. */
export function applyDifficulty(enemies: UnitSetup[], difficulty: Difficulty): UnitSetup[] {
  const info = DIFFICULTY_INFO[difficulty]
  if (difficulty === 'normal') return enemies
  return enemies.map((unit) => {
    const maxHp = Math.max(1, Math.round(unit.maxHp * info.hp))
    return { ...unit, maxHp, hp: Math.min(maxHp, Math.max(1, Math.round(unit.hp * info.hp))), attack: Math.max(1, unit.attack + info.attack), defense: Math.max(0, unit.defense + info.defense) }
  })
}

export function parseDifficulty(value: unknown): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty) ? value as Difficulty : 'normal'
}

export function loadDifficulty(storage: StorageLike): Difficulty {
  try {
    return parseDifficulty(storage.getItem(DIFFICULTY_KEY))
  } catch {
    return 'normal'
  }
}

export function saveDifficulty(storage: StorageLike, difficulty: Difficulty): void {
  storage.setItem(DIFFICULTY_KEY, difficulty)
}

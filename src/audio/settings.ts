import type { StorageLike } from '../combat/progression'

export type AudioSettings = { music: number; sfx: number; muted: boolean }

export const AUDIO_KEY = 'sento-seiya-audio'
export const DEFAULT_AUDIO: AudioSettings = { music: 60, sfx: 80, muted: false }

export function clampVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(Math.min(100, Math.max(0, value))) : fallback
}

export function parseAudioSettings(value: unknown): AudioSettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_AUDIO }
  const candidate = value as Record<string, unknown>
  return {
    music: clampVolume(candidate.music, DEFAULT_AUDIO.music),
    sfx: clampVolume(candidate.sfx, DEFAULT_AUDIO.sfx),
    muted: typeof candidate.muted === 'boolean' ? candidate.muted : DEFAULT_AUDIO.muted,
  }
}

export function loadAudioSettings(storage: StorageLike): AudioSettings {
  try {
    const raw = storage.getItem(AUDIO_KEY)
    return raw ? parseAudioSettings(JSON.parse(raw)) : { ...DEFAULT_AUDIO }
  } catch {
    return { ...DEFAULT_AUDIO }
  }
}

export function saveAudioSettings(storage: StorageLike, settings: AudioSettings): void {
  storage.setItem(AUDIO_KEY, JSON.stringify(settings))
}

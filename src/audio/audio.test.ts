import { describe, expect, it } from 'vitest'
import { audio, midiToHz } from './engine'
import { AUDIO_KEY, clampVolume, DEFAULT_AUDIO, loadAudioSettings, parseAudioSettings, saveAudioSettings } from './settings'

describe('audio', () => {
  it('clamps and parses saved settings', () => {
    expect(clampVolume(140, 50)).toBe(100)
    expect(clampVolume(-3, 50)).toBe(0)
    expect(clampVolume('loud', 50)).toBe(50)
    expect(parseAudioSettings({ music: 33.4, sfx: 'x', muted: true })).toEqual({ music: 33, sfx: DEFAULT_AUDIO.sfx, muted: true })
    expect(parseAudioSettings(null)).toEqual(DEFAULT_AUDIO)
  })

  it('saves and reloads settings, falling back on corrupted data', () => {
    const store = new Map<string, string>()
    const storage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value) } }
    expect(loadAudioSettings(storage)).toEqual(DEFAULT_AUDIO)
    saveAudioSettings(storage, { music: 10, sfx: 0, muted: true })
    expect(loadAudioSettings(storage)).toEqual({ music: 10, sfx: 0, muted: true })
    store.set(AUDIO_KEY, '{oops')
    expect(loadAudioSettings(storage)).toEqual(DEFAULT_AUDIO)
  })

  it('converts notes and stays silent without Web Audio support', () => {
    expect(midiToHz(69)).toBe(440)
    expect(midiToHz(81)).toBeCloseTo(880)
    expect(() => { audio.unlock(); audio.playTheme('battle'); audio.sfx('hit'); audio.configure({ music: 0, sfx: 0, muted: true }) }).not.toThrow()
  })
})

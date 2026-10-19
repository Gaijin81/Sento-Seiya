import { DEFAULT_AUDIO, type AudioSettings } from './settings'

export type Theme = 'menu' | 'campaign' | 'battle'
export type Sfx = 'select' | 'hit' | 'technique' | 'victory' | 'defeat'

export const THEMES: Theme[] = ['menu', 'campaign', 'battle']
export const THEME_LABELS: Record<Theme, string> = { menu: 'Menus', campaign: 'Campagne', battle: 'Combat' }

/** Original procedural loops (MIDI notes), generated in the browser: no audio file needed. */
const LOOPS: Record<Theme, { tempo: number; wave: OscillatorType; notes: number[]; bass: number[] }> = {
  menu: { tempo: 72, wave: 'sine', notes: [69, 72, 76, 79, 76, 72, 74, 77], bass: [45, 45, 41, 43] },
  campaign: { tempo: 96, wave: 'triangle', notes: [62, 65, 69, 74, 72, 69, 67, 65], bass: [38, 41, 36, 43] },
  battle: { tempo: 144, wave: 'square', notes: [64, 64, 67, 64, 71, 69, 67, 62], bass: [40, 40, 43, 38] },
}

const EFFECTS: Record<Sfx, { wave: OscillatorType; notes: number[]; step: number }> = {
  select: { wave: 'triangle', notes: [84], step: 0.06 },
  hit: { wave: 'square', notes: [52, 45], step: 0.05 },
  technique: { wave: 'sawtooth', notes: [60, 67, 72, 79], step: 0.06 },
  victory: { wave: 'triangle', notes: [72, 76, 79, 84], step: 0.14 },
  defeat: { wave: 'sine', notes: [67, 63, 60, 55], step: 0.2 },
}

export const midiToHz = (note: number) => 440 * 2 ** ((note - 69) / 12)

type Ctx = AudioContext

class AudioEngine {
  private ctx: Ctx | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private element: HTMLAudioElement | null = null
  private theme: Theme | null = null
  private playing: Theme | null = null
  private settings: AudioSettings = { ...DEFAULT_AUDIO }
  private overrides: Partial<Record<Theme, string>> = {}

  get supported(): boolean {
    return typeof window !== 'undefined' && typeof window.AudioContext === 'function'
  }

  /** Browsers only allow sound after a user gesture: call this from a click/keypress handler. */
  unlock(): void {
    if (!this.supported) return
    if (!this.ctx) {
      this.ctx = new window.AudioContext()
      this.musicGain = this.ctx.createGain()
      this.sfxGain = this.ctx.createGain()
      this.musicGain.connect(this.ctx.destination)
      this.sfxGain.connect(this.ctx.destination)
      this.applyVolumes()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    this.refresh()
  }

  configure(settings: AudioSettings): void {
    this.settings = settings
    this.applyVolumes()
    this.refresh()
  }

  setOverrides(overrides: Partial<Record<Theme, string>>): void {
    this.overrides = { ...overrides }
    this.stop()
    this.refresh()
  }

  playTheme(theme: Theme): void {
    this.theme = theme
    this.refresh()
  }

  sfx(name: Sfx): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted || this.settings.sfx === 0) return
    const effect = EFFECTS[name]
    effect.notes.forEach((note, index) => this.tone(this.sfxGain!, effect.wave, note, this.ctx!.currentTime + index * effect.step, effect.step * 1.6, 0.5))
  }

  private applyVolumes(): void {
    const music = this.settings.muted ? 0 : this.settings.music / 100
    if (this.musicGain) this.musicGain.gain.value = music * 0.18
    if (this.sfxGain) this.sfxGain.gain.value = this.settings.muted ? 0 : this.settings.sfx / 100 * 0.3
    if (this.element) this.element.volume = music
  }

  private refresh(): void {
    const wanted = this.settings.muted || this.settings.music === 0 ? null : this.theme
    if (wanted === this.playing) return
    this.stop()
    if (!wanted) return
    const url = this.overrides[wanted]
    if (url && typeof Audio === 'function') {
      this.element = new Audio(url)
      this.element.loop = true
      this.element.volume = this.settings.music / 100
      this.element.play().catch(() => { /* waits for a user gesture */ })
      this.playing = wanted
      return
    }
    if (!this.ctx || !this.musicGain) return
    const loop = LOOPS[wanted]
    const beat = 60 / loop.tempo / 2
    let step = 0
    const tick = () => {
      if (!this.ctx || !this.musicGain) return
      const at = this.ctx.currentTime + 0.05
      this.tone(this.musicGain, loop.wave, loop.notes[step % loop.notes.length], at, beat * 0.9, 0.35)
      if (step % 2 === 0) this.tone(this.musicGain, 'sine', loop.bass[(step / 2) % loop.bass.length], at, beat * 1.8, 0.6)
      step += 1
    }
    tick()
    this.timer = setInterval(tick, beat * 1000)
    this.playing = wanted
  }

  private stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.element?.pause()
    this.element = null
    this.playing = null
  }

  private tone(output: GainNode, wave: OscillatorType, note: number, at: number, length: number, level: number): void {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = wave
    osc.frequency.value = midiToHz(note)
    env.gain.setValueAtTime(0.0001, at)
    env.gain.exponentialRampToValueAtTime(level, at + 0.02)
    env.gain.exponentialRampToValueAtTime(0.0001, at + length)
    osc.connect(env).connect(output)
    osc.start(at)
    osc.stop(at + length + 0.05)
  }
}

export const audio = new AudioEngine()

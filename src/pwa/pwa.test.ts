import { describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from './register'
import manifestSource from '../../public/manifest.webmanifest?raw'
import workerSource from '../../public/sw.js?raw'

describe('pwa', () => {
  it('declares an installable manifest with the shell icons', () => {
    const manifest = JSON.parse(manifestSource)
    expect(manifest).toMatchObject({ display: 'standalone', lang: 'fr', start_url: './' })
    expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
    const worker = workerSource
    for (const icon of manifest.icons) expect(worker).toContain(`./${icon.src}`)
  })

  it('registers the service worker only in production when supported', () => {
    const register = vi.fn(() => Promise.resolve())
    expect(registerServiceWorker({ serviceWorker: { register } }, false)).toBe(false)
    expect(registerServiceWorker({}, true)).toBe(false)
    expect(registerServiceWorker(undefined, true)).toBe(false)
    expect(registerServiceWorker({ serviceWorker: { register } }, true, '/jeu/')).toBe(true)
    expect(register).toHaveBeenCalledWith('/jeu/sw.js')
  })
})

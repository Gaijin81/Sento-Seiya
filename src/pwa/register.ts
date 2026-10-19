type ServiceWorkerHost = { serviceWorker?: { register: (url: string) => Promise<unknown> } }

/** Registers the offline service worker in production builds only (dev keeps Vite's hot reload). */
export function registerServiceWorker(navigatorLike: ServiceWorkerHost | undefined, production: boolean, baseUrl = '/'): boolean {
  if (!production || !navigatorLike?.serviceWorker) return false
  navigatorLike.serviceWorker.register(`${baseUrl}sw.js`).catch(() => undefined)
  return true
}

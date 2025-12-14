// This optional code is used to register a service worker.
// register() is not called by default.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
)

export const register = (): void => {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(
      (process.env.PUBLIC_URL ?? ''),
      window.location.href
    )

    if (publicUrl.origin !== window.location.origin) {
      return
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`

      if (isLocalhost) {
        checkValidServiceWorker(swUrl)
      } else {
        registerValidSW(swUrl)
      }
    })
  }
}

const registerValidSW = async (swUrl: string): Promise<void> => {
  try {
    const registration = await navigator.serviceWorker.register(swUrl)
    registration.onupdatefound = () => {
      const installingWorker = registration.installing
      if (!installingWorker) return

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            console.log('New content is available; please refresh.')
          } else {
            console.log('Content is cached for offline use.')
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during service worker registration:', error)
  }
}

const checkValidServiceWorker = async (swUrl: string): Promise<void> => {
  try {
    const response = await fetch(swUrl, {
      headers: { 'Service-Worker': 'script' },
    })

    if (
      response.status === 404 ||
      response.headers.get('content-type')?.indexOf('javascript') === -1
    ) {
      const registration = await navigator.serviceWorker.ready
      await registration.unregister()
      window.location.reload()
    } else {
      registerValidSW(swUrl)
    }
  } catch {
    console.log('No internet connection found. App is running in offline mode.')
  }
}

export const unregister = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready
    await registration.unregister()
  }
}

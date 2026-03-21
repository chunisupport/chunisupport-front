const isLocalStorageAvailable = (): boolean =>
  typeof window !== 'undefined' && 'localStorage' in window

export const localStorageStore = {
  isAvailable(): boolean {
    return isLocalStorageAvailable()
  },

  getItem<T>(key: string): T | null {
    if (!isLocalStorageAvailable()) {
      return null
    }

    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as T
    } catch {
      window.localStorage.removeItem(key)
      return null
    }
  },

  setItem<T>(key: string, value: T): boolean {
    if (!isLocalStorageAvailable()) {
      return false
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },

  removeItem(key: string): void {
    if (!isLocalStorageAvailable()) {
      return
    }

    window.localStorage.removeItem(key)
  },

  removeByPrefix(prefix: string): void {
    if (!isLocalStorageAvailable()) {
      return
    }

    const keysToDelete: string[] = []
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => {
      window.localStorage.removeItem(key)
    })
  },
}

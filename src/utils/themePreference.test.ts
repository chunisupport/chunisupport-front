import assert from 'node:assert/strict'
import test from 'node:test'
import {
  readThemePreference,
  resolveAppliedTheme,
  saveThemePreference,
  subscribeSystemThemeChange,
} from './themePreference'

test('明示的にlightが保存されている場合はlightを適用する', () => {
  assert.equal(resolveAppliedTheme('light', true), 'light')
})

test('明示的にdarkが保存されている場合はdarkを適用する', () => {
  assert.equal(resolveAppliedTheme('dark', false), 'dark')
})

test('systemまたは未設定の場合はOS設定から適用テーマを決定する', () => {
  assert.equal(resolveAppliedTheme('system', true), 'dark')
  assert.equal(resolveAppliedTheme(null, false), 'light')
})

test('localStorageを読み取れない場合はsystemを返す', () => {
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => {
          throw new Error('blocked')
        },
      },
    },
  })

  try {
    assert.equal(readThemePreference(), 'system')
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
})

test('localStorageへ保存できない場合でも例外を投げない', () => {
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        setItem: () => {
          throw new Error('blocked')
        },
      },
    },
  })

  try {
    assert.doesNotThrow(() => saveThemePreference('dark'))
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
})

test('system設定中はOSテーマ変更に追従する', () => {
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  let mediaListener: (() => void) | null = null
  const documentElement = { dataset: {} as Record<string, string> }

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      matchMedia: () => ({
        matches: true,
        addEventListener: (_type: string, listener: () => void) => {
          mediaListener = listener
        },
        removeEventListener: (_type: string, listener: () => void) => {
          if (mediaListener === listener) {
            mediaListener = null
          }
        },
      }),
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement },
  })

  try {
    const unsubscribe = subscribeSystemThemeChange(() => 'system')
    const listener = mediaListener as (() => void) | null
    if (listener === null) {
      throw new Error('media listener was not registered')
    }
    listener()
    assert.equal(documentElement.dataset.theme, 'dark')

    unsubscribe()
    assert.equal(mediaListener, null)
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: previousDocument,
    })
  }
})

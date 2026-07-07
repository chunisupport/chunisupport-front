import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyAccentPreference,
  applyInitialAccent,
  DEFAULT_ACCENT,
  readAccentPreference,
  readThemePreference,
  resolveAppliedTheme,
  saveAccentPreference,
  saveThemePreference,
} from './themePreference'

test('明示的にlightが保存されている場合はlightを適用する', () => {
  assert.equal(resolveAppliedTheme('light', true), 'light')
})

test('明示的にdarkが保存されている場合はdarkを適用する', () => {
  assert.equal(resolveAppliedTheme('dark', false), 'dark')
})

test('明示的にblackが保存されている場合はblackを適用する', () => {
  assert.equal(resolveAppliedTheme('black', false), 'black')
})

test('明示的にdark-blueが保存されている場合はdark-blueを適用する', () => {
  assert.equal(resolveAppliedTheme('dark-blue', true), 'dark-blue')
  assert.equal(resolveAppliedTheme('dark-blue', false), 'dark-blue')
})

test('明示的にpastel-orangeが保存されている場合はpastel-orangeを適用する', () => {
  assert.equal(resolveAppliedTheme('pastel-orange', true), 'pastel-orange')
})

test('旧system設定または未設定の場合はOS設定から適用テーマを決定する', () => {
  assert.equal(resolveAppliedTheme('system', true), 'dark')
  assert.equal(resolveAppliedTheme(null, false), 'light')
})

test('localStorageを読み取れない場合はOS設定に対応するテーマを返す', () => {
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => {
          throw new Error('blocked')
        },
      },
      matchMedia: () => ({ matches: false }),
    },
  })

  try {
    assert.equal(readThemePreference(), 'light')
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

test('localStorageにdark-blueが保存されている場合はdark-blueを返す', () => {
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => 'dark-blue',
      },
    },
  })

  try {
    assert.equal(readThemePreference(), 'dark-blue')
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
})

test('localStorageにblackが保存されている場合はblackを返す', () => {
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => 'black',
      },
    },
  })

  try {
    assert.equal(readThemePreference(), 'black')
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
})

test('localStorageにpastel-orangeが保存されている場合はpastel-orangeを返す', () => {
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => 'pastel-orange',
      },
    },
  })

  try {
    assert.equal(readThemePreference(), 'pastel-orange')
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
})

test('旧system設定は現在のOSテーマに対応する明示的なテーマへ移行する', () => {
  const previousWindow = globalThis.window
  let savedValue = ''

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => 'system',
        setItem: (_key: string, value: string) => {
          savedValue = value
        },
      },
      matchMedia: () => ({ matches: true }),
    },
  })

  try {
    assert.equal(readThemePreference(), 'dark')
    assert.equal(savedValue, 'dark')
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
})

test('既定のアクセントカラーを背景テーマとは独立して適用する', () => {
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const documentElement = { dataset: {} as Record<string, string> }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => null,
      },
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement },
  })

  try {
    assert.equal(applyInitialAccent(), DEFAULT_ACCENT)
    assert.equal(documentElement.dataset.accent, 'green')
    assert.equal(documentElement.dataset.theme, undefined)
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

test('保存済みのオレンジアクセントを読み取って適用する', () => {
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const documentElement = { dataset: {} as Record<string, string> }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => 'orange',
      },
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement },
  })

  try {
    assert.equal(readAccentPreference(), 'orange')
    assert.equal(applyInitialAccent(), 'orange')
    assert.equal(documentElement.dataset.accent, 'orange')
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

test('保存済みのバイオレットアクセントを読み取って適用する', () => {
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const documentElement = { dataset: {} as Record<string, string> }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => 'violet',
      },
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement },
  })

  try {
    assert.equal(readAccentPreference(), 'violet')
    assert.equal(applyInitialAccent(), 'violet')
    assert.equal(documentElement.dataset.accent, 'violet')
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

test('保存済みのブルーアクセントを読み取って適用する', () => {
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const documentElement = { dataset: {} as Record<string, string> }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => 'blue',
      },
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement },
  })

  try {
    assert.equal(readAccentPreference(), 'blue')
    assert.equal(applyInitialAccent(), 'blue')
    assert.equal(documentElement.dataset.accent, 'blue')
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

test('不正なアクセント保存値は既定値へ戻す', () => {
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => 'purple',
      },
    },
  })

  try {
    assert.equal(readAccentPreference(), DEFAULT_ACCENT)
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
})

test('オレンジアクセントを保存し、背景テーマと独立して適用する', () => {
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  let savedValue = ''
  const documentElement = {
    dataset: { theme: 'black' } as Record<string, string>,
  }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        setItem: (_key: string, value: string) => {
          savedValue = value
        },
      },
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement },
  })

  try {
    saveAccentPreference('orange')
    assert.equal(savedValue, 'orange')
    assert.equal(applyAccentPreference('orange'), 'orange')
    assert.equal(documentElement.dataset.accent, 'orange')
    assert.equal(documentElement.dataset.theme, 'black')
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

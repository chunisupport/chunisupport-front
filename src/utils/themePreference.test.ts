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

/**
 * キーごとの保存値と読み書き履歴を保持するストレージ代替を作る。
 *
 * @param entries - テスト開始時のキーと保存値。
 * @returns 保存値、読み書き履歴、localStorage互換の読み書き関数。
 */
const createStorage = (entries: [string, string][]) => {
  const values = new Map(entries)
  const reads: string[] = []
  const writes: [string, string][] = []
  return {
    values,
    reads,
    writes,
    localStorage: {
      getItem: (key: string) => {
        reads.push(key)
        return values.get(key) ?? null
      },
      setItem: (key: string, value: string) => {
        writes.push([key, value])
        values.set(key, value)
      },
    },
  }
}

test('明示的にlightが保存されている場合はlightを適用する', () => {
  assert.equal(resolveAppliedTheme('light', true), 'light')
})

test('明示的にdarkが保存されている場合はdarkを適用する', () => {
  assert.equal(resolveAppliedTheme('dark', false), 'dark')
})

test('明示的にblackが保存されている場合はblackを適用する', () => {
  assert.equal(resolveAppliedTheme('black', false), 'black')
})

test('明示的にpastel-orangeが保存されている場合はpastel-orangeを適用する', () => {
  assert.equal(resolveAppliedTheme('pastel-orange', true), 'pastel-orange')
  assert.equal(resolveAppliedTheme('pastel-orange', false), 'pastel-orange')
})

test('明示的にdark-blueが保存されている場合はdark-blueを適用する', () => {
  assert.equal(resolveAppliedTheme('dark-blue', true), 'dark-blue')
  assert.equal(resolveAppliedTheme('dark-blue', false), 'dark-blue')
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

test('旧system設定は現在のOSテーマに対応する明示的なテーマへ移行する', () => {
  // Given: テーマとアクセントは異なるキーで保存されている。
  const previousWindow = globalThis.window
  const storage = createStorage([
    ['chunisupport-theme', 'system'],
    ['chunisupport-accent', 'sky-blue'],
  ])

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: storage.localStorage,
      matchMedia: () => ({ matches: true }),
    },
  })

  try {
    // When
    const theme = readThemePreference()

    // Then: テーマのキーだけを読み書きし、アクセントは保持する。
    assert.equal(theme, 'dark')
    assert.deepEqual(storage.reads, ['chunisupport-theme'])
    assert.deepEqual(storage.writes, [['chunisupport-theme', 'dark']])
    assert.deepEqual(
      [...storage.values],
      [
        ['chunisupport-theme', 'dark'],
        ['chunisupport-accent', 'sky-blue'],
      ]
    )
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

for (const { label, accent } of [
  { label: 'オレンジ', accent: 'orange' },
  { label: 'バイオレット', accent: 'violet' },
  { label: 'ブルー', accent: 'blue' },
]) {
  test(`保存済みの${label}アクセントを読み取って適用する`, () => {
    // Given: 選択したアクセントが保存された環境。
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
    const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
    const documentElement = { dataset: {} as Record<string, string> }

    try {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
          localStorage: {
            getItem: () => accent,
          },
        },
      })
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: { documentElement },
      })

      // When: 保存済みの設定を読み取り、初期アクセントを適用する。
      const preference = readAccentPreference()
      const appliedAccent = applyInitialAccent()

      // Then: 保存した色を読み取り、ルート要素にも同じ色を適用する。
      assert.equal(preference, accent)
      assert.equal(appliedAccent, accent)
      assert.equal(documentElement.dataset.accent, accent)
    } finally {
      if (previousWindow) {
        Object.defineProperty(globalThis, 'window', previousWindow)
      } else {
        Reflect.deleteProperty(globalThis, 'window')
      }
      if (previousDocument) {
        Object.defineProperty(globalThis, 'document', previousDocument)
      } else {
        Reflect.deleteProperty(globalThis, 'document')
      }
    }
  })
}

test('保存済みのスカイブルーアクセントを読み取って適用する', () => {
  // Given: 背景テーマはアクセントとは別のキーで保存されている。
  const storage = createStorage([['chunisupport-theme', 'black']])
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const documentElement = { dataset: {} as Record<string, string> }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: storage.localStorage,
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement },
  })

  try {
    // When
    saveAccentPreference('sky-blue')
    const preference = readAccentPreference()
    const appliedAccent = applyInitialAccent()

    // Then: アクセントのキーだけを読み書きし、背景テーマの保存値は変更しない。
    assert.equal(preference, 'sky-blue')
    assert.equal(appliedAccent, 'sky-blue')
    assert.equal(documentElement.dataset.accent, 'sky-blue')
    assert.deepEqual(storage.reads, ['chunisupport-accent', 'chunisupport-accent'])
    assert.deepEqual(storage.writes, [['chunisupport-accent', 'sky-blue']])
    assert.deepEqual(
      [...storage.values],
      [
        ['chunisupport-theme', 'black'],
        ['chunisupport-accent', 'sky-blue'],
      ]
    )
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
  // Given: 黒背景が画面にもストレージにも設定済み。
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const storage = createStorage([['chunisupport-theme', 'black']])
  const documentElement = {
    dataset: { theme: 'black' } as Record<string, string>,
  }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: storage.localStorage,
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement },
  })

  try {
    // When
    saveAccentPreference('orange')
    const appliedAccent = applyAccentPreference('orange')

    // Then: アクセントだけを保存・適用し、背景テーマは保存値も表示も変えない。
    assert.equal(appliedAccent, 'orange')
    assert.equal(documentElement.dataset.accent, 'orange')
    assert.equal(documentElement.dataset.theme, 'black')
    assert.deepEqual(storage.writes, [['chunisupport-accent', 'orange']])
    assert.deepEqual(
      [...storage.values],
      [
        ['chunisupport-theme', 'black'],
        ['chunisupport-accent', 'orange'],
      ]
    )
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

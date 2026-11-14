import assert from 'node:assert/strict'
import test from 'node:test'
import {
  NAV_BAR_COMPACT_MODE_STORAGE_KEY,
  readNavBarCompactMode,
  saveNavBarCompactMode,
} from './navBarCompactMode'

/**
 * window.localStorage を差し替えた状態でテスト本体を実行する。
 * @param localStorage 差し替える localStorage の代替実装
 * @param run 差し替え中に実行するテスト本体
 * @returns なし
 */
const withLocalStorage = (localStorage: Partial<Storage>, run: () => void): void => {
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage } })

  try {
    run()
  } finally {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: previousWindow })
  }
}

test('未設定の場合はコンパクトモードを無効にすること', () => {
  // Given: 何も保存されていない localStorage
  withLocalStorage({ getItem: () => null }, () => {
    // When & Then
    assert.equal(readNavBarCompactMode(), false)
  })
})

test('保存したコンパクトモードを読み取れること', () => {
  // Given: 書き込みを保持する localStorage
  const stored = new Map<string, string>()
  withLocalStorage(
    {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => {
        stored.set(key, value)
      },
    },
    () => {
      // When
      saveNavBarCompactMode(true)

      // Then
      assert.equal(stored.get(NAV_BAR_COMPACT_MODE_STORAGE_KEY), 'true')
      assert.equal(readNavBarCompactMode(), true)
    }
  )
})

test('コンパクトモードを解除して保存できること', () => {
  // Given: コンパクトモードが有効な localStorage
  const stored = new Map<string, string>([[NAV_BAR_COMPACT_MODE_STORAGE_KEY, 'true']])
  withLocalStorage(
    {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => {
        stored.set(key, value)
      },
    },
    () => {
      // When
      saveNavBarCompactMode(false)

      // Then
      assert.equal(stored.get(NAV_BAR_COMPACT_MODE_STORAGE_KEY), 'false')
      assert.equal(readNavBarCompactMode(), false)
    }
  )
})

test('不正な保存値はコンパクトモードを無効として扱うこと', () => {
  // Given: 想定外の値が保存された localStorage
  withLocalStorage({ getItem: () => 'compact' }, () => {
    // When & Then
    assert.equal(readNavBarCompactMode(), false)
  })
})

test('localStorageを読み書きできない場合でも例外を投げず無効を返すこと', () => {
  // Given: 常に例外を投げる localStorage
  const blocked = () => {
    throw new Error('blocked')
  }
  withLocalStorage({ getItem: blocked, setItem: blocked }, () => {
    // When & Then
    assert.equal(readNavBarCompactMode(), false)
    assert.doesNotThrow(() => saveNavBarCompactMode(true))
  })
})

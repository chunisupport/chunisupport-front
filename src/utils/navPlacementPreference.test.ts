import assert from 'node:assert/strict'
import test from 'node:test'
import {
  NAV_BAR_SIDE_STORAGE_KEY,
  NAV_RAIL_SIDE_STORAGE_KEY,
  readNavBarSide,
  readNavRailSide,
  saveNavBarSide,
  saveNavRailSide,
} from './navPlacementPreference'

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

test('未設定の場合は縦レールが左、横バーが下になること', () => {
  // Given: 何も保存されていない localStorage
  withLocalStorage({ getItem: () => null }, () => {
    // When & Then
    assert.equal(readNavRailSide(), 'left')
    assert.equal(readNavBarSide(), 'bottom')
  })
})

test('保存した配置側をそれぞれのキーから読み取れること', () => {
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
      saveNavRailSide('right')
      saveNavBarSide('top')

      // Then
      assert.equal(stored.get(NAV_RAIL_SIDE_STORAGE_KEY), 'right')
      assert.equal(stored.get(NAV_BAR_SIDE_STORAGE_KEY), 'top')
      assert.equal(readNavRailSide(), 'right')
      assert.equal(readNavBarSide(), 'top')
    }
  )
})

test('不正な保存値は既定値へ戻すこと', () => {
  // Given: もう一方の軸の値が保存された localStorage
  withLocalStorage(
    { getItem: (key) => (key === NAV_RAIL_SIDE_STORAGE_KEY ? 'top' : 'left') },
    () => {
      // When & Then
      assert.equal(readNavRailSide(), 'left')
      assert.equal(readNavBarSide(), 'bottom')
    }
  )
})

test('localStorageを読み書きできない場合でも例外を投げず既定値を返すこと', () => {
  // Given: 常に例外を投げる localStorage
  const blocked = () => {
    throw new Error('blocked')
  }
  withLocalStorage({ getItem: blocked, setItem: blocked }, () => {
    // When & Then
    assert.equal(readNavRailSide(), 'left')
    assert.equal(readNavBarSide(), 'bottom')
    assert.doesNotThrow(() => saveNavRailSide('right'))
    assert.doesNotThrow(() => saveNavBarSide('top'))
  })
})

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  NAV_BAR_SIDE_STORAGE_KEY,
  NAV_RAIL_SIDE_STORAGE_KEY,
  NAV_RAIL_VERTICAL_ALIGN_STORAGE_KEY,
  readNavBarSide,
  readNavRailSide,
  readNavRailVerticalAlign,
  saveNavBarSide,
  saveNavRailSide,
  saveNavRailVerticalAlign,
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

test('未設定の場合は縦レールが左、横バーが下、縦位置が上になること', () => {
  // Given: 何も保存されていない localStorage
  withLocalStorage({ getItem: () => null }, () => {
    // When & Then
    assert.equal(readNavRailSide(), 'left')
    assert.equal(readNavBarSide(), 'bottom')
    assert.equal(readNavRailVerticalAlign(), 'top')
  })
})

test('保存した配置側と縦位置をそれぞれのキーから読み取れること', () => {
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
      saveNavRailVerticalAlign('bottom')

      // Then
      assert.equal(stored.get(NAV_RAIL_SIDE_STORAGE_KEY), 'right')
      assert.equal(stored.get(NAV_BAR_SIDE_STORAGE_KEY), 'top')
      assert.equal(stored.get(NAV_RAIL_VERTICAL_ALIGN_STORAGE_KEY), 'bottom')
      assert.equal(readNavRailSide(), 'right')
      assert.equal(readNavBarSide(), 'top')
      assert.equal(readNavRailVerticalAlign(), 'bottom')
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
      assert.equal(readNavRailVerticalAlign(), 'top')
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
    assert.equal(readNavRailVerticalAlign(), 'top')
    assert.doesNotThrow(() => saveNavRailSide('right'))
    assert.doesNotThrow(() => saveNavBarSide('top'))
    assert.doesNotThrow(() => saveNavRailVerticalAlign('bottom'))
  })
})

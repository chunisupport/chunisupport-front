import assert from 'node:assert/strict'
import test, { afterEach, beforeEach } from 'node:test'

import { getDefaultFilter } from './filtering'
import { deleteFilter, loadSavedFilters, saveNewFilter } from './storage'

const SAVED_FILTERS_KEY = 'chunisup_saved_filters'

/**
 * localStorageを利用する処理のテスト用にメモリ実装を作成する。
 * @returns Storage互換のメモリストレージ
 */
const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear: () => {
      store.clear()
    },
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key)
    },
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
}

let originalDateNow: typeof Date.now

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  })
  originalDateNow = Date.now
})

afterEach(() => {
  Date.now = originalDateNow
  Reflect.deleteProperty(globalThis, 'localStorage')
})

test('loadSavedFilters は保存データがない場合に空配列を返す', () => {
  assert.deepEqual(loadSavedFilters(), [])
})

test('loadSavedFilters は不正JSONの場合に空配列を返す', () => {
  localStorage.setItem(SAVED_FILTERS_KEY, '{')

  assert.deepEqual(loadSavedFilters(), [])
})

test('loadSavedFilters は保存済みJSONを復元する', () => {
  const filter = { ...getDefaultFilter(), title: 'アルファ' }
  const savedFilters = [{ id: 'filter-1', name: '高難度', filter, savedAt: 1_774_972_800_000 }]
  localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(savedFilters))

  assert.deepEqual(loadSavedFilters(), savedFilters)
})

test('loadSavedFilters は古い保存済みフィルターに新しい範囲フィールドを補完する', () => {
  const legacyFilter: Partial<ReturnType<typeof getDefaultFilter>> = {
    ...getDefaultFilter(),
    title: '旧条件',
  }
  delete legacyFilter.justiceCountMin
  delete legacyFilter.justiceCountMax
  delete legacyFilter.overPowerMin
  delete legacyFilter.overPowerMax
  const savedFilters = [
    { id: 'filter-1', name: '旧形式', filter: legacyFilter, savedAt: 1_774_972_800_000 },
  ]
  localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(savedFilters))

  assert.deepEqual(loadSavedFilters(), [
    {
      id: 'filter-1',
      name: '旧形式',
      filter: {
        ...legacyFilter,
        justiceCountMin: null,
        justiceCountMax: null,
        overPowerMin: null,
        overPowerMax: null,
      },
      savedAt: 1_774_972_800_000,
    },
  ])
})

test('saveNewFilter は既存フィルターを残して新規フィルターを保存する', () => {
  const existingFilter = { ...getDefaultFilter(), title: '既存' }
  const newFilter = { ...getDefaultFilter(), title: '追加' }
  localStorage.setItem(
    SAVED_FILTERS_KEY,
    JSON.stringify([{ id: 'filter-1', name: '既存条件', filter: existingFilter, savedAt: 1 }])
  )
  Date.now = () => 1_774_972_800_000

  const id = saveNewFilter('追加条件', newFilter)

  assert.equal(id, '1774972800000')
  assert.deepEqual(JSON.parse(localStorage.getItem(SAVED_FILTERS_KEY) ?? '[]'), [
    { id: 'filter-1', name: '既存条件', filter: existingFilter, savedAt: 1 },
    {
      id: '1774972800000',
      name: '追加条件',
      filter: newFilter,
      savedAt: 1_774_972_800_000,
    },
  ])
})

test('deleteFilter は指定ID以外のフィルターを保存し直す', () => {
  const filter = getDefaultFilter()
  localStorage.setItem(
    SAVED_FILTERS_KEY,
    JSON.stringify([
      { id: 'filter-1', name: '残す条件', filter, savedAt: 1 },
      { id: 'filter-2', name: '削除する条件', filter, savedAt: 2 },
    ])
  )

  deleteFilter('filter-2')

  assert.deepEqual(JSON.parse(localStorage.getItem(SAVED_FILTERS_KEY) ?? '[]'), [
    { id: 'filter-1', name: '残す条件', filter, savedAt: 1 },
  ])
})

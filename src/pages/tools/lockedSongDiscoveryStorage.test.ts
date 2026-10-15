import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { LOCKED_SONG_DISCOVERY_OBSERVATIONS_STORAGE_PREFIX } from './lockedSongDiscovery.constants.ts'
import {
  clearLockedSongObservations,
  readLockedSongObservations,
  saveLockedSongObservations,
} from './lockedSongDiscoveryStorage'

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
let stored: Map<string, string>

beforeEach(() => {
  stored = new Map()
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => stored.set(key, value),
      },
    },
  })
})

afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

test('全分類のOP・OP%と入力途中の文字列をユーザー別に保存して復元する', () => {
  // Given
  const observations = {
    'genre:POPS & ANIME': { overPower: '123.45', percent: '67.89' },
    'version:VERSE': { overPower: '', percent: '90.' },
    'nameFolder:C': { overPower: '0', percent: '' },
    'level:14+': { overPower: '100.', percent: '99.99' },
  }

  // When
  saveLockedSongObservations('alice', observations)

  // Then
  assert.deepEqual(readLockedSongObservations('alice'), observations)
  assert.deepEqual(readLockedSongObservations('bob'), {})
  saveLockedSongObservations('bob', { 'level:14+': { overPower: '1', percent: '2' } })
  assert.deepEqual(readLockedSongObservations('alice'), observations)
})

test('入力欄を空欄に戻した状態も上書き保存する', () => {
  // Given
  saveLockedSongObservations('alice', { 'level:14+': { overPower: '12', percent: '34' } })

  // When
  saveLockedSongObservations('alice', { 'level:14+': { overPower: '', percent: '' } })

  // Then
  assert.deepEqual(readLockedSongObservations('alice'), {
    'level:14+': { overPower: '', percent: '' },
  })
})

test('壊れたJSONや不正な保存形式は空の入力値として扱う', () => {
  // Given
  const key = `${LOCKED_SONG_DISCOVERY_OBSERVATIONS_STORAGE_PREFIX}alice`
  for (const invalid of ['{', 'null', '[]', '123', '"text"']) {
    stored.set(key, invalid)

    // When, Then
    assert.deepEqual(readLockedSongObservations('alice'), {})
  }
})

test('不正な項目を除外し、有効な入力文字列だけを復元する', () => {
  // Given
  stored.set(
    `${LOCKED_SONG_DISCOVERY_OBSERVATIONS_STORAGE_PREFIX}alice`,
    JSON.stringify({
      'level:14+': { overPower: '12', percent: '', extra: 'ignored' },
      'genre:POPS': { overPower: 12, percent: '' },
      'version:VERSE': null,
      'nameFolder:C': { overPower: '34' },
    })
  )

  // When, Then
  assert.deepEqual(readLockedSongObservations('alice'), {
    'level:14+': { overPower: '12', percent: '' },
  })
})

test('未認証時は保存済みの入力値を読まず書き込まない', () => {
  // Given, When
  saveLockedSongObservations(undefined, { 'level:14+': { overPower: '12', percent: '' } })

  // Then
  assert.deepEqual(readLockedSongObservations(undefined), {})
  assert.equal(stored.size, 0)
})

test('localStorageの読み書きが失敗しても例外を外に投げない', (t) => {
  // Given
  t.mock.method(window.localStorage, 'getItem', () => {
    throw new Error('blocked')
  })
  t.mock.method(window.localStorage, 'setItem', () => {
    throw new Error('quota')
  })

  // When, Then
  assert.deepEqual(readLockedSongObservations('alice'), {})
  assert.doesNotThrow(() => saveLockedSongObservations('alice', {}))
})

for (const axis of ['genre', 'version', 'nameFolder', 'level'] as const) {
  test(`${axis}の消去は他分類と元の入力値を維持し、再読み込み後も復活しない`, () => {
    // Given
    const observations = {
      'genre:POPS': { overPower: '1', percent: '2' },
      'version:VERSE': { overPower: '3', percent: '4' },
      'nameFolder:C': { overPower: '5', percent: '6' },
      'level:14+': { overPower: '7', percent: '8' },
      'level:13': { overPower: '', percent: '9.' },
    }
    saveLockedSongObservations('alice', observations)

    // When
    const cleared = clearLockedSongObservations(readLockedSongObservations('alice'), axis)
    saveLockedSongObservations('alice', cleared)

    // Then
    const restored = readLockedSongObservations('alice')
    for (const [key, value] of Object.entries(observations)) {
      if (key.startsWith(`${axis}:`)) assert.equal(key in restored, false)
      else assert.deepEqual(restored[key], value)
    }
    assert.equal(Object.keys(observations).length, 5)
    assert.deepEqual(clearLockedSongObservations(cleared, axis), cleared)
  })
}

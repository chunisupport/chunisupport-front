import assert from 'node:assert/strict'
import test from 'node:test'
import { compareSongsByReading } from './songTitleSorting.ts'

test('compareSongsByReading は漢字の曲名ではなく reading の順に比較する', () => {
  // Given
  const songs = [
    { title: '愛', reading: 'ラブ' },
    { title: '林檎', reading: 'リンゴ' },
    { title: '空', reading: 'ソラ' },
  ]

  // When
  const sorted = [...songs].sort(compareSongsByReading)

  // Then
  assert.deepEqual(
    sorted.map((song) => song.title),
    ['空', '愛', '林檎']
  )
})

test('compareSongsByReading はカタカナ、英字、数字、その他・未設定の順に比較する', () => {
  // Given
  const songs = [
    { title: '未設定', reading: null },
    { title: '数字', reading: '39ミュージック' },
    { title: 'その他', reading: '♥ソング' },
    { title: '英字', reading: 'Brand New Day' },
    { title: 'カタカナ', reading: 'ワールド' },
  ]

  // When
  const sorted = [...songs].sort(compareSongsByReading)

  // Then
  assert.deepEqual(
    sorted.map((song) => song.title),
    ['カタカナ', '英字', '数字', '未設定', 'その他']
  )
})

test('compareSongsByReading は全角英数字を半角と同じ分類にする', () => {
  // Given
  const songs = [
    { title: '全角数字', reading: '３９' },
    { title: '全角英字', reading: 'ＢＲＡＮＤ' },
    { title: 'カタカナ', reading: 'ブランド' },
  ]

  // When
  const sorted = [...songs].sort(compareSongsByReading)

  // Then
  assert.deepEqual(
    sorted.map((song) => song.title),
    ['カタカナ', '全角英字', '全角数字']
  )
})

test('compareSongsByReading は reading が同じ場合に title で順序を確定する', () => {
  // Given
  const songs = [
    { title: 'B', reading: 'オナジ' },
    { title: 'A', reading: 'オナジ' },
  ]

  // When
  const sorted = [...songs].sort(compareSongsByReading)

  // Then
  assert.deepEqual(
    sorted.map((song) => song.title),
    ['A', 'B']
  )
})

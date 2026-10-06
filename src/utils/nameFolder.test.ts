import assert from 'node:assert/strict'
import test from 'node:test'
import { NAME_FOLDER_LABELS } from '../constants/nameFolder.ts'
import { NAME_FOLDER_KEYS, type NameFolderKey, resolveNameFolder } from './nameFolder.ts'

const cases: ReadonlyArray<readonly [string, string, NameFolderKey]> = [
  ['各行の先頭（ア）', 'アイ', 'A'],
  ['各行の末尾（オ）', 'オト', 'A'],
  ['各行の先頭（カ）', 'カセ', 'KA'],
  ['各行の末尾（コ）', 'ココロ', 'KA'],
  ['各行の先頭（サ）', 'サクラ', 'SA'],
  ['各行の末尾（ソ）', 'ソラ', 'SA'],
  ['各行の先頭（タ）', 'タイヨウ', 'TA'],
  ['各行の末尾（ト）', 'トキ', 'TA'],
  ['各行の先頭（ナ）', 'ナミ', 'NA'],
  ['各行の末尾（ノ）', 'ノハラ', 'NA'],
  ['各行の先頭（ハ）', 'ハナ', 'HA'],
  ['各行の末尾（ホ）', 'ホシ', 'HA'],
  ['各行の先頭（マ）', 'マチ', 'MA'],
  ['各行の末尾（モ）', 'モリ', 'MA'],
  ['各行の先頭（ヤ）', 'ヤマ', 'YA'],
  ['各行の末尾（ヨ）', 'ヨル', 'YA'],
  ['各行の先頭（ラ）', 'ラフ', 'RA'],
  ['各行の末尾（ロ）', 'ロツク', 'RA'],
  ['各行の先頭（ワ）', 'ワルト', 'WA'],
  ['ン', 'ンハ', 'WA'],
  ['英字 D', 'DAY', 'ABCD'],
  ['英字 E', 'ECHO', 'EFGH'],
  ['英字 H', 'HOPE', 'EFGH'],
  ['英字 I', 'ICE', 'IJKL'],
  ['英字 L', 'LOVE', 'IJKL'],
  ['英字 M', 'MOON', 'MNOP'],
  ['英字 P', 'PEACE', 'MNOP'],
  ['英字 Q', 'QUEEN', 'QRST'],
  ['英字 T', 'TIME', 'QRST'],
  ['英字 U', 'UP', 'UVWXYZ'],
  ['英字 Z', 'ZERO', 'UVWXYZ'],
  ['数字', '39ミユシツク', 'NUMBER'],
  ['数字 0', '0', 'NUMBER'],
]

for (const [label, reading, expected] of cases) {
  test(`resolveNameFolder は${label}の読みを ${expected} に振り分ける`, () => {
    // Given
    const song = { title: 'dummy', reading }

    // When
    const result = resolveNameFolder(song)

    // Then
    assert.equal(result, expected)
  })
}

test('resolveNameFolder は reading が null の場合に曲名で判定する', () => {
  // Given
  const song = { title: 'BRAND NEW DAY', reading: null }

  // When
  const result = resolveNameFolder(song)

  // Then
  assert.equal(result, 'ABCD')
})

test('resolveNameFolder は reading が空白のみの場合に曲名で判定する', () => {
  // Given
  const song = { title: 'ソラ', reading: '   ' }

  // When
  const result = resolveNameFolder(song)

  // Then
  assert.equal(result, 'SA')
})

test('resolveNameFolder は reading と曲名がともに空の場合に NUMBER を返す', () => {
  // Given
  const song = { title: '', reading: '' }

  // When
  const result = resolveNameFolder(song)

  // Then
  assert.equal(result, 'NUMBER')
})

test('NAME_FOLDER_LABELS のキーは NAME_FOLDER_KEYS と同じ順序で一致する', () => {
  // Given
  const labelKeys = Object.keys(NAME_FOLDER_LABELS)

  // When & Then
  assert.deepEqual(labelKeys, [...NAME_FOLDER_KEYS])
})

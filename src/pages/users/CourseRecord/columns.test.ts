import assert from 'node:assert/strict'
import test from 'node:test'
import { getRecordColumnBaseDefinition } from '../utils/recordColumnDefinitions.ts'
import { COURSE_RECORD_COLUMN_DEFINITIONS } from './columns.ts'

test('コースレコード列は既存レコード表と同じ列幅と短い見出しを使うこと', () => {
  // Given: コース列に対応する既存レコード列。
  const expected = [
    { id: 'title', label: 'タイトル', width: getRecordColumnBaseDefinition('title').width },
    {
      id: 'courseClass',
      label: 'クラス',
      width: getRecordColumnBaseDefinition('difficulty').width,
    },
    { id: 'score', label: 'スコア', width: getRecordColumnBaseDefinition('score').width },
    { id: 'lamp', label: 'AJ', width: getRecordColumnBaseDefinition('lamp').width },
    { id: 'hardLamp', label: 'ハード', width: getRecordColumnBaseDefinition('hardLamp').width },
  ]

  // When: コース列のID、見出し、幅を取り出す。
  const result = COURSE_RECORD_COLUMN_DEFINITIONS.map(({ id, label, width }) => ({
    id,
    label,
    width,
  }))

  // Then: 対応する既存列と一致する。
  assert.deepEqual(result, expected)
})

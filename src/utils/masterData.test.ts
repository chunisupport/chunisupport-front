import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MasterItemDTO } from '../types/api.ts'
import {
  compareMasterItemNames,
  compareMasterItemNamesKeepingUnknownLast,
  createMasterItemOrderMap,
  sortMasterItemsBySortOrder,
} from './masterData.ts'

const genres: MasterItemDTO[] = [
  { id: 3, name: '東方Project', sort_order: 30 },
  { id: 1, name: 'POPS & ANIME', sort_order: 10 },
  { id: 2, name: 'niconico', sort_order: 20 },
]

test('マスタ項目をsort_order順に並べる', () => {
  assert.deepEqual(
    sortMasterItemsBySortOrder(genres).map((genre) => genre.name),
    ['POPS & ANIME', 'niconico', '東方Project']
  )
})

test('マスタ順序にない名称は末尾で日本語順に並べる', () => {
  // Given: 未知項目も既知項目も期待順とは異なる順序で入力する。
  const orderMap = createMasterItemOrderMap(genres)

  // When
  const sorted = ['い', 'VARIETY', '東方Project', 'あ', 'POPS & ANIME'].sort((left, right) =>
    compareMasterItemNames(left, right, orderMap)
  )

  // Then: 未知項目は既知項目の後ろで日本語順に並ぶ。
  assert.deepEqual(sorted, ['POPS & ANIME', '東方Project', 'VARIETY', 'あ', 'い'])
})

test('マスタにない項目は昇順・降順とも末尾へ固定する', () => {
  const orderMap = createMasterItemOrderMap(genres)

  const ascending = ['VARIETY', '東方Project', 'POPS & ANIME'].sort((left, right) =>
    compareMasterItemNamesKeepingUnknownLast(left, right, orderMap, 'asc')
  )
  const descending = ['VARIETY', '東方Project', 'POPS & ANIME'].sort((left, right) =>
    compareMasterItemNamesKeepingUnknownLast(left, right, orderMap, 'desc')
  )

  assert.deepEqual(ascending, ['POPS & ANIME', '東方Project', 'VARIETY'])
  assert.deepEqual(descending, ['東方Project', 'POPS & ANIME', 'VARIETY'])
})

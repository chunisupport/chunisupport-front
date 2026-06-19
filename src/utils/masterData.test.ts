import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MasterItemDTO } from '../types/api.ts'
import {
  compareMasterItemNames,
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
  const orderMap = createMasterItemOrderMap(genres)
  const sorted = ['VARIETY', '東方Project', 'POPS & ANIME'].sort((left, right) =>
    compareMasterItemNames(left, right, orderMap)
  )

  assert.deepEqual(sorted, ['POPS & ANIME', '東方Project', 'VARIETY'])
})

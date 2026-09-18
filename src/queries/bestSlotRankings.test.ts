import assert from 'node:assert/strict'
import test from 'node:test'
import { loadTestModule } from '../test/setupTestEnvironment'
import type { BestSlotRankingResponseDTO } from '../types/api'

/**
 * ベスト枠ランキングquery moduleを環境設定後に読み込む。
 * @returns ベスト枠ランキングquery module。
 */
const loadBestSlotRankingsQuery = () => loadTestModule(() => import('./bestSlotRankings.ts'))

/**
 * ページングテスト用のレスポンスを生成する。
 * @param nextCursor 次ページカーソル。
 * @returns 空ランキングを持つレスポンス。
 */
const createResponse = (nextCursor: string | null): BestSlotRankingResponseDTO => ({
  rating_band: '17.0-17.1',
  eligible_player_count: 0,
  ranking: [],
  next_cursor: nextCursor,
})

test('ベスト枠ランキングquery keyはレート帯ごとに分離される', async () => {
  // Given: 2つの異なるレート帯。
  const { bestSlotRankingQueryKeys } = await loadBestSlotRankingsQuery()

  // When: 各query keyを生成する。
  const lowerBand = bestSlotRankingQueryKeys.band('17.0-17.1')
  const higherBand = bestSlotRankingQueryKeys.band('17.2-17.3')

  // Then: レート帯が異なればkeyも異なる。
  assert.notDeepEqual(lowerBand, higherBand)
})

test('未選択時は取得せず初回カーソルをnullにする', async () => {
  // Given: レート帯が未選択の状態。
  const { bestSlotRankingInfiniteQueryOptions } = await loadBestSlotRankingsQuery()

  // When: infinite query optionsを生成する。
  const options = bestSlotRankingInfiniteQueryOptions(null)

  // Then: queryは無効で、初回ページはカーソルなしになる。
  assert.equal(options.enabled, false)
  assert.equal(options.initialPageParam, null)
})

test('APIの次カーソルがある場合だけ次ページを有効にする', async () => {
  // Given: 次カーソルありと最終ページのレスポンス。
  const { bestSlotRankingInfiniteQueryOptions } = await loadBestSlotRankingsQuery()
  const options = bestSlotRankingInfiniteQueryOptions('17.0-17.1')

  // When: 次ページパラメータを解決する。
  const nextCursor = options.getNextPageParam(createResponse('next-cursor'), [], null, [])
  const finalCursor = options.getNextPageParam(createResponse(null), [], null, [])

  // Then: カーソルありの場合だけ値を返す。
  assert.equal(nextCursor, 'next-cursor')
  assert.equal(finalCursor, undefined)
})

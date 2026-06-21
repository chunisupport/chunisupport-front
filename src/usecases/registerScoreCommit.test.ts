import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerDataResult, PlayerDataStatisticsGroup } from '../types/api'
import {
  commitRegisterScore,
  normalizePlayerDataResult,
  requestChangedSongMasters,
} from './registerScoreCommit'

/** テスト用の統計グループを生成する。 */
const createStatisticsGroup = (after = 0): PlayerDataStatisticsGroup => ({
  total_high_score: { before: 0, after, delta: after },
  record_statistics: Object.fromEntries(
    ['aj', 'fc', 'clr', 'fch', 'max', 'sss_plus', 'sss', 'ss_plus', 'ss'].map((key) => [
      key,
      { before: 0, after: 0, delta: 0 },
    ])
  ) as unknown as PlayerDataStatisticsGroup['record_statistics'],
})

const createPlayerDataResult = (overrides: Partial<PlayerDataResult> = {}): PlayerDataResult => ({
  player_id: 1,
  app_ver: '0.0.1a',
  imported_at: '2026-06-10T00:00:00Z',
  profile: {
    player_id: 1,
    name: 'TEST',
    level: 1,
    rating: null,
    class_emblem_id: null,
    class_emblem_base_id: null,
    last_played_at: null,
    overpower_value: null,
    overpower_percent: null,
  },
  summary: {
    name: 'TEST',
    level: 1,
    rating: null,
    last_played_at: null,
    overpower_value: null,
    overpower_percentage: null,
  },
  statistics: {
    overall: createStatisticsGroup(),
    by_difficulty: {
      BASIC: createStatisticsGroup(),
      ADVANCED: createStatisticsGroup(),
      EXPERT: createStatisticsGroup(),
      MASTER: createStatisticsGroup(),
      ULTIMA: createStatisticsGroup(),
    },
  },
  counts: {
    standard_records_upserted: 0,
    worldsend_records_upserted: 0,
    standard_records_skipped: 0,
    worldsend_records_skipped: 0,
    honors_skipped: 0,
    standard_records_actually_changed: 0,
    worldsend_records_actually_changed: 0,
  },
  changes: [],
  skipped_records: [],
  ...overrides,
})

test('normalizePlayerDataResult: 配列フィールドがAPI型とずれてnullの場合も空配列へ正規化する', () => {
  // Given: ステージングAPIなどで配列フィールドがnullになったレスポンスを受け取った状態。
  const result = createPlayerDataResult({
    changes: null,
    skipped_records: null,
  } as unknown as Partial<PlayerDataResult>)

  // When: 画面表示前に登録結果を正規化する。
  const normalized = normalizePlayerDataResult(result)

  // Then: 差分表示ロジックがsomeやForを安全に使える配列になる。
  assert.deepEqual(normalized.changes, [])
  assert.deepEqual(normalized.skipped_records, [])
})

test('normalizePlayerDataResult: 難易度別統計が欠落した場合も固定5難易度へ正規化する', () => {
  // Given: 一部難易度の統計だけが返った状態。
  const result = createPlayerDataResult({
    statistics: {
      overall: createStatisticsGroup(),
      by_difficulty: { MASTER: createStatisticsGroup(1_000_000) },
    },
  } as unknown as Partial<PlayerDataResult>)

  // When: 画面表示前に登録結果を正規化する。
  const normalized = normalizePlayerDataResult(result)

  // Then: 結果ビューが固定順の全難易度を安全に表示できる。
  assert.equal(normalized.statistics.by_difficulty.MASTER.total_high_score.after, 1_000_000)
  assert.deepEqual(Object.keys(normalized.statistics.by_difficulty), [
    'BASIC',
    'ADVANCED',
    'EXPERT',
    'MASTER',
    'ULTIMA',
  ])
})

test("requestChangedSongMasters: 通常譜面とWORLD'S ENDの差分に応じたマスタ取得だけ開始する", () => {
  // Given: 通常譜面とWORLD'S ENDの差分が混在している登録結果。
  const calls: string[] = []
  const result = createPlayerDataResult({
    changes: [
      {
        record_type: 'standard',
        change_type: 'new',
        idx: '1',
        diff: 'MASTER',
        before: null,
        after: { score: 1_000_000, clear_lamp: 'CLEAR', combo_lamp: null, full_chain: null },
      },
      {
        record_type: 'worldsend',
        change_type: 'new',
        idx: '2',
        diff: 'WE',
        before: null,
        after: { score: 990_000, clear_lamp: 'CLEAR', combo_lamp: null, full_chain: null },
      },
    ],
  })

  // When: 差分に必要な楽曲マスタの読み込みを要求する。
  requestChangedSongMasters(result, {
    ensureSongsLoaded: () => calls.push('standard'),
    ensureWorldsendSongsLoaded: () => calls.push('worldsend'),
  })

  // Then: 両方のマスタ取得が開始される。
  assert.deepEqual(calls, ['standard', 'worldsend'])
})

test('commitRegisterScore: 登録結果を正規化して返す', async () => {
  // Given: 登録APIが成功する状態。
  const result = createPlayerDataResult()

  // When: スコア登録確定処理を実行する。
  const committed = await commitRegisterScore(
    { uploadToken: '11111111-1111-4111-8111-111111111111' },
    {
      commitPlayerData: async () => result,
      ensureSongsLoaded: () => {},
      ensureWorldsendSongsLoaded: () => {},
    }
  )

  // Then: 登録結果を画面へ返す。
  assert.deepEqual(committed.result, result)
})

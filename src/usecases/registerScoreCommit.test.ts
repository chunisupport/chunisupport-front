import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerDataResult, PlayerDataStatisticsGroup } from '../types/api'
import {
  commitRegisterScore,
  normalizePlayerDataResult,
  requestChangedSongMasters,
} from './registerScoreCommit'

/** テスト用の統計グループを生成する */
const createStatisticsGroup = (after = 0): PlayerDataStatisticsGroup => ({
  total_high_score: { before: 0, after, delta: after },
  record_statistics: Object.fromEntries(
    ['aj', 'fc', 'clr', 'fch', 'max', 'sss_plus', 'sss', 'ss_plus', 'ss', 's_plus', 's'].map(
      (key) => [key, { before: 0, after: 0, delta: 0 }]
    )
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
  metric_diffs: {
    rating: { before: null, after: null, delta: null },
    overpower_value: { before: null, after: null, delta: null },
    overpower_percent: { before: null, after: null, delta: null },
  },
  statistics: {
    overall: createStatisticsGroup(),
    by_difficulty: {
      BASIC: createStatisticsGroup(),
      ADVANCED: createStatisticsGroup(),
      EXPERT: createStatisticsGroup(),
      MASTER: createStatisticsGroup(),
      ULTIMA: createStatisticsGroup(),
      WE: createStatisticsGroup(),
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
    course_records_upserted: 0,
    course_records_skipped: 0,
    course_records_actually_changed: 0,
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

test('normalizePlayerDataResult: 最新更新結果にskipped_recordsがなくても空配列で補完する', () => {
  // Given: 最新更新結果APIと同様に診断用スキップ詳細を含まないレスポンス。
  const { skipped_records: _skippedRecords, ...latestUpdate } = createPlayerDataResult()

  // When: 既存の更新差分レポート用に結果を正規化する。
  const normalized = normalizePlayerDataResult(latestUpdate)

  // Then: 登録直後と同じ表示用結果として扱える。
  assert.deepEqual(normalized.skipped_records, [])
})

test('normalizePlayerDataResult: schema version 1では全メトリクス差分をnullで補完する', () => {
  // Given: メトリクス差分を持たないschema version 1の保存済み結果。
  const { metric_diffs: _metricDiffs, ...updateWithoutMetricDiffs } = createPlayerDataResult()
  const version1Update = { ...updateWithoutMetricDiffs, schema_version: 1 }

  // When: 既存の更新差分レポート用に結果を正規化する。
  const normalized = normalizePlayerDataResult(version1Update)

  // Then: 現在値を維持しつつ、すべてのメトリクス差分を非表示にできる。
  assert.deepEqual(normalized.metric_diffs, {
    rating: { before: null, after: null, delta: null },
    overpower_value: { before: null, after: null, delta: null },
    overpower_percent: { before: null, after: null, delta: null },
  })
})

test('normalizePlayerDataResult: schema version 2では欠落したOP%差分だけをnullで補完する', () => {
  // Given: レートとOVER POWER値の差分だけを持つschema version 2の保存済み結果。
  const version2MetricDiffs = {
    rating: { before: 16, after: 16.0125, delta: 0.0125 },
    overpower_value: { before: 100, after: 103.787, delta: 3.787 },
  }
  const version2Update = {
    ...createPlayerDataResult({ metric_diffs: version2MetricDiffs }),
    schema_version: 2,
  }

  // When: 既存の更新差分レポート用に結果を正規化する。
  const normalized = normalizePlayerDataResult(version2Update)

  // Then: 既存差分は維持し、未保存だったOP%差分だけを非表示にできる。
  assert.deepEqual(normalized.metric_diffs, {
    ...version2MetricDiffs,
    overpower_percent: { before: null, after: null, delta: null },
  })
})

test('normalizePlayerDataResult: schema version 3ではOP%差分を維持する', () => {
  // Given: OP%を含む全メトリクス差分を持つschema version 3の保存済み結果。
  const version3MetricDiffs = {
    rating: { before: 16, after: 16.0125, delta: 0.0125 },
    overpower_value: { before: 100, after: 103.787, delta: 3.787 },
    overpower_percent: { before: 98.75309, after: 98.76543, delta: 0.01234 },
  }
  const version3Update = {
    ...createPlayerDataResult({ metric_diffs: version3MetricDiffs }),
    schema_version: 3,
  }

  // When: 最新形式の更新差分レポート用に結果を正規化する。
  const normalized = normalizePlayerDataResult(version3Update)

  // Then: APIが返したOP%差分を含む全メトリクス差分をそのまま利用できる。
  assert.deepEqual(normalized.metric_diffs, version3MetricDiffs)
})

test("normalizePlayerDataResult: 難易度別統計が欠落した場合も固定5難易度とWORLD'S ENDへ正規化する", () => {
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
  assert.equal(normalized.statistics.by_difficulty.BASIC.record_statistics.s_plus.after, 0)
  assert.equal(normalized.statistics.by_difficulty.BASIC.record_statistics.s.after, 0)
  assert.deepEqual(Object.keys(normalized.statistics.by_difficulty), [
    'BASIC',
    'ADVANCED',
    'EXPERT',
    'MASTER',
    'ULTIMA',
    'WE',
  ])
})

test('normalizePlayerDataResult: 統計グループ内のS系項目が欠落した場合はゼロ値で補完する', () => {
  // Given: APIがS+とSをまだ返さない統計グループ。
  const statisticsGroupWithoutSRanks = createStatisticsGroup(1_000_000) as unknown as {
    total_high_score: PlayerDataStatisticsGroup['total_high_score']
    record_statistics: Omit<PlayerDataStatisticsGroup['record_statistics'], 's_plus' | 's'>
  }
  delete (
    statisticsGroupWithoutSRanks.record_statistics as Partial<
      PlayerDataStatisticsGroup['record_statistics']
    >
  ).s_plus
  delete (
    statisticsGroupWithoutSRanks.record_statistics as Partial<
      PlayerDataStatisticsGroup['record_statistics']
    >
  ).s
  const result = createPlayerDataResult({
    statistics: {
      overall: statisticsGroupWithoutSRanks,
      by_difficulty: { MASTER: statisticsGroupWithoutSRanks },
    } as unknown as PlayerDataResult['statistics'],
  })

  // When: APIレスポンスを画面表示用に正規化する。
  const normalized = normalizePlayerDataResult(result)

  // Then: 全体と難易度別のS系項目が安全に描画できる。
  assert.deepEqual(normalized.statistics.overall.record_statistics.s_plus, {
    before: 0,
    after: 0,
    delta: 0,
  })
  assert.deepEqual(normalized.statistics.by_difficulty.MASTER.record_statistics.s, {
    before: 0,
    after: 0,
    delta: 0,
  })
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
  let cacheCleared = false
  let friendRankingsInvalidated = false

  // When: スコア登録確定処理を実行する。
  const committed = await commitRegisterScore(
    { uploadToken: '11111111-1111-4111-8111-111111111111' },
    {
      commitPlayerData: async () => result,
      clearUserApiCache: async () => {
        cacheCleared = true
      },
      invalidateFriendRankings: async () => {
        friendRankingsInvalidated = true
      },
      ensureSongsLoaded: () => {},
      ensureWorldsendSongsLoaded: () => {},
    }
  )

  // Then: 登録結果を画面へ返す。
  assert.deepEqual(committed.result, result)
  assert.equal(cacheCleared, true)
  assert.equal(friendRankingsInvalidated, true)
})

test('commitRegisterScore: 派生キャッシュ更新失敗時も確定済みの登録結果を返す', async () => {
  // Given: スコア登録は成功し、IndexedDB削除とランキング無効化が失敗する状態。
  const result = createPlayerDataResult()

  // When: スコア登録確定処理を実行する。
  const committed = await commitRegisterScore(
    { uploadToken: '11111111-1111-4111-8111-111111111111' },
    {
      commitPlayerData: async () => result,
      clearUserApiCache: async () => {
        throw new Error('IndexedDB error')
      },
      invalidateFriendRankings: async () => {
        throw new Error('Query invalidation error')
      },
      ensureSongsLoaded: () => {},
      ensureWorldsendSongsLoaded: () => {},
    }
  )

  // Then: 登録成功は派生キャッシュ更新エラーの影響を受けない。
  assert.deepEqual(committed.result, result)
})

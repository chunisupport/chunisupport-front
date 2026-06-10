import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerDataResult } from '../../types/api'
import {
  commitRegisterScore,
  normalizePlayerDataResult,
  requestChangedSongMasters,
} from './registerScoreCommit'

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
    total_high_score: 0,
    lamp_counts: {
      clear: {},
      combo: {},
      full_chain: {},
    },
  },
  counts: {
    full_records_upserted: 0,
    worldsend_records_upserted: 0,
    full_records_skipped: 0,
    worldsend_records_skipped: 0,
    honors_skipped: 0,
    full_records_actually_changed: 0,
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

test("requestChangedSongMasters: 通常譜面とWORLD'S ENDの差分に応じたマスタ取得だけ開始する", () => {
  // Given: 通常譜面とWORLD'S ENDの差分が混在している登録結果。
  const calls: string[] = []
  const result = createPlayerDataResult({
    changes: [
      {
        record_type: 'full',
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
    ensureSongsLoaded: () => calls.push('full'),
    ensureWorldsendSongsLoaded: () => calls.push('worldsend'),
  })

  // Then: 両方のマスタ取得が開始される。
  assert.deepEqual(calls, ['full', 'worldsend'])
})

test('commitRegisterScore: ユーザー名取得が完了しなくても登録結果を返す', async () => {
  // Given: 登録APIは成功するが、補助的なユーザー名取得が解決しない状態。
  const result = createPlayerDataResult()
  const neverResolveUsername = new Promise<string>(() => {})

  // When: スコア登録確定処理を実行する。
  const committed = await commitRegisterScore(
    { uploadToken: '11111111-1111-4111-8111-111111111111', currentUsername: null },
    {
      commitPlayerData: async () => result,
      fetchUsername: () => neverResolveUsername,
      ensureSongsLoaded: () => {},
      ensureWorldsendSongsLoaded: () => {},
    }
  )

  // Then: ユーザー名取得を待たずに結果表示へ進める。
  assert.deepEqual(committed.result, result)
  assert.ok(committed.usernamePromise)
})

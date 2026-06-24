import assert from 'node:assert/strict'
import test from 'node:test'
import type { WorldsendRecordDTO } from '../../../../types/api.ts'
import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger.ts'
import { MAX_SCORE } from '../../../../utils/scoreRank.ts'
import { getRecordStats } from '../../utils/recordStats'

/**
 * 統計テスト用のレコードを作成する。
 * @param overrides 上書きするレコード項目
 * @returns 楽曲メタ情報付きレコード
 */
const createRecord = (
  overrides: Partial<PlayerRecordWithSongMeta> = {}
): PlayerRecordWithSongMeta => ({
  is_played: true,
  is_op_target: true,
  updated_at: '2026-04-20T00:00:00Z',
  difficulty: 'MASTER',
  id: 'song-1',
  title: 'アルファ',
  reading: 'アルファ',
  artist: 'LeaF',
  const: 14.5,
  is_const_unknown: false,
  score: 1005000,
  rating: 16.5,
  overpower: 80,
  justice_count: null,
  overpower_percent: 91.42,
  img: 'image',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
  genre: 'POPS & ANIME',
  release: '2024-01-01',
  release_version: 'VERSE',
  notes: 2000,
  ...overrides,
})

test('getRecordStats は空配列の分布とスコア統計を0で返す', () => {
  const stats = getRecordStats([])

  assert.deepEqual(stats.rankDist, {})
  assert.deepEqual(stats.comboDist, {})
  assert.deepEqual(stats.clearDist, {})
  assert.deepEqual(stats.scoreStats, { min: 0, max: 0, avg: 0, median: 0, q1: 0, q3: 0 })
})

test('getRecordStats は未プレイを分布に含め、スコア統計から除外する', () => {
  const oneOfThreePercent = (1 / 3) * 100
  const stats = getRecordStats([
    createRecord({
      score: 1009000,
      combo_lamp: 'ALL JUSTICE',
      clear_lamp: 'CATASTROPHY',
    }),
    createRecord({
      id: 'song-2',
      score: 980000,
      combo_lamp: 'FULL COMBO',
      clear_lamp: 'HARD',
    }),
    createRecord({
      id: 'song-3',
      is_played: false,
      score: 0,
      combo_lamp: null,
      clear_lamp: null,
    }),
  ])

  assert.deepEqual(stats.rankDist, {
    'SSS+': { count: 1, percent: oneOfThreePercent },
    S: { count: 1, percent: oneOfThreePercent },
    未プレイ: { count: 1, percent: oneOfThreePercent },
  })
  assert.deepEqual(stats.comboDist, {
    'ALL JUSTICE': { count: 1, percent: oneOfThreePercent },
    'FULL COMBO': { count: 1, percent: oneOfThreePercent },
    未プレイ: { count: 1, percent: oneOfThreePercent },
  })
  assert.deepEqual(stats.clearDist, {
    CATASTROPHY: { count: 1, percent: oneOfThreePercent },
    HARD: { count: 1, percent: oneOfThreePercent },
    未プレイ: { count: 1, percent: oneOfThreePercent },
  })
  assert.deepEqual(stats.scoreStats, {
    min: 980000,
    max: 1009000,
    avg: 994500,
    median: 994500,
    q1: 980000,
    q3: 980000,
  })
})

test('getRecordStats はランプ未設定のプレイ済みを既定カテゴリに集計する', () => {
  const stats = getRecordStats([
    createRecord({
      score: 900000,
      combo_lamp: null,
      clear_lamp: null,
    }),
  ])

  assert.deepEqual(stats.rankDist, {
    OTHERS: { count: 1, percent: 100 },
  })
  assert.deepEqual(stats.comboDist, {
    なし: { count: 1, percent: 100 },
  })
  assert.deepEqual(stats.clearDist, {
    FAILED: { count: 1, percent: 100 },
  })
})

/**
 * 理論値(MAX_SCORE)とALL JUSTICE CRITICALが専用カテゴリへ集計されることを検証する。
 * @returns 分布アサーションのみを行うため戻り値はない。
 */
test('getRecordStats は理論値とALL JUSTICE CRITICALを専用カテゴリに集計する', () => {
  // Given
  const stats = getRecordStats([
    createRecord({ score: MAX_SCORE, combo_lamp: 'ALL JUSTICE' }),
    createRecord({ id: 'song-2', score: MAX_SCORE, combo_lamp: 'FULL COMBO' }),
    createRecord({ id: 'song-3', score: MAX_SCORE - 1, combo_lamp: 'ALL JUSTICE' }),
  ])

  // Then
  assert.deepEqual(stats.rankDist, {
    MAX: { count: 2, percent: (2 / 3) * 100 },
    'SSS+': { count: 1, percent: (1 / 3) * 100 },
  })
  assert.deepEqual(stats.comboDist, {
    'ALL JUSTICE CRITICAL': { count: 1, percent: (1 / 3) * 100 },
    'FULL COMBO': { count: 1, percent: (1 / 3) * 100 },
    'ALL JUSTICE': { count: 1, percent: (1 / 3) * 100 },
  })
})

test('getRecordStats は奇数件の四分位と中央値をスコア昇順で算出する', () => {
  const stats = getRecordStats([
    createRecord({ score: 1009000 }),
    createRecord({ id: 'song-2', score: 975000 }),
    createRecord({ id: 'song-3', score: 1005000 }),
    createRecord({ id: 'song-4', score: 1000000 }),
    createRecord({ id: 'song-5', score: 990000 }),
  ])

  assert.deepEqual(stats.scoreStats, {
    min: 975000,
    max: 1009000,
    avg: 995800,
    median: 1000000,
    q1: 990000,
    q3: 1005000,
  })
})

test("getRecordStats はWORLD'S ENDレコードも同じ集計ロジックで処理する", () => {
  // Given
  const records: WorldsendRecordDTO[] = [
    {
      id: 'we-1',
      title: "WORLD'S END 1",
      score: MAX_SCORE,
      justice_count: 0,
      is_played: true,
      clear_lamp: 'ABSOLUTE',
      combo_lamp: 'ALL JUSTICE',
      full_chain: null,
      updated_at: '2026-04-20T00:00:00Z',
      level_star: 5,
      attribute: '狂',
      notes: 1234,
      img: '/path/to/img.png',
    },
    {
      id: 'we-2',
      title: "WORLD'S END 2",
      score: 0,
      justice_count: null,
      is_played: false,
      clear_lamp: null,
      combo_lamp: null,
      full_chain: null,
      updated_at: '2026-04-20T00:00:00Z',
      level_star: 3,
      attribute: '改',
      notes: 1400,
      img: '/path/to/img.png',
    },
  ]

  // When
  const stats = getRecordStats(records)

  // Then
  assert.equal(stats.rankDist.MAX?.count, 1)
  assert.equal(stats.rankDist.未プレイ?.count, 1)
  assert.equal(stats.comboDist['ALL JUSTICE CRITICAL']?.count, 1)
  assert.equal(stats.comboDist.未プレイ?.count, 1)
})

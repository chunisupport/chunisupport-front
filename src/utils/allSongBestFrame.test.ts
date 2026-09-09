import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerDataDifficulty, PlayerRecordDTO } from '../types/api.ts'
import { buildAllSongBestFrame } from './allSongBestFrame.ts'

/**
 * 全曲ベスト枠テスト用の通常譜面レコードを生成する。
 *
 * @param overrides - 上書きするレコード項目。
 * @returns テスト用レコード。
 */
const createRecord = (overrides: Partial<PlayerRecordDTO> = {}): PlayerRecordDTO => ({
  is_played: true,
  is_op_target: false,
  updated_at: null,
  difficulty: 'MASTER',
  id: 'song',
  title: '曲',
  artist: 'アーティスト',
  const: 15,
  is_const_unknown: false,
  score: 1_000_000,
  rating: 16,
  overpower: 0,
  justice_count: null,
  overpower_percent: 0,
  img: '',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
  ...overrides,
})

/**
 * 連番のテスト用レコードを生成する。
 *
 * @param count - 生成件数。
 * @param build - インデックスから上書き項目を返す関数。
 * @returns テスト用レコード一覧。
 */
const createRecords = (
  count: number,
  build: (index: number) => Partial<PlayerRecordDTO>
): PlayerRecordDTO[] => Array.from({ length: count }, (_, index) => createRecord(build(index)))

test('未プレイを除き単曲レーティング降順の上位50曲を30曲と残りに分割すること', () => {
  // Given: 新曲・旧曲を含む51曲と未プレイ1曲。
  const records = [
    ...createRecords(51, (index) => ({
      id: `song-${String(index).padStart(2, '0')}`,
      rating: 16.5 - index * 0.01,
    })),
    createRecord({ id: 'unplayed', is_played: false, rating: 17 }),
  ]

  // When: 全曲ベスト枠を組み立てる。
  const result = buildAllSongBestFrame(records)

  // Then: 未プレイを除く上位30曲と31〜50曲が単曲レーティング順になる。
  assert.equal(result.primaryRecords.length, 30)
  assert.equal(result.remainingRecords.length, 20)
  assert.equal(result.primaryRecords[0]?.id, 'song-00')
  assert.equal(result.primaryRecords[29]?.id, 'song-29')
  assert.equal(result.remainingRecords[0]?.id, 'song-30')
  assert.equal(result.remainingRecords[19]?.id, 'song-49')
  assert.equal(
    result.primaryRecords.some((record) => record.id === 'unplayed'),
    false
  )
})

test('30曲平均と50曲平均を0.0001単位で返すこと', () => {
  // Given: 上位30曲が16.85、続く20曲が16.84の50曲。
  const records = [
    ...createRecords(30, (index) => ({ id: `high-${index}`, rating: 16.85 })),
    ...createRecords(20, (index) => ({ id: `low-${index}`, rating: 16.84 })),
  ]

  // When: 全曲ベスト枠を組み立てる。
  const result = buildAllSongBestFrame(records)

  // Then: 30曲平均は16.8500、50曲平均は16.8460になる。
  assert.equal(result.primaryAverage, 16.85)
  assert.equal(result.totalAverage, 16.846)
})

test('同率時は楽曲IDと難易度順で並べること', () => {
  // Given: 同じ単曲レーティングの3譜面。
  const records = [
    createRecord({ id: 'song-b', difficulty: 'MASTER', rating: 16.5 }),
    createRecord({ id: 'song-a', difficulty: 'ULTIMA', rating: 16.5 }),
    createRecord({ id: 'song-a', difficulty: 'MASTER', rating: 16.5 }),
  ]

  // When: 全曲ベスト枠を組み立てる。
  const result = buildAllSongBestFrame(records)

  // Then: 楽曲ID昇順、同一曲は難易度順になる。
  assert.deepEqual(
    result.primaryRecords.map((record) => `${record.id}:${record.difficulty}`),
    ['song-a:MASTER', 'song-a:ULTIMA', 'song-b:MASTER']
  )
})

test('対象が30曲未満のときは残り枠を空にし採用譜面数で平均すること', () => {
  // Given: プレイ済み2曲。
  const records = [
    createRecord({ id: 'song-a', rating: 16.85 }),
    createRecord({ id: 'song-b', rating: 16.84 }),
  ]

  // When: 全曲ベスト枠を組み立てる。
  const result = buildAllSongBestFrame(records)

  // Then: 2曲の平均を30曲平均・50曲平均の両方に使い、31曲目以降は空になる。
  assert.equal(result.primaryRecords.length, 2)
  assert.deepEqual(result.remainingRecords, [])
  assert.equal(result.primaryAverage, 16.845)
  assert.equal(result.totalAverage, 16.845)
})

test('未確定譜面定数を含む平均を区別すること', () => {
  // Given: 30曲目まで確定、31曲目以降に未確定定数がある50曲。
  const records = [
    ...createRecords(30, (index) => ({ id: `known-${index}`, rating: 16.8 })),
    ...createRecords(20, (index) => ({
      id: `unknown-${index}`,
      rating: 16.7,
      is_const_unknown: true,
    })),
  ]

  // When: 全曲ベスト枠を組み立てる。
  const result = buildAllSongBestFrame(records)

  // Then: 30曲平均は確定値、50曲平均だけ未確定を含む。
  assert.equal(result.primaryHasUnknownChartConstants, false)
  assert.equal(result.totalHasUnknownChartConstants, true)
})

test('プレイ済み譜面がない場合は平均もレコードも空であること', () => {
  // Given: 未プレイのみ。
  const records = [createRecord({ id: 'unplayed', is_played: false, rating: 16 })]

  // When: 全曲ベスト枠を組み立てる。
  const result = buildAllSongBestFrame(records)

  // Then: 平均は未計算、レコードは空になる。
  assert.equal(result.primaryAverage, null)
  assert.equal(result.totalAverage, null)
  assert.deepEqual(result.primaryRecords, [])
  assert.deepEqual(result.remainingRecords, [])
})

test('難易度比較時に小文字入力を大文字へ正規化すること', () => {
  // Given: 同じ曲の小文字難易度レコード。
  const records = [
    createRecord({
      id: 'song-a',
      difficulty: 'ultima' as PlayerDataDifficulty,
      rating: 16.5,
    }),
    createRecord({
      id: 'song-a',
      difficulty: 'master' as PlayerDataDifficulty,
      rating: 16.5,
    }),
  ]

  // When: 全曲ベスト枠を組み立てる。
  const result = buildAllSongBestFrame(records)

  // Then: 大文字化した難易度順でMASTERが先になる。
  assert.deepEqual(
    result.primaryRecords.map((record) => record.difficulty),
    ['master', 'ultima']
  )
})

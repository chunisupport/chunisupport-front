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
  // Given: 楽曲ID順とは異なる単曲レーティング順を持つ51曲と未プレイ1曲。
  const records = [
    ...createRecords(51, (index) => {
      const rank = (index * 17 + Math.floor(index / 3)) % 51
      return {
        id: `song-${String(index).padStart(2, '0')}`,
        rating: 16.5 - rank * 0.01,
      }
    }),
    createRecord({ id: 'unplayed', is_played: false, rating: 17 }),
  ]

  // When: 全曲ベスト枠を組み立てる。
  const result = buildAllSongBestFrame(records)

  // Then: 未プレイを除く上位30曲と31〜50曲が単曲レーティング順になる。
  assert.equal(result.primaryRecords.length, 30)
  assert.equal(result.remainingRecords.length, 20)
  assert.deepEqual(
    result.primaryRecords.map((record) => record.id),
    [
      'song-00',
      'song-03',
      'song-06',
      'song-09',
      'song-12',
      'song-15',
      'song-18',
      'song-21',
      'song-24',
      'song-27',
      'song-30',
      'song-33',
      'song-36',
      'song-39',
      'song-42',
      'song-45',
      'song-48',
      'song-01',
      'song-04',
      'song-07',
      'song-10',
      'song-13',
      'song-16',
      'song-19',
      'song-22',
      'song-25',
      'song-28',
      'song-31',
      'song-34',
      'song-37',
    ]
  )
  assert.deepEqual(
    result.remainingRecords.map((record) => record.id),
    [
      'song-40',
      'song-43',
      'song-46',
      'song-49',
      'song-02',
      'song-05',
      'song-08',
      'song-11',
      'song-14',
      'song-17',
      'song-20',
      'song-23',
      'song-26',
      'song-29',
      'song-32',
      'song-35',
      'song-38',
      'song-41',
      'song-44',
      'song-47',
    ]
  )
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

test('定数15.0相当29曲と定数14.9相当1曲の平均は小数第4位で切り捨てること', () => {
  // Given: 単曲レーティング17.15が29曲、17.05が1曲。定数15.0と14.9のMASTER理論値に相当する。
  const records = [
    ...createRecords(29, (index) => ({ id: `high-${index}`, rating: 17.15 })),
    createRecord({ id: 'low', rating: 17.05 }),
  ]

  // When: 全曲ベスト枠を組み立てる。
  const result = buildAllSongBestFrame(records)

  // Then: (17.15×29 + 17.05) / 30 を小数第4位で切り捨てた17.1466になる。
  assert.equal(result.primaryAverage, 17.1466)
  assert.equal(result.totalAverage, 17.1466)
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

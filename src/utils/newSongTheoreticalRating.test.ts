import assert from 'node:assert/strict'
import test from 'node:test'
import type { SongDTO } from '../types/api.ts'
import { calculateCandidateScoreDifference } from './candidateScoreDifference.ts'
import {
  calculateNewSongTheoreticalRating,
  calculateNewSongTheoreticalRatingGap,
  resolveNewSongTheoreticalRatingProgress,
} from './newSongTheoreticalRating.ts'
import { formatScoreDifference } from './scoreDifference.ts'

/**
 * 理論値計算テスト用の楽曲を生成する。
 *
 * @param id - 楽曲ID。
 * @param release - 楽曲のリリース日。
 * @param chartConstants - BASICから難易度順に登録する譜面定数一覧。
 * @param isNew - 直近追加曲フラグ。
 * @returns 理論値計算に必要な項目を持つ楽曲。
 */
const createSong = (
  id: string,
  release: string,
  chartConstants: ReadonlyArray<{ value: number; unknown?: boolean }>,
  isNew = false
): SongDTO => ({
  id,
  title: id,
  reading: null,
  artist: 'artist',
  genre: 'POPS & ANIME',
  bpm: null,
  release,
  jacket: null,
  maxop: 0,
  is_maxop_unknown: false,
  op_target_difficulty: null,
  is_new: isNew,
  charts: Object.fromEntries(
    chartConstants.map((chart, index) => [
      ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'][index],
      { const: chart.value, is_const_unknown: chart.unknown ?? false, notes: null },
    ])
  ),
})

/** 過去・将来・現行の順序が混在するテスト用バージョン一覧。 */
const CURRENT_VERSIONS = [
  { released_at: '2025-12-11' },
  { released_at: '2027-01-01' },
  { released_at: '2026-07-02' },
] as const
/** 将来マスタを除外するためのテスト基準日。 */
const CURRENT_DATE = '2026-08-08'

test('全新曲譜面の単曲理論値から上位20件の平均を返すこと', () => {
  // Given: 現行バージョンの新曲21譜面と、より高い譜面定数を持つ旧曲1譜面。
  const songs = [
    ...Array.from({ length: 21 }, (_, index) =>
      createSong(`new-${index}`, '2026-07-02', [{ value: 13 + index / 10 }])
    ),
    createSong('old', '2026-07-01', [{ value: 16 }], true),
    createSong('future', '2026-08-09', [{ value: 16 }]),
  ]

  // When: 20枠分の新曲枠理論値を算出する。
  const result = calculateNewSongTheoreticalRating(songs, CURRENT_VERSIONS, CURRENT_DATE, 20)

  // Then: 旧曲と最も低い新曲を除いた上位20譜面の理論値平均になる。
  assert.equal(result?.rating, 16.2)
  assert.equal(result?.hasUnknownChartConstants, false)
  assert.deepEqual(
    result?.entries.map((entry) => entry.songId),
    Array.from({ length: 20 }, (_, index) => `new-${20 - index}`)
  )
})

test('規定枠数未満の新曲譜面は採用した譜面数で平均すること', () => {
  // Given: 定数15.0の新曲譜面が1件だけ存在する。
  const songs = [createSong('new', '2026-07-02', [{ value: 15 }])]

  // When: 20枠分の新曲枠理論値を算出する。
  const result = calculateNewSongTheoreticalRating(songs, CURRENT_VERSIONS, CURRENT_DATE, 20)

  // Then: API側の新曲枠平均と同じく、採用した1譜面で平均する。
  assert.equal(result?.rating, 17.15)
  assert.equal(result?.hasUnknownChartConstants, false)
  assert.equal(result?.entries.length, 1)
})

test('譜面定数15.05の表示レーティングと候補スコア計算が一致すること', () => {
  // Given: APIから小数第2位を含む譜面定数15.05が返る新曲譜面。
  const songs = [createSong('new', '2026-07-02', [{ value: 15.05 }])]

  // When: SSS+到達時のレーティングと、その1点手前から必要なスコア差を算出する。
  const result = calculateNewSongTheoreticalRating(songs, CURRENT_VERSIONS, CURRENT_DATE, 1)
  const scoreDifference = calculateCandidateScoreDifference(
    1_008_999,
    15.05,
    result?.entries[0]?.rating ?? 0
  )

  // Then: 共有計算と同じ17.25を表示し、SSS+到達にはあと1点と判定する。
  assert.equal(result?.entries[0]?.rating, 17.25)
  assert.equal(scoreDifference, -1)
})

test('同率譜面はAPIの楽曲配列順にかかわらず楽曲IDと難易度順で採用すること', () => {
  // Given: 同じ理論単曲レーティングの譜面が規定枠数を超えて存在する。
  const songA = createSong('song-a', '2026-07-02', [{ value: 15, unknown: true }, { value: 15 }])
  const songB = createSong('song-b', '2026-07-02', [{ value: 15 }])

  // When: APIの楽曲配列順を入れ替えて2枠分の理論値を算出する。
  const forwardResult = calculateNewSongTheoreticalRating(
    [songA, songB],
    CURRENT_VERSIONS,
    CURRENT_DATE,
    2
  )
  const reverseResult = calculateNewSongTheoreticalRating(
    [songB, songA],
    CURRENT_VERSIONS,
    CURRENT_DATE,
    2
  )

  // Then: どちらも楽曲IDと難易度順で同じ譜面を採用し、推定値状態も一致する。
  assert.deepEqual(reverseResult, forwardResult)
  assert.deepEqual(
    forwardResult?.entries.map((entry) => [entry.songId, entry.difficulty]),
    [
      ['song-a', 'BASIC'],
      ['song-a', 'ADVANCED'],
    ]
  )
  assert.equal(forwardResult?.hasUnknownChartConstants, true)
})

test('上位枠に推定譜面定数が含まれることを返すこと', () => {
  // Given: 推定譜面定数を持つ譜面が理論値上位に入る新曲。
  const songs = [createSong('new', '2026-07-02', [{ value: 15, unknown: true }, { value: 14 }])]

  // When: 1枠分の新曲枠理論値を算出する。
  const result = calculateNewSongTheoreticalRating(songs, CURRENT_VERSIONS, CURRENT_DATE, 1)

  // Then: 理論値と推定値フラグを返す。
  assert.equal(result?.rating, 17.15)
  assert.equal(result?.hasUnknownChartConstants, true)
  assert.deepEqual(result?.entries[0], {
    songId: 'new',
    title: 'new',
    artist: 'artist',
    difficulty: 'BASIC',
    chartConstant: 15,
    isChartConstantUnknown: true,
    rating: 17.15,
  })
})

test('新曲譜面がない場合は理論値を返さないこと', () => {
  // Given: 旧曲だけが存在する。
  const songs = [createSong('old', '2026-07-01', [{ value: 15 }], true)]

  // When: 新曲枠理論値を算出する。
  const result = calculateNewSongTheoreticalRating(songs, CURRENT_VERSIONS, CURRENT_DATE, 20)

  // Then: 理論値は未定義になる。
  assert.equal(result, undefined)
})

test('APIが存在しない難易度をnullで返しても理論値計算から除外すること', () => {
  // Given: 譜面が存在しない難易度をnullで含む新曲。
  const song = createSong('new', '2026-07-02', [{ value: 15 }])
  song.charts.ULTIMA = null

  // When: 新曲枠理論値を算出する。
  const result = calculateNewSongTheoreticalRating([song], CURRENT_VERSIONS, CURRENT_DATE, 1)

  // Then: nullを除外し、存在する譜面だけから理論値を返す。
  assert.equal(result?.rating, 17.15)
  assert.equal(result?.hasUnknownChartConstants, false)
  assert.equal(result?.entries.length, 1)
})

test('SSS+対象譜面の現在スコアとSSS+ボーダーとの差を返すこと', () => {
  // Given: 同じ譜面が現在の新曲枠と候補枠の両方に存在する。
  const entry = { songId: 'song', difficulty: 'MASTER' } as const
  const currentRecords = [{ id: 'song', difficulty: 'MASTER', score: 1_009_000 }] as const
  const candidateRecords = [{ id: 'song', difficulty: 'MASTER', score: 1_008_000 }] as const

  // When: 理論値対象譜面の進捗を解決する。
  const result = resolveNewSongTheoreticalRatingProgress(entry, currentRecords, candidateRecords)

  // Then: 現在の新曲枠を優先し、SSS+到達済みの差を0で返す。
  assert.deepEqual(result, {
    slot: 'new',
    currentScore: 1_009_000,
    scoreGap: 0,
  })
})

test('現在の新曲枠にない理論値対象譜面は候補枠のスコアを返すこと', () => {
  // Given: 理論値対象譜面が候補枠だけに存在する。
  const entry = { songId: 'song', difficulty: 'MASTER' } as const
  const candidateRecords = [{ id: 'song', difficulty: 'MASTER', score: 1_008_000 }] as const

  // When: 理論値対象譜面の進捗を解決する。
  const result = resolveNewSongTheoreticalRatingProgress(entry, [], candidateRecords)

  // Then: 候補枠の現在スコアとSSS+までの不足分を負数で返す。
  assert.deepEqual(result, {
    slot: 'new_candidate',
    currentScore: 1_008_000,
    scoreGap: -1_000,
  })
  assert.equal(formatScoreDifference(result.scoreGap ?? 0), '-1,000')
})

test('理論値対象譜面のレコードがない場合はスコア進捗を返さないこと', () => {
  // Given: 理論値対象譜面に対応する現在レコードがない。
  const entry = { songId: 'song', difficulty: 'MASTER' } as const

  // When: 理論値対象譜面の進捗を解決する。
  const result = resolveNewSongTheoreticalRatingProgress(entry, [], [])

  // Then: 現在スコアと差分は未計算になる。
  assert.deepEqual(result, {
    slot: null,
    currentScore: null,
    scoreGap: null,
  })
})

test('現在値との差を小数点以下4桁単位で正確に返すこと', () => {
  // Given: 理論値と現在値に浮動小数点誤差が起きうる値を指定する。
  const theoreticalRating = 17.5005
  const currentRating = 17.1604

  // When: 理論値と現在値の差を算出する。
  const result = calculateNewSongTheoreticalRatingGap(theoreticalRating, currentRating)

  // Then: 表示精度と同じ4桁単位で差を返す。
  assert.equal(result, 0.3401)
})

test('現在値が未計算の場合は差を返さないこと', () => {
  // Given: 新曲枠の現在値が未計算。
  const currentRating = null

  // When: 理論値との差を算出する。
  const result = calculateNewSongTheoreticalRatingGap(17.5, currentRating)

  // Then: 差は未定義になる。
  assert.equal(result, undefined)
})

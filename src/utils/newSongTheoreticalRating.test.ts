import assert from 'node:assert/strict'
import test from 'node:test'
import type { SongDTO } from '../types/api.ts'
import { calculateCandidateScoreDifference } from './candidateScoreDifference.ts'
import {
  calculateBestTheoreticalRating,
  calculateNewSongTheoreticalRating,
  calculateOverallTheoreticalRating,
  calculateRatingTheoreticalGap,
  prioritizeBoundaryEntries,
  resolveRatingTheoreticalProgress,
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
  unlock_required: false,
  charts: Object.fromEntries(
    chartConstants.map((chart, index) => [
      ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'][index],
      { const: chart.value, is_const_unknown: chart.unknown ?? false, notes: null },
    ])
  ),
})

/** 過去・将来・現行の順序が混在するテスト用バージョン一覧 */
const CURRENT_VERSIONS = [
  { released_at: '2025-12-11' },
  { released_at: '2027-01-01' },
  { released_at: '2026-07-02' },
] as const
/** 将来マスタを除外するためのテスト基準日 */
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

test('現行バージョンより前の全譜面からベスト枠上位30件を返すこと', () => {
  // Given: 旧曲31譜面と、それらより定数が高い現行バージョン楽曲および未配信楽曲。
  const songs = [
    ...Array.from({ length: 31 }, (_, index) =>
      createSong(`old-${index}`, '2026-07-01', [{ value: 13 + index / 10, unknown: index === 30 }])
    ),
    createSong('current-version', '2026-07-02', [{ value: 16 }]),
    createSong('future', '2026-08-09', [{ value: 16 }]),
  ]

  // When: 基準日時点のベスト枠30枠分の理論値を算出する。
  const result = calculateBestTheoreticalRating(songs, CURRENT_VERSIONS, CURRENT_DATE, 30)

  // Then: 現行バージョン以降の譜面と最下位譜面を除き、未確定定数を含む上位30譜面を返す。
  assert.equal(result?.entries.length, 30)
  assert.equal(
    result?.entries.some((entry) => entry.songId === 'future'),
    false
  )
  assert.equal(
    result?.entries.some((entry) => entry.songId === 'current-version'),
    false
  )
  assert.equal(
    result?.entries.some((entry) => entry.songId === 'old-0'),
    false
  )
  assert.equal(result?.hasUnknownChartConstants, true)
})

test('is_newではなく現行バージョン開始日でベスト枠を判定すること', () => {
  // Given: is_newがtrueの旧曲と、is_newがfalseの現行バージョン楽曲。
  const songs = [
    createSong('recent-update-old-song', '2026-07-01', [{ value: 15 }], true),
    createSong('current-version-song', '2026-07-02', [{ value: 16 }], false),
  ]

  // When: ベスト枠1枠分の理論値を算出する。
  const result = calculateBestTheoreticalRating(songs, CURRENT_VERSIONS, CURRENT_DATE, 1)

  // Then: is_newにかかわらず、現行バージョン開始日より前の楽曲だけが採用される。
  assert.deepEqual(
    result?.entries.map((entry) => entry.songId),
    ['recent-update-old-song']
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
  const result = resolveRatingTheoreticalProgress(entry, currentRecords, candidateRecords)

  // Then: 現在の新曲枠を優先し、SSS+到達済みの差は返さない。
  assert.deepEqual(result, {
    slot: 'current',
    currentScore: 1_009_000,
    scoreGap: null,
  })
})

test('現在の新曲枠にない理論値対象譜面は候補枠のスコアを返すこと', () => {
  // Given: 理論値対象譜面が候補枠だけに存在する。
  const entry = { songId: 'song', difficulty: 'MASTER' } as const
  const candidateRecords = [{ id: 'song', difficulty: 'MASTER', score: 1_008_000 }] as const

  // When: 理論値対象譜面の進捗を解決する。
  const result = resolveRatingTheoreticalProgress(entry, [], candidateRecords)

  // Then: 候補枠の現在スコアとSSS+までの不足分を負数で返す。
  assert.deepEqual(result, {
    slot: 'candidate',
    currentScore: 1_008_000,
    scoreGap: -1_000,
  })
  assert.equal(formatScoreDifference(result.scoreGap ?? 0), '-1,000')
})

test('理論値対象譜面のレコードがない場合はスコア進捗を返さないこと', () => {
  // Given: 理論値対象譜面に対応する現在レコードがない。
  const entry = { songId: 'song', difficulty: 'MASTER' } as const

  // When: 理論値対象譜面の進捗を解決する。
  const result = resolveRatingTheoreticalProgress(entry, [], [])

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
  const result = calculateRatingTheoreticalGap(theoreticalRating, currentRating)

  // Then: 表示精度と同じ4桁単位で差を返す。
  assert.equal(result, 0.3401)
})

test('現在値が未計算の場合は差を返さないこと', () => {
  // Given: 新曲枠の現在値が未計算。
  const currentRating = null

  // When: 理論値との差を算出する。
  const result = calculateRatingTheoreticalGap(17.5, currentRating)

  // Then: 差は未定義になる。
  assert.equal(result, undefined)
})

/**
 * 総合理論値テスト用に、指定枠数の同一譜面から成る枠理論値を生成する。
 *
 * @param rating - 枠理論値。
 * @param count - 採用譜面数。
 * @param hasUnknownChartConstants - 推定譜面定数を含むか。
 * @returns 枠理論値。
 */
const createFrameTheoretical = (
  rating: number,
  count: number,
  hasUnknownChartConstants = false
) => ({
  rating,
  hasUnknownChartConstants,
  entries: Array.from({ length: count }, (_, index) => ({
    songId: `song-${rating}-${index}`,
    title: 'title',
    artist: 'artist',
    difficulty: 'MASTER' as const,
    chartConstant: 15,
    isChartConstantUnknown: hasUnknownChartConstants,
    rating,
  })),
  boundaryEntries: [],
})

test('ベスト枠と新曲枠の単曲レーティング合計を50枠で割った総合理論値を返すこと', () => {
  // Given: ベスト30譜面と新曲20譜面の枠理論値。
  const best = createFrameTheoretical(17, 30)
  const newSong = createFrameTheoretical(18, 20, true)

  // When: 総合理論値を算出する。
  const result = calculateOverallTheoreticalRating(best, newSong)

  // Then: (17*30 + 18*20) / 50 = 17.4 になり、推定値フラグを引き継ぐ。
  assert.equal(result?.rating, 17.4)
  assert.equal(result?.hasUnknownChartConstants, true)
  assert.equal(result?.entries.length, 50)
})

test('新曲枠が規定枠数未満の場合も空き枠を0として50枠で割ること', () => {
  // Given: ベスト30譜面と、新曲枠に1譜面だけ採用された枠理論値。
  const best = createFrameTheoretical(17.5, 30)
  const newSong = createFrameTheoretical(17.15, 1)

  // When: 総合理論値を算出する。
  const result = calculateOverallTheoreticalRating(best, newSong)

  // Then: (17.5*30 + 17.15) / 50 = 10.843 になる。
  assert.equal(result?.rating, 10.843)
  assert.equal(result?.entries.length, 31)
})

test('片方の枠理論値のみ計算済みの場合は未計算の枠を0として50枠で割ること', () => {
  // Given: ベスト枠のみ計算済み。
  const best = createFrameTheoretical(17, 30)

  // When: 総合理論値を算出する。
  const result = calculateOverallTheoreticalRating(best, undefined)

  // Then: 17*30 / 50 = 10.2 になる。
  assert.equal(result?.rating, 10.2)
})

test('両枠とも未計算の場合は総合理論値を返さないこと', () => {
  // Given & When: どちらの枠理論値も未定義。
  const result = calculateOverallTheoreticalRating(undefined, undefined)

  // Then: 未定義になる。
  assert.equal(result, undefined)
})

test('採用譜面の下限定数と同じ定数で枠から溢れた譜面を枠外譜面として返すこと', () => {
  // Given: 定数16.0の1譜面と、下限定数15.0の3譜面、さらに低い定数14.0の1譜面。
  const songs = [
    createSong('top', '2026-07-02', [{ value: 16 }]),
    createSong('tie-a', '2026-07-02', [{ value: 15 }]),
    createSong('tie-b', '2026-07-02', [{ value: 15 }]),
    createSong('tie-c', '2026-07-02', [{ value: 15 }]),
    createSong('low', '2026-07-02', [{ value: 14 }]),
  ]

  // When: 2枠分の新曲枠理論値を算出する。
  const result = calculateNewSongTheoreticalRating(songs, CURRENT_VERSIONS, CURRENT_DATE, 2)

  // Then: 下限定数15.0で枠から溢れた2譜面だけが枠外譜面になる。
  assert.deepEqual(
    result?.entries.map((entry) => entry.songId),
    ['top', 'tie-a']
  )
  assert.deepEqual(
    result?.boundaryEntries.map((entry) => entry.songId),
    ['tie-b', 'tie-c']
  )
})

test('採用譜面が規定枠数未満の場合は枠外譜面を返さないこと', () => {
  // Given: 同じ定数の新曲譜面が2件だけ存在する。
  const songs = [
    createSong('new-a', '2026-07-02', [{ value: 15 }]),
    createSong('new-b', '2026-07-02', [{ value: 15 }]),
  ]

  // When: 20枠分の新曲枠理論値を算出する。
  const result = calculateNewSongTheoreticalRating(songs, CURRENT_VERSIONS, CURRENT_DATE, 20)

  // Then: 全譜面が採用され、枠外譜面は空になる。
  assert.equal(result?.entries.length, 2)
  assert.deepEqual(result?.boundaryEntries, [])
})

test('下限定数の譜面のうち優先譜面を採用枠側へ並べ替えること', () => {
  // Given: 上位1譜面と下限定数15.0の4譜面のうち、枠外のtie-cとtie-dが優先対象。
  const songs = [
    createSong('top', '2026-07-02', [{ value: 16 }]),
    createSong('tie-a', '2026-07-02', [{ value: 15 }]),
    createSong('tie-b', '2026-07-02', [{ value: 15 }]),
    createSong('tie-c', '2026-07-02', [{ value: 15 }]),
    createSong('tie-d', '2026-07-02', [{ value: 15 }]),
  ]
  const result = calculateNewSongTheoreticalRating(songs, CURRENT_VERSIONS, CURRENT_DATE, 2)
  assert.ok(result)
  const prioritizedIds = new Set(['top', 'tie-c', 'tie-d'])

  // When: 優先対象を上側へ並べ替える。
  const prioritized = prioritizeBoundaryEntries(result, (entry) => prioritizedIds.has(entry.songId))

  // Then: 上位譜面は維持し、下限定数の優先譜面が採用枠と枠外譜面の先頭に並ぶ。
  assert.deepEqual(
    prioritized.entries.map((entry) => entry.songId),
    ['top', 'tie-c']
  )
  assert.deepEqual(
    prioritized.boundaryEntries.map((entry) => entry.songId),
    ['tie-d', 'tie-a', 'tie-b']
  )
})

test('枠外譜面がない場合は並べ替えずにそのまま返すこと', () => {
  // Given: 枠外譜面を持たない枠理論値。
  const theoretical = createFrameTheoretical(17, 3)

  // When: 全譜面を優先対象として並べ替える。
  const prioritized = prioritizeBoundaryEntries(theoretical, () => true)

  // Then: 採用譜面の順序は変わらない。
  assert.deepEqual(prioritized.entries, theoretical.entries)
  assert.deepEqual(prioritized.boundaryEntries, [])
})

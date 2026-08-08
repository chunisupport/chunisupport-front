import assert from 'node:assert/strict'
import test from 'node:test'
import type { SongDTO } from '../types/api.ts'
import {
  calculateNewSongTheoreticalRating,
  calculateNewSongTheoreticalRatingGap,
} from './newSongTheoreticalRating.ts'

/**
 * 理論値計算テスト用の楽曲を生成する。
 *
 * @param id - 楽曲ID。
 * @param isNew - 新曲枠対象かどうか。
 * @param chartConstants - BASICから難易度順に登録する譜面定数一覧。
 * @returns 理論値計算に必要な項目を持つ楽曲。
 */
const createSong = (
  id: string,
  isNew: boolean,
  chartConstants: ReadonlyArray<{ value: number; unknown?: boolean }>
): SongDTO => ({
  id,
  title: id,
  reading: null,
  artist: 'artist',
  genre: 'POPS & ANIME',
  bpm: null,
  release: null,
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

test('全新曲譜面の単曲理論値から上位20件の平均を返すこと', () => {
  // Given: 新曲21譜面と、より高い譜面定数を持つ旧曲1譜面。
  const songs = [
    ...Array.from({ length: 21 }, (_, index) =>
      createSong(`new-${index}`, true, [{ value: 13 + index / 10 }])
    ),
    createSong('old', false, [{ value: 16 }]),
  ]

  // When: 20枠分の新曲枠理論値を算出する。
  const result = calculateNewSongTheoreticalRating(songs, 20)

  // Then: 旧曲と最も低い新曲を除いた上位20譜面の理論値平均になる。
  assert.equal(result?.rating, 16.2)
  assert.equal(result?.hasUnknownChartConstants, false)
  assert.deepEqual(
    result?.entries.map((entry) => entry.songId),
    Array.from({ length: 20 }, (_, index) => `new-${20 - index}`)
  )
})

test('規定枠数未満の新曲譜面は空き枠を0として平均すること', () => {
  // Given: 定数15.0の新曲譜面が1件だけ存在する。
  const songs = [createSong('new', true, [{ value: 15 }])]

  // When: 20枠分の新曲枠理論値を算出する。
  const result = calculateNewSongTheoreticalRating(songs, 20)

  // Then: 単曲理論値17.15を20枠で割った値になる。
  assert.equal(result?.rating, 0.8575)
  assert.equal(result?.hasUnknownChartConstants, false)
  assert.equal(result?.entries.length, 1)
})

test('同率譜面はAPIの楽曲配列順にかかわらず楽曲IDと難易度順で採用すること', () => {
  // Given: 同じ理論単曲レーティングの譜面が規定枠数を超えて存在する。
  const songA = createSong('song-a', true, [{ value: 15, unknown: true }, { value: 15 }])
  const songB = createSong('song-b', true, [{ value: 15 }])

  // When: APIの楽曲配列順を入れ替えて2枠分の理論値を算出する。
  const forwardResult = calculateNewSongTheoreticalRating([songA, songB], 2)
  const reverseResult = calculateNewSongTheoreticalRating([songB, songA], 2)

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
  const songs = [createSong('new', true, [{ value: 15, unknown: true }, { value: 14 }])]

  // When: 1枠分の新曲枠理論値を算出する。
  const result = calculateNewSongTheoreticalRating(songs, 1)

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
  const songs = [createSong('old', false, [{ value: 15 }])]

  // When: 新曲枠理論値を算出する。
  const result = calculateNewSongTheoreticalRating(songs, 20)

  // Then: 理論値は未定義になる。
  assert.equal(result, undefined)
})

test('APIが存在しない難易度をnullで返しても理論値計算から除外すること', () => {
  // Given: 譜面が存在しない難易度をnullで含む新曲。
  const song = createSong('new', true, [{ value: 15 }])
  song.charts.ULTIMA = null

  // When: 新曲枠理論値を算出する。
  const result = calculateNewSongTheoreticalRating([song], 1)

  // Then: nullを除外し、存在する譜面だけから理論値を返す。
  assert.equal(result?.rating, 17.15)
  assert.equal(result?.hasUnknownChartConstants, false)
  assert.equal(result?.entries.length, 1)
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

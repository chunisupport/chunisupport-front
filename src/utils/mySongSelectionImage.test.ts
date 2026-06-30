import assert from 'node:assert/strict'
import test from 'node:test'
import type { SongDTO } from '../types/api'
import {
  formatMySongSelectionChartConstant,
  limitMySongSelectionCandidates,
  resolveMySongSelectionChart,
} from './mySongSelectionImage'

const baseSong: SongDTO = {
  id: 'song-1',
  title: 'テスト楽曲',
  reading: null,
  artist: 'テストアーティスト',
  genre: 'POPS&ANIME',
  bpm: 180,
  release: null,
  jacket: null,
  maxop: 0,
  is_maxop_unknown: false,
  op_target_difficulty: 'MASTER',
  is_new: false,
  charts: {
    MASTER: {
      const: 14.4,
      is_const_unknown: false,
      notes: 1200,
    },
  },
}

test('指定した難易度の譜面が存在する場合は譜面情報を返すこと', () => {
  // Given: MASTER譜面だけを持つ楽曲
  const song = baseSong

  // When: MASTER譜面を解決する
  const result = resolveMySongSelectionChart(song, 'MASTER')

  // Then: 対象難易度と譜面情報が返る
  assert.equal(result?.difficulty, 'MASTER')
  assert.equal(result?.chart.const, 14.4)
})

test('指定した難易度の譜面が存在しない場合はnullを返すこと', () => {
  // Given: MASTER譜面だけを持つ楽曲
  const song = baseSong

  // When: ULTIMA譜面を解決する
  const result = resolveMySongSelectionChart(song, 'ULTIMA')

  // Then: 譜面なしとしてnullになる
  assert.equal(result, null)
})

test('譜面定数が既知の場合は小数1桁で表示すること', () => {
  // Given: 定数が既知の譜面
  const chart = baseSong.charts.MASTER
  assert.ok(chart)

  // When: 表示用の定数に変換する
  const result = formatMySongSelectionChartConstant(chart, '不明')

  // Then: 小数1桁の文字列になる
  assert.equal(result, '14.4')
})

test('譜面定数が不明の場合は不明ラベルを表示すること', () => {
  // Given: 定数不明の譜面
  const chart = {
    const: 0,
    is_const_unknown: true,
    notes: null,
  }

  // When: 表示用の定数に変換する
  const result = formatMySongSelectionChartConstant(chart, '不明')

  // Then: 不明ラベルになる
  assert.equal(result, '不明')
})

test('選曲候補は指定件数までに制限されること', () => {
  // Given: 5件の候補
  const songs = [1, 2, 3, 4, 5]

  // When: 3件までに制限する
  const result = limitMySongSelectionCandidates(songs, 3)

  // Then: 先頭3件だけが返る
  assert.deepEqual(result, [1, 2, 3])
})

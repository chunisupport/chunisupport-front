import assert from 'node:assert/strict'
import test from 'node:test'

import type { WorldsendSongDTO } from '../../types/api.ts'
import { decodeWorldsendDisplayIdParam } from './WorldsendSongDetail/worldsendRouteParams.ts'
import {
  getWorldsendChartRows,
  getWorldsendSongInfoItems,
  getWorldsendTitleMeta,
} from './worldsendDetailModel.ts'

const createSong = (overrides: Partial<WorldsendSongDTO> = {}): WorldsendSongDTO => ({
  id: '123',
  title: "WORLD'S END Song",
  artist: 'Artist',
  genre: 'VARIETY',
  bpm: 180,
  release: '2024-01-15',
  official_idx: '123',
  jacket: 'jacket-file',
  charts: {
    WORLDSEND: {
      attribute: '狂',
      level_star: 5,
      notes: 2000,
    },
  },
  ...overrides,
})

test("WORLD'S END詳細の楽曲情報は通常譜面ページと同じ基本項目に公式IDを加える", () => {
  const song = createSong()

  assert.deepEqual(getWorldsendSongInfoItems(song), [
    { label: 'ジャンル', value: 'VARIETY' },
    { label: 'BPM', value: 180 },
    { label: 'リリース日', value: '2024-01-15' },
    { label: '公式ID', value: '123' },
  ])
})

test("WORLD'S END譜面行は属性・レベル・ノーツ数を表示用に整形する", () => {
  const song = createSong()

  assert.deepEqual(getWorldsendChartRows(song), [
    {
      label: "WORLD'S END",
      attribute: '狂',
      level: '★5',
      notes: 2000,
    },
  ])
})

test("WORLD'S END譜面情報が欠けている場合はプレースホルダを返す", () => {
  const song = createSong({
    genre: '',
    release: '   ',
    official_idx: '',
    charts: {
      WORLDSEND: {
        attribute: null,
        level_star: null,
        notes: null,
      },
    },
  })

  assert.deepEqual(getWorldsendSongInfoItems(song), [
    { label: 'ジャンル', value: '-' },
    { label: 'BPM', value: 180 },
    { label: 'リリース日', value: '-' },
    { label: '公式ID', value: '-' },
  ])
  assert.deepEqual(getWorldsendChartRows(song), [
    {
      label: "WORLD'S END",
      attribute: '-',
      level: '-',
      notes: '-',
    },
  ])
})
test('タイトルメタ情報はアーティスト不在でも安全に組み立てる', () => {
  const song = createSong({ artist: '' })

  assert.deepEqual(getWorldsendTitleMeta(song), {
    title: "WORLD'S END Song",
    artist: '-',
  })
})

test('ルートパラメータのdisplay idはAPIに渡す前にデコードする', () => {
  assert.equal(decodeWorldsendDisplayIdParam('A%2FB%20C'), 'A/B C')
})

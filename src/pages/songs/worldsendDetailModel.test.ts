import assert from 'node:assert/strict'
import test from 'node:test'

import type { WorldsendSongDTO } from '../../types/api.ts'
import {
  decodeWorldsendDisplayIdParam,
  getWorldsendDisplayIdSource,
} from './WorldsendSongDetail/worldsendRouteParams.ts'
import {
  getWorldsendChartRows,
  getWorldsendSongInfoItems,
  getWorldsendTitleMeta,
} from './worldsendDetailModel.ts'

const createSong = (overrides: Partial<WorldsendSongDTO> = {}): WorldsendSongDTO => ({
  id: '123',
  title: "WORLD'S END Song",
  reading: null,
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
      notes_designer: '譜面作者A',
    },
  },
  ...overrides,
})

test("WORLD'S END詳細の楽曲情報はSTANDARDページと同じ基本項目を表示する", () => {
  const song = createSong()

  assert.deepEqual(getWorldsendSongInfoItems(song, 'VERSE'), [
    { label: 'GENRE', value: 'VARIETY' },
    { label: 'BPM', value: 180 },
    { label: 'RELEASE', value: '2024-01-15' },
    { label: 'VERSION', value: 'VERSE' },
  ])
})

test("WORLD'S END譜面行は属性・レベル・ノーツ数・譜面作者を表示用に整形する", () => {
  const song = createSong()

  assert.deepEqual(getWorldsendChartRows(song), [
    {
      label: "WORLD'S END",
      attribute: '狂',
      level: '★5',
      notes: 2000,
      notesDesigner: '譜面作者A',
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
        notes_designer: null,
      },
    },
  })

  assert.deepEqual(getWorldsendSongInfoItems(song, ''), [
    { label: 'GENRE', value: '-' },
    { label: 'BPM', value: 180 },
    { label: 'RELEASE', value: '-' },
    { label: 'VERSION', value: '-' },
  ])
  assert.deepEqual(getWorldsendChartRows(song), [
    {
      label: "WORLD'S END",
      attribute: '-',
      level: '-',
      notes: '-',
      notesDesigner: '-',
    },
  ])
})

test('タイトルメタ情報はアーティスト未設定でも安全に整形する', () => {
  const song = createSong({ artist: '' })

  assert.deepEqual(getWorldsendTitleMeta(song), {
    title: "WORLD'S END Song",
    artist: '-',
  })
})

test('ルートパラメータのdisplay idはAPIに渡す前にデコードする', () => {
  assert.equal(decodeWorldsendDisplayIdParam('A%2FB%20C'), 'A/B C')
})

test('空のdisplay idはリソース取得を開始しないためfalseに変換する', () => {
  assert.equal(getWorldsendDisplayIdSource(''), false)
})

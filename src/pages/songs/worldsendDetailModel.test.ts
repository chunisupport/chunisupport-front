import assert from 'node:assert/strict'
import test from 'node:test'

import { buildWorldsendSongDetailPath } from '../../constants/routes.ts'
import type { WorldsendSongDTO } from '../../types/api.ts'
import {
  decodeWorldsendDisplayIdParam,
  getWorldsendDisplayIdSource,
  isWorldsendSongDetailNotFound,
} from './WorldsendSongDetail/worldsendRouteParams.ts'
import {
  buildWorldsendOwnScoreItem,
  getWorldsendChartRows,
  getWorldsendSongInfoItems,
  getWorldsendTitleMeta,
} from './worldsendDetailModel.ts'

const createSong = (overrides: Partial<WorldsendSongDTO> = {}): WorldsendSongDTO => ({
  id: '123',
  title: "WORLD'S END Song",
  reading: null,
  name_folder_code: 'NUMBER',
  artist: 'Artist',
  genre: 'VARIETY',
  bpm: 180,
  release: '2024-01-15',
  official_idx: '123',
  jacket: 'jacket-file',
  is_new: false,
  unlock_required: false,
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

test("WORLD'S ENDの自己スコア項目は3種類のランプを引き継ぐ", () => {
  // Given: 3種類のランプを持つプレイ済みレコード。
  const record = {
    is_played: true,
    updated_at: '2026-08-01T00:00:00Z',
    id: '123',
    title: "WORLD'S END Song",
    artist: 'Artist',
    level_star: 5,
    attribute: '狂',
    notes: 2000,
    score: 1_010_000,
    justice_count: 0,
    img: 'jacket-file',
    clear_lamp: 'CATASTROPHY',
    combo_lamp: 'ALL JUSTICE',
    full_chain: 'FULL CHAIN PLATINUM',
  } as const

  // When: 自己スコアカードの表示項目へ変換する。
  const item = buildWorldsendOwnScoreItem(record)

  // Then: スコアと全ランプがカード用項目へ渡される。
  assert.deepEqual(item, {
    difficulty: "WORLD'S END",
    score: 1_010_000,
    comboLamp: 'ALL JUSTICE',
    clearLamp: 'CATASTROPHY',
    fullChain: 'FULL CHAIN PLATINUM',
    supportsHistory: true,
  })
})

test("未プレイのWORLD'S ENDレコードはスコアを表示しない", () => {
  // Given: APIが補完した未プレイレコード。
  const record = {
    is_played: false,
    updated_at: null,
    id: '123',
    title: "WORLD'S END Song",
    artist: 'Artist',
    level_star: 5,
    attribute: '狂',
    notes: 2000,
    score: 0,
    justice_count: null,
    img: 'jacket-file',
    clear_lamp: null,
    combo_lamp: null,
    full_chain: null,
  } as const

  // When: 自己スコアカードの表示項目へ変換する。
  const item = buildWorldsendOwnScoreItem(record)

  // Then: 未プレイ表示を維持するためスコアは未定義になる。
  assert.equal(item.score, undefined)
})

test('ルートパラメータのdisplay idはAPIに渡す前にデコードする', () => {
  assert.equal(decodeWorldsendDisplayIdParam('A%2FB%20C'), 'A/B C')
})

test('空のdisplay idはリソース取得を開始しないためfalseに変換する', () => {
  assert.equal(getWorldsendDisplayIdSource(''), false)
})

/**
 * `@solidjs/router` の `createLocation` と同じく、パスを `URL.pathname` の末尾セグメントにする。
 * `useParams` はこのセグメントを `decodeURIComponent` せずに渡す。
 *
 * @param path - ルートマッチ前のパス。
 * @returns `useParams` が受け取る表示ID。
 */
const readRouterDisplayIdParam = (path: string): string => {
  const pathname = new URL(path, 'http://sr').pathname
  return pathname.split('/').filter(Boolean).pop() ?? ''
}

test('不正なパーセントエンコードの表示IDは例外にせず取得しない', () => {
  // Given: ルーターが pathname に残す不正なエンコード。
  const invalidParams = ['%', '%ZZ', '%E3%81', '%E3', '%FF']

  for (const displayIdParam of invalidParams) {
    const routerParam = readRouterDisplayIdParam(`/songs/worldsend/${displayIdParam}`)

    // When: 表示IDをデコードする。
    const decoded = decodeWorldsendDisplayIdParam(routerParam)
    const source = getWorldsendDisplayIdSource(routerParam)

    // Then: 例外にせず、APIへ渡さない無効値になる。
    assert.equal(routerParam, displayIdParam)
    assert.equal(decoded, null)
    assert.equal(source, false)
    assert.equal(isWorldsendSongDetailNotFound(source, 'loaded'), true)
  }
})

test('正常な表示IDはルーター経由でも1回のデコードで戻り、二重デコードしない', () => {
  // Given: 画面遷移が encodeURIComponent したパス。useParams はそれを未デコードで渡す。
  const displayIds = ['A/B C', 'plain-id', 'あ', '100%', 'A%2FB']

  for (const displayId of displayIds) {
    const routerParam = readRouterDisplayIdParam(buildWorldsendSongDetailPath(displayId))

    // When: 表示IDを1回デコードする。
    const source = getWorldsendDisplayIdSource(routerParam)

    // Then: 元の表示IDに戻り、API取得を止めない。
    assert.equal(source, displayId)
    assert.equal(isWorldsendSongDetailNotFound(source, undefined), false)
  }
})

test('パーセント列を含まない表示IDはデコードしても変わらない', () => {
  // Given: すでにデコード済みで、パーセントエンコードを含まない表示ID。
  const displayId = 'A/B C'

  // When: もう一度デコードする。
  const decoded = decodeWorldsendDisplayIdParam(displayId)

  // Then: 同じ表示IDのままになる。
  assert.equal(decoded, displayId)
})

test('無効な表示IDと404は Not Found に収束し、取得中や取得失敗は詳細表示を続ける', () => {
  // Given / When / Then: 無効IDは過去の取得結果が残っていても Not Found。
  assert.equal(isWorldsendSongDetailNotFound(false, undefined), true)
  assert.equal(isWorldsendSongDetailNotFound(false, 'loaded'), true)

  // 有効IDの404は Not Found。未取得と取得失敗は詳細側でローディングまたはエラーを出す。
  assert.equal(isWorldsendSongDetailNotFound('song-id', 'notFound'), true)
  assert.equal(isWorldsendSongDetailNotFound('song-id', undefined), false)
  assert.equal(isWorldsendSongDetailNotFound('song-id', 'error'), false)
  assert.equal(isWorldsendSongDetailNotFound('song-id', 'loaded'), false)
})

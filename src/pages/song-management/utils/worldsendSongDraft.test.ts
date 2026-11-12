import assert from 'node:assert/strict'
import test from 'node:test'
import type { ManagedWorldsendSongDTO } from '../../../types/api'
import { SONG_MANAGEMENT_MESSAGES } from '../constants'
import {
  applyWorldsendDraftToManagedSong,
  buildCreateWorldsendDraft,
  buildCreateWorldsendSongRequest,
  buildUpdateWorldsendSongRequest,
  type CreateWorldsendDraft,
  hasWorldsendDraftChanges,
  toWorldsendDraft,
} from './worldsendSongDraft'

const genres = [
  { id: 1, name: 'POPS & ANIME' },
  { id: 2, name: 'ORIGINAL' },
]

const managedSong: ManagedWorldsendSongDTO = {
  id: 'we-1',
  title: "WORLD'S END曲",
  reading: null,
  name_folder_code: 'NUMBER',
  artist: 'artist',
  genre: 'POPS & ANIME',
  bpm: 200,
  release: '2025-02-01',
  official_idx: '8000',
  jacket: null,
  is_new: false,
  unlock_required: false,
  charts: {
    WORLDSEND: {
      attribute: '狂',
      level_star: 3,
      notes: 500,
      notes_designer: 'WE担当',
      updated_at: '2025-02-02T00:00:00Z',
    },
  },
  is_deleted: false,
  updated_at: '2025-02-03T00:00:00Z',
}

/**
 * 検証を通る WORLD'S END 楽曲の追加ドラフトを生成する。
 *
 * @returns 譜面項目が未入力の追加ドラフト。
 */
const validCreateDraft = (): CreateWorldsendDraft => ({
  ...buildCreateWorldsendDraft(),
  official_idx: '8001',
  title: '新WE',
  artist: 'artist',
  genre_id: 1,
})

test("管理用 WORLD'S END 楽曲から譜面項目を含む編集ドラフトを生成すること", () => {
  // When
  const draft = toWorldsendDraft(managedSong, genres)

  // Then
  assert.equal(draft.genre_id, 1)
  assert.equal(draft.attribute, '狂')
  assert.equal(draft.level_star, 3)
  assert.equal(draft.chart_updated_at, '2025-02-02T00:00:00Z')
})

test('差分判定は編集可能な項目の変更だけを検出すること', () => {
  // Given
  const initial = toWorldsendDraft(managedSong, genres)

  // When / Then
  assert.equal(hasWorldsendDraftChanges(initial, { ...initial }), false)
  assert.equal(hasWorldsendDraftChanges(null, initial), false)
  assert.equal(hasWorldsendDraftChanges({ ...initial, chart_updated_at: null }, initial), false)
  assert.equal(hasWorldsendDraftChanges({ ...initial, level_star: 4 }, initial), true)
})

test('更新リクエストは譜面の文字列を正規化すること', () => {
  // Given
  const draft = {
    ...toWorldsendDraft(managedSong, genres),
    attribute: '  ',
    notes_designer: ' 担当 ',
  }

  // When
  const result = buildUpdateWorldsendSongRequest(draft, genres)

  // Then
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.request.genre, 'POPS & ANIME')
  assert.deepEqual(result.request.charts?.WORLDSEND, {
    attribute: null,
    level_star: 3,
    notes: 500,
    notes_designer: '担当',
  })
})

test('更新リクエストは不正なリリース日を検出すること', () => {
  // Given
  const draft = { ...toWorldsendDraft(managedSong, genres), released_at: 'invalid' }

  // When
  const result = buildUpdateWorldsendSongRequest(draft, genres)

  // Then
  assert.deepEqual(result, { ok: false, message: SONG_MANAGEMENT_MESSAGES.releaseInvalid })
})

test('追加リクエストは譜面項目が未入力なら譜面を送らないこと', () => {
  // When
  const result = buildCreateWorldsendSongRequest(validCreateDraft(), genres)

  // Then
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.request.chart, undefined)
  assert.equal(result.request.genre, 'POPS & ANIME')
})

test('追加リクエストは譜面項目が1つでもあれば譜面を送ること', () => {
  // Given
  const draft = { ...validCreateDraft(), notes_designer: ' 担当 ' }

  // When
  const result = buildCreateWorldsendSongRequest(draft, genres)

  // Then
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.deepEqual(result.request.chart, {
    attribute: null,
    level_star: null,
    notes: null,
    notes_designer: '担当',
  })
})

const REQUIRED_MESSAGE = '公式ID・タイトル・アーティストは必須です。'
const OFFICIAL_IDX_MESSAGE = '公式IDは10文字以内で入力してください。'
const GENRE_MESSAGE = 'ジャンルを選択してください。'
const BPM_MESSAGE = 'BPMは0以上で入力してください。'
const LEVEL_MESSAGE = "WORLD'S ENDレベルは1〜5で入力してください。"
const NOTES_MESSAGE = 'ノーツは0以上で入力してください。'
const RELEASE_MESSAGE = 'リリース日の形式が不正です。日付を入力し直してください。'

for (const { name, overrides, message } of [
  { name: 'アーティストが空なら必須エラー', overrides: { artist: '' }, message: REQUIRED_MESSAGE },
  {
    name: '公式IDが11文字なら長さエラー',
    overrides: { official_idx: '12345678901' },
    message: OFFICIAL_IDX_MESSAGE,
  },
  { name: '存在しないジャンルなら選択エラー', overrides: { genre_id: 99 }, message: GENRE_MESSAGE },
  { name: 'BPMが負ならBPMエラー', overrides: { bpm: -1 }, message: BPM_MESSAGE },
  {
    name: '星数が下限未満の0ならレベルエラー',
    overrides: { level_star: 0 },
    message: LEVEL_MESSAGE,
  },
  {
    name: '星数が上限超過の6ならレベルエラー',
    overrides: { level_star: 6 },
    message: LEVEL_MESSAGE,
  },
  { name: 'ノーツ数が負ならノーツエラー', overrides: { notes: -1 }, message: NOTES_MESSAGE },
  {
    name: 'リリース日が不正なら日付エラー',
    overrides: { released_at: 'invalid' },
    message: RELEASE_MESSAGE,
  },
  {
    name: '必須欠落とID長超過では必須エラー',
    overrides: { artist: '', official_idx: '12345678901' },
    message: REQUIRED_MESSAGE,
  },
  {
    name: 'ID長超過とジャンル不正ではID長エラー',
    overrides: { official_idx: '12345678901', genre_id: 99 },
    message: OFFICIAL_IDX_MESSAGE,
  },
  {
    name: 'ジャンル不正とBPM負値ではジャンルエラー',
    overrides: { genre_id: 99, bpm: -1 },
    message: GENRE_MESSAGE,
  },
  {
    name: 'BPM負値と星数範囲外ではBPMエラー',
    overrides: { bpm: -1, level_star: 6 },
    message: BPM_MESSAGE,
  },
  {
    name: '星数範囲外とノーツ数負値ではレベルエラー',
    overrides: { level_star: 0, notes: -1 },
    message: LEVEL_MESSAGE,
  },
  {
    name: 'ノーツ数負値とリリース日不正ではノーツエラー',
    overrides: { notes: -1, released_at: 'invalid' },
    message: NOTES_MESSAGE,
  },
] satisfies { name: string; overrides: Partial<CreateWorldsendDraft>; message: string }[]) {
  test(`追加リクエストは${name}を返すこと`, () => {
    // Given: 不正な項目を含む追加ドラフト。
    const draft = { ...validCreateDraft(), ...overrides }

    // When: 追加リクエストを組み立てる。
    const result = buildCreateWorldsendSongRequest(draft, genres)

    // Then: 対応する検証エラーを返す。
    assert.deepEqual(result, { ok: false, message })
  })
}

test('保存したドラフトを管理用楽曲へ反映し、譜面の更新日時は維持すること', () => {
  // Given
  const draft = { ...toWorldsendDraft(managedSong, genres), attribute: ' 撃 ' }

  // When
  const result = applyWorldsendDraftToManagedSong(managedSong, draft, 'ORIGINAL')

  // Then
  assert.equal(result.genre, 'ORIGINAL')
  assert.equal(result.charts.WORLDSEND?.attribute, '撃')
  assert.equal(result.charts.WORLDSEND?.updated_at, '2025-02-02T00:00:00Z')
})

test('要解禁フラグは編集ドラフトへ読み込み、差分判定と更新リクエストに反映すること', () => {
  // Given: 解禁不要の楽曲から生成したドラフトを要解禁へ変更する。
  const initial = toWorldsendDraft(managedSong, genres)
  const draft = { ...initial, unlock_required: true }

  // When
  const result = buildUpdateWorldsendSongRequest(draft, genres)

  // Then
  assert.equal(initial.unlock_required, false)
  assert.equal(hasWorldsendDraftChanges(draft, initial), true)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.request.unlock_required, true)
  assert.equal(applyWorldsendDraftToManagedSong(managedSong, draft, null).unlock_required, true)
})

test('追加リクエストは要解禁フラグを送ること', () => {
  // Given
  const draft = { ...validCreateDraft(), unlock_required: true }

  // When
  const result = buildCreateWorldsendSongRequest(draft, genres)

  // Then
  assert.equal(buildCreateWorldsendDraft().unlock_required, false)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.request.unlock_required, true)
})

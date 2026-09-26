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
  artist: 'artist',
  genre: 'POPS & ANIME',
  bpm: 200,
  release: '2025-02-01',
  official_idx: '8000',
  jacket: null,
  is_new: false,
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

test('追加リクエストの検証エラーを既存の順序で返すこと', () => {
  // Given
  const draft = validCreateDraft()
  const messageOf = (value: CreateWorldsendDraft) => {
    const result = buildCreateWorldsendSongRequest(value, genres)
    return result.ok ? null : result.message
  }

  // When / Then
  assert.equal(messageOf({ ...draft, artist: '' }), SONG_MANAGEMENT_MESSAGES.requiredFieldsMissing)
  assert.equal(
    messageOf({ ...draft, official_idx: '12345678901' }),
    SONG_MANAGEMENT_MESSAGES.officialIdxTooLong
  )
  assert.equal(messageOf({ ...draft, genre_id: 99 }), SONG_MANAGEMENT_MESSAGES.genreRequired)
  assert.equal(messageOf({ ...draft, bpm: -1 }), SONG_MANAGEMENT_MESSAGES.bpmInvalid)
  assert.equal(messageOf({ ...draft, level_star: 0 }), SONG_MANAGEMENT_MESSAGES.levelInvalid)
  assert.equal(messageOf({ ...draft, level_star: 6 }), SONG_MANAGEMENT_MESSAGES.levelInvalid)
  assert.equal(messageOf({ ...draft, notes: -1 }), SONG_MANAGEMENT_MESSAGES.notesInvalid)
  assert.equal(
    messageOf({ ...draft, released_at: 'invalid' }),
    SONG_MANAGEMENT_MESSAGES.releaseInvalid
  )
})

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

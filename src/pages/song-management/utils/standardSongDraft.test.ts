import assert from 'node:assert/strict'
import test from 'node:test'
import type { ManagedSongDTO } from '../../../types/api'
import { SONG_MANAGEMENT_MESSAGES } from '../constants'
import {
  addUltimaChartToDraft,
  applySongDraftToManagedSong,
  buildCreateSongDraft,
  buildCreateSongRequest,
  buildUpdateSongRequest,
  type CreateSongDraft,
  hasInvalidEditableChart,
  hasSongDraftChanges,
  hasUltimaChart,
  toSongDraft,
} from './standardSongDraft'

const genres = [
  { id: 1, name: 'POPS & ANIME' },
  { id: 2, name: 'ORIGINAL' },
]

const difficulties = [
  { id: 10, name: 'BASIC' },
  { id: 13, name: 'MASTER' },
  { id: 14, name: 'ULTIMA' },
]

const managedSong: ManagedSongDTO = {
  id: 'song-1',
  title: '通常曲',
  reading: 'つうじょうきょく',
  wiki_page_title: null,
  artist: 'artist',
  genre: 'ORIGINAL',
  bpm: 180,
  release: '2025-01-02T00:00:00+09:00',
  official_idx: '1',
  jacket: 'jacket.png',
  maxop: 0,
  is_maxop_unknown: false,
  op_target_difficulty: null,
  is_new: true,
  charts: {
    BASIC: { const: 3, is_const_unknown: false, notes: 300, notes_designer: null },
    MASTER: {
      const: 13.5,
      is_const_unknown: true,
      notes: 1500,
      notes_designer: 'MAS担当',
      updated_at: '2025-01-03T00:00:00Z',
    },
  },
  is_deleted: false,
  updated_at: '2025-01-04T00:00:00Z',
}

/**
 * 検証を通る通常楽曲の追加ドラフトを生成する。
 *
 * @returns MASTER のみ追加対象にした追加ドラフト。
 */
const validCreateDraft = (): CreateSongDraft => {
  const draft = buildCreateSongDraft()
  return {
    ...draft,
    official_idx: ' 1234 ',
    title: ' 新曲 ',
    artist: ' artist ',
    genre_id: 2,
    jacket: '  ',
    charts: draft.charts.map((chart) =>
      chart.difficulty_name === 'MASTER'
        ? { ...chart, enabled: true, const: '13.7', notes_designer: ' 担当 ' }
        : chart
    ),
  }
}

test('管理用楽曲から難易度マスタ順の編集ドラフトを生成すること', () => {
  // Given: BASIC と MASTER のみ登録された楽曲

  // When
  const draft = toSongDraft(managedSong, genres, difficulties)

  // Then
  assert.equal(draft.genre_id, 2)
  assert.equal(draft.released_at, '2025-01-02')
  assert.equal(draft.is_new, true)
  assert.deepEqual(
    draft.charts.map((chart) => [chart.difficulty_id, chart.difficulty_name, chart.const]),
    [
      [10, 'BASIC', '3'],
      [13, 'MASTER', '13.5'],
    ]
  )
  assert.equal(draft.charts[1].updated_at, '2025-01-03T00:00:00Z')
})

test('追加用の初期ドラフトは全難易度を未選択で持つこと', () => {
  // When
  const draft = buildCreateSongDraft()

  // Then
  assert.deepEqual(
    draft.charts.map((chart) => [chart.difficulty_name, chart.enabled, chart.const]),
    [
      ['BASIC', false, '0'],
      ['ADVANCED', false, '0'],
      ['EXPERT', false, '0'],
      ['MASTER', false, '0'],
      ['ULTIMA', false, '0'],
    ]
  )
})

test('ULTIMA譜面を1回だけ追加すること', () => {
  // Given
  const draft = toSongDraft(managedSong, genres, difficulties)

  // When
  const added = addUltimaChartToDraft(draft, 14)
  const addedTwice = addUltimaChartToDraft(added, 14)

  // Then
  assert.equal(hasUltimaChart(draft), false)
  assert.equal(hasUltimaChart(added), true)
  assert.equal(addedTwice, added)
  assert.equal(added.charts[added.charts.length - 1].difficulty_id, 14)
})

test('差分判定は編集可能な項目の変更だけを検出すること', () => {
  // Given
  const initial = toSongDraft(managedSong, genres, difficulties)

  // When / Then
  assert.equal(hasSongDraftChanges(initial, { ...initial }), false)
  assert.equal(hasSongDraftChanges(initial, null), false)
  assert.equal(hasSongDraftChanges({ ...initial, updated_at: 'changed' }, initial), false)
  assert.equal(hasSongDraftChanges({ ...initial, title: '変更' }, initial), true)
  assert.equal(
    hasSongDraftChanges(
      {
        ...initial,
        charts: initial.charts.map((chart) => ({ ...chart, notes_designer: '変更' })),
      },
      initial
    ),
    true
  )
  assert.equal(hasSongDraftChanges(addUltimaChartToDraft(initial, 14), initial), true)
})

test('定数が数値でない、または負の譜面を無効と判定すること', () => {
  // Given
  const [chart] = toSongDraft(managedSong, genres, difficulties).charts

  // When / Then
  assert.equal(hasInvalidEditableChart([chart]), false)
  assert.equal(hasInvalidEditableChart([{ ...chart, const: 'abc' }]), true)
  assert.equal(hasInvalidEditableChart([{ ...chart, const: '-1' }]), true)
  assert.equal(hasInvalidEditableChart([{ ...chart, notes: -1 }]), true)
})

test('更新リクエストは文字列を正規化してジャンル名へ変換すること', () => {
  // Given
  const draft = {
    ...toSongDraft(managedSong, genres, difficulties),
    reading: '  ',
    wiki_page_title: ' Wiki ',
  }

  // When
  const result = buildUpdateSongRequest(draft, genres)

  // Then
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.request.genre, 'ORIGINAL')
  assert.equal(result.request.reading, null)
  assert.equal(result.request.wiki_page_title, 'Wiki')
  assert.equal(result.request.released_at, '2025-01-02')
  assert.deepEqual(result.request.charts.MASTER, {
    const: 13.5,
    is_const_unknown: true,
    notes: 1500,
    notes_designer: 'MAS担当',
  })
})

test('更新リクエストはリリース日・譜面の不正をこの順で検出すること', () => {
  // Given
  const draft = toSongDraft(managedSong, genres, difficulties)
  const invalidChart = draft.charts.map((chart) => ({ ...chart, const: '-1' }))

  // When / Then
  assert.deepEqual(
    buildUpdateSongRequest({ ...draft, released_at: 'invalid', charts: invalidChart }, genres),
    { ok: false, message: SONG_MANAGEMENT_MESSAGES.releaseInvalid }
  )
  assert.deepEqual(buildUpdateSongRequest({ ...draft, charts: invalidChart }, genres), {
    ok: false,
    message: SONG_MANAGEMENT_MESSAGES.editableChartInvalid,
  })
})

test('追加リクエストは有効な譜面だけを送り、文字列を正規化すること', () => {
  // Given
  const draft = validCreateDraft()

  // When
  const result = buildCreateSongRequest(draft, genres)

  // Then
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.request.official_idx, '1234')
  assert.equal(result.request.title, '新曲')
  assert.equal(result.request.artist, 'artist')
  assert.equal(result.request.genre, 'ORIGINAL')
  assert.equal(result.request.jacket, null)
  assert.deepEqual(result.request.charts, [
    {
      difficulty: 'MASTER',
      const: 13.7,
      is_const_unknown: false,
      notes: null,
      notes_designer: '担当',
    },
  ])
})

test('追加リクエストの検証エラーを既存の順序で返すこと', () => {
  // Given
  const draft = validCreateDraft()
  const invalidMaster = draft.charts.map((chart) =>
    chart.difficulty_name === 'MASTER' ? { ...chart, const: '-1' } : chart
  )

  // When / Then
  const messageOf = (value: CreateSongDraft) => {
    const result = buildCreateSongRequest(value, genres)
    return result.ok ? null : result.message
  }
  assert.equal(messageOf({ ...draft, title: ' ' }), SONG_MANAGEMENT_MESSAGES.requiredFieldsMissing)
  assert.equal(
    messageOf({ ...draft, official_idx: '12345678901' }),
    SONG_MANAGEMENT_MESSAGES.officialIdxTooLong
  )
  assert.equal(messageOf({ ...draft, genre_id: null }), SONG_MANAGEMENT_MESSAGES.genreRequired)
  assert.equal(messageOf({ ...draft, bpm: -1 }), SONG_MANAGEMENT_MESSAGES.bpmInvalid)
  assert.equal(
    messageOf({ ...draft, charts: invalidMaster }),
    SONG_MANAGEMENT_MESSAGES.createChartInvalid
  )
  assert.equal(
    messageOf({ ...draft, released_at: 'invalid' }),
    SONG_MANAGEMENT_MESSAGES.releaseInvalid
  )
})

test('追加対象外の譜面は定数が不正でも検証しないこと', () => {
  // Given
  const draft = validCreateDraft()
  const invalidBasic = draft.charts.map((chart) =>
    chart.difficulty_name === 'BASIC' ? { ...chart, const: '-1' } : chart
  )

  // When
  const result = buildCreateSongRequest({ ...draft, charts: invalidBasic }, genres)

  // Then
  assert.equal(result.ok, true)
})

test('保存したドラフトを管理用楽曲へ反映し、譜面の更新日時は維持すること', () => {
  // Given
  const draft = {
    ...toSongDraft(managedSong, genres, difficulties),
    title: '変更後',
    reading: ' よみ ',
  }

  // When
  const result = applySongDraftToManagedSong(managedSong, draft, null)

  // Then
  assert.equal(result.title, '変更後')
  assert.equal(result.reading, 'よみ')
  assert.equal(result.genre, 'ORIGINAL')
  assert.equal(result.release, '2025-01-02')
  assert.equal(result.charts.MASTER?.updated_at, '2025-01-03T00:00:00Z')
  assert.equal(result.charts.BASIC?.updated_at, null)
})

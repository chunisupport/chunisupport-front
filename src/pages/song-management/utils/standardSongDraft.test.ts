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
  parseChartConstDraft,
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
  name_folder_code: 'NUMBER',
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
  unlock_required: false,
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

test('追加リクエストはタイトルが空白なら必須エラーを返すこと', () => {
  // Given: 検証対象の不正な入力。
  const draft = validCreateDraft()
  const input = { ...draft, title: ' ' }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 対応する検証エラーを返す。
  assert.deepEqual(result, { ok: false, message: '公式ID・タイトル・アーティストは必須です。' })
})

test('追加リクエストは公式IDが11文字なら長さエラーを返すこと', () => {
  // Given: 検証対象の不正な入力。
  const draft = validCreateDraft()
  const input = { ...draft, official_idx: '12345678901' }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 対応する検証エラーを返す。
  assert.deepEqual(result, { ok: false, message: '公式IDは10文字以内で入力してください。' })
})

test('追加リクエストはジャンルがnullなら選択エラーを返すこと', () => {
  // Given: 検証対象の不正な入力。
  const draft = validCreateDraft()
  const input = { ...draft, genre_id: null }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 対応する検証エラーを返す。
  assert.deepEqual(result, { ok: false, message: 'ジャンルを選択してください。' })
})

test('追加リクエストはBPMが負ならBPMエラーを返すこと', () => {
  // Given: 検証対象の不正な入力。
  const draft = validCreateDraft()
  const input = { ...draft, bpm: -1 }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 対応する検証エラーを返す。
  assert.deepEqual(result, { ok: false, message: 'BPMは0以上で入力してください。' })
})

test('追加リクエストは有効な譜面の定数が負なら譜面エラーを返すこと', () => {
  // Given: 検証対象の不正な入力。
  const draft = validCreateDraft()
  const invalidMaster = draft.charts.map((chart) =>
    chart.difficulty_name === 'MASTER' ? { ...chart, const: '-1' } : chart
  )
  const input = { ...draft, charts: invalidMaster }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 対応する検証エラーを返す。
  assert.deepEqual(result, {
    ok: false,
    message: '追加する譜面の定数・ノーツは0以上で入力してください。',
  })
})

for (const { label, value } of [
  { label: '数字でない文字列', value: 'abc' },
  { label: '空文字', value: '' },
  { label: '数値の後ろに不正文字を含む文字列', value: '12abc' },
  { label: '小数の後ろに不正文字を含む文字列', value: '12.3foo' },
  { label: 'Infinity', value: 'Infinity' },
  { label: '指数表記', value: '1e1' },
]) {
  test(`追加リクエストは有効な譜面の定数が${label}なら譜面エラーを返すこと`, () => {
    // Given: 数値として読めない定数を持つ有効な譜面。
    const draft = validCreateDraft()
    const invalidMaster = draft.charts.map((chart) =>
      chart.difficulty_name === 'MASTER' ? { ...chart, const: value } : chart
    )

    // When: 追加リクエストを組み立てる。
    const result = buildCreateSongRequest({ ...draft, charts: invalidMaster }, genres)

    // Then: 定数が null のリクエストを作らず、譜面エラーを返す。
    assert.deepEqual(result, {
      ok: false,
      message: '追加する譜面の定数・ノーツは0以上で入力してください。',
    })
  })
}

test('追加リクエストは無効にした譜面の定数が数値でなくても検証対象にしないこと', () => {
  // Given: 追加対象から外した譜面にだけ、数値として読めない定数がある。
  const draft = validCreateDraft()
  const charts = draft.charts.map((chart) =>
    chart.difficulty_name === 'BASIC' ? { ...chart, enabled: false, const: 'abc' } : chart
  )

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest({ ...draft, charts }, genres)

  // Then: 譜面エラーにはならず、リクエストを組み立てる。
  assert.equal(result.ok, true)
})

test('追加リクエストはリリース日が不正なら日付エラーを返すこと', () => {
  // Given: 検証対象の不正な入力。
  const draft = validCreateDraft()
  const input = { ...draft, released_at: 'invalid' }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 対応する検証エラーを返す。
  assert.deepEqual(result, {
    ok: false,
    message: 'リリース日の形式が不正です。日付を入力し直してください。',
  })
})

test('追加リクエストは必須欠落をID長超過より優先すること', () => {
  // Given: 検証対象の不正な入力。
  const draft = validCreateDraft()
  const input = { ...draft, title: ' ', official_idx: '12345678901' }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 対応する検証エラーを返す。
  assert.deepEqual(result, { ok: false, message: '公式ID・タイトル・アーティストは必須です。' })
})

test('追加リクエストはID長超過をジャンル未選択より優先すること', () => {
  // Given: 検証対象の不正な入力。
  const draft = validCreateDraft()
  const input = { ...draft, official_idx: '12345678901', genre_id: null }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 対応する検証エラーを返す。
  assert.deepEqual(result, { ok: false, message: '公式IDは10文字以内で入力してください。' })
})

test('追加リクエストはジャンル未選択をBPM不正より優先すること', () => {
  // Given: 検証対象の不正な入力。
  const draft = validCreateDraft()
  const input = { ...draft, genre_id: null, bpm: -1 }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 対応する検証エラーを返す。
  assert.deepEqual(result, { ok: false, message: 'ジャンルを選択してください。' })
})

test('追加リクエストはBPM不正を譜面不正より優先すること', () => {
  // Given: 検証対象の不正な入力。
  const draft = validCreateDraft()
  const invalidMaster = draft.charts.map((chart) =>
    chart.difficulty_name === 'MASTER' ? { ...chart, const: '-1' } : chart
  )
  const input = { ...draft, bpm: -1, charts: invalidMaster }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 対応する検証エラーを返す。
  assert.deepEqual(result, { ok: false, message: 'BPMは0以上で入力してください。' })
})

test('追加リクエストは譜面不正をリリース日不正より優先すること', () => {
  // Given: 検証対象の不正な入力。
  const draft = validCreateDraft()
  const invalidMaster = draft.charts.map((chart) =>
    chart.difficulty_name === 'MASTER' ? { ...chart, const: '-1' } : chart
  )
  const input = { ...draft, charts: invalidMaster, released_at: 'invalid' }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 対応する検証エラーを返す。
  assert.deepEqual(result, {
    ok: false,
    message: '追加する譜面の定数・ノーツは0以上で入力してください。',
  })
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

test('要解禁フラグは編集ドラフトへ読み込み、差分判定と更新リクエストに反映すること', () => {
  // Given: 解禁不要の楽曲から生成したドラフトを要解禁へ変更する。
  const initial = toSongDraft(managedSong, genres, difficulties)
  const draft = { ...initial, unlock_required: true }

  // When
  const result = buildUpdateSongRequest(draft, genres)

  // Then
  assert.equal(initial.unlock_required, false)
  assert.equal(hasSongDraftChanges(draft, initial), true)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.request.unlock_required, true)
  assert.equal(applySongDraftToManagedSong(managedSong, draft, null).unlock_required, true)
})

test('追加リクエストは要解禁フラグを送ること', () => {
  // Given
  const draft = { ...validCreateDraft(), unlock_required: true }

  // When
  const result = buildCreateSongRequest(draft, genres)

  // Then
  assert.equal(buildCreateSongDraft().unlock_required, false)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.request.unlock_required, true)
})

test('譜面定数が0の編集ドラフトは有効と判定すること', () => {
  // Given: 定数が0の編集譜面。
  const [chart] = toSongDraft(managedSong, genres, difficulties).charts

  // When: 編集譜面の不正を判定する。
  // Then: 0は有効とする。
  assert.equal(hasInvalidEditableChart([{ ...chart, const: '0' }]), false)
})

test('ノーツ数が0の編集ドラフトは有効と判定すること', () => {
  // Given: ノーツ数が0の編集譜面。
  const [chart] = toSongDraft(managedSong, genres, difficulties).charts

  // When: 編集譜面の不正を判定する。
  // Then: 0は有効とする。
  assert.equal(hasInvalidEditableChart([{ ...chart, notes: 0 }]), false)
})

test('追加リクエストは公式IDが10文字ちょうどなら受け付けること', () => {
  // Given: 公式IDが10文字の追加ドラフト。
  const draft = validCreateDraft()
  const input = { ...draft, official_idx: '1234567890' }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 長さエラーを返さず受け付ける。
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.request.official_idx, '1234567890')
})

test('追加リクエストはBPMが0なら受け付けること', () => {
  // Given: BPMが0の追加ドラフト。
  const draft = validCreateDraft()
  const input = { ...draft, bpm: 0 }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: BPMエラーを返さず受け付ける。
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.request.bpm, 0)
})

test('追加リクエストは有効な譜面の定数が0なら受け付けること', () => {
  // Given: 有効な譜面の定数が0の追加ドラフト。
  const draft = validCreateDraft()
  const zeroConst = draft.charts.map((chart) =>
    chart.difficulty_name === 'MASTER' ? { ...chart, const: '0' } : chart
  )

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest({ ...draft, charts: zeroConst }, genres)

  // Then: 譜面エラーを返さず受け付ける。
  assert.equal(result.ok, true)
})

test('追加リクエストは有効な譜面のノーツ数が負なら譜面エラーを返すこと', () => {
  // Given: 有効な譜面のノーツ数が-1の追加ドラフト。
  const draft = validCreateDraft()
  const invalidMaster = draft.charts.map((chart) =>
    chart.difficulty_name === 'MASTER' ? { ...chart, notes: -1 } : chart
  )
  const input = { ...draft, charts: invalidMaster }

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest(input, genres)

  // Then: 対応する検証エラーを返す。
  assert.deepEqual(result, {
    ok: false,
    message: '追加する譜面の定数・ノーツは0以上で入力してください。',
  })
})

test('追加リクエストは有効な譜面のノーツ数が0なら受け付けること', () => {
  // Given: 有効な譜面のノーツ数が0の追加ドラフト。
  const draft = validCreateDraft()
  const zeroNotes = draft.charts.map((chart) =>
    chart.difficulty_name === 'MASTER' ? { ...chart, notes: 0 } : chart
  )

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest({ ...draft, charts: zeroNotes }, genres)

  // Then: 譜面エラーを返さず受け付ける。
  assert.equal(result.ok, true)
})

test('譜面定数の入力は文字列全体が10進数の場合だけ数値へ変換すること', () => {
  // Given / When / Then: 正常な整数・小数と前後空白は数値として読み取る。
  assert.equal(parseChartConstDraft('13'), 13)
  assert.equal(parseChartConstDraft('13.7'), 13.7)
  assert.equal(parseChartConstDraft(' 14.5 '), 14.5)
  // 部分的に数値として読める文字列や非有限値は不正とする。
  for (const value of ['12abc', '12.3foo', 'Infinity', '-1', '', '.5', '12.', '0x10']) {
    assert.equal(parseChartConstDraft(value), null, value)
  }
})

test('編集ドラフトは定数の後ろに不正文字を含む譜面を無効と判定すること', () => {
  // Given: 定数の後ろに不正文字を含む編集譜面。
  const [chart] = toSongDraft(managedSong, genres, difficulties).charts

  // When / Then: 部分的に数値化せず無効と判定する。
  assert.equal(hasInvalidEditableChart([{ ...chart, const: '12abc' }]), true)
  assert.equal(hasInvalidEditableChart([{ ...chart, const: '12.3foo' }]), true)
  assert.equal(hasInvalidEditableChart([{ ...chart, const: 'Infinity' }]), true)
})

test('追加リクエストは前後空白を含む正常な小数の定数を数値として送ること', () => {
  // Given: 前後空白を含む正常な小数の定数を持つ追加ドラフト。
  const draft = validCreateDraft()
  const charts = draft.charts.map((chart) =>
    chart.difficulty_name === 'MASTER' ? { ...chart, const: ' 14.5 ' } : chart
  )

  // When: 追加リクエストを組み立てる。
  const result = buildCreateSongRequest({ ...draft, charts }, genres)

  // Then: 定数を数値へ変換して送る。
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.request.charts?.[0]?.const, 14.5)
})

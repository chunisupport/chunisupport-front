import assert from 'node:assert/strict'
import test from 'node:test'
import type { SongDTO, WorldsendSongDTO } from '../../../types/api.ts'
import {
  buildChartDraftsFromSong,
  buildChartMetaUpdateRequest,
  buildSongMetaUpdateRequest,
  buildWorldsendChartMetaUpdateRequest,
  buildWorldsendSongMetaUpdateRequest,
  hasNotesDesigner,
  parseChartMetaDrafts,
  parseOptionalNonNegativeInteger,
  parseSongMetaEditValues,
  parseWorldsendChartMetaEditValues,
  toDateOnly,
} from './songMetaEdit.ts'

const createSong = (overrides: Partial<SongDTO> = {}): SongDTO => ({
  id: '0123456789abcdef',
  title: 'Test Song',
  reading: 'テストソング',
  artist: 'Artist',
  genre: 'ORIGINAL',
  bpm: 198,
  release: '2025-06-19',
  jacket: 'jacket',
  maxop: 0,
  is_maxop_unknown: false,
  op_target_difficulty: 'MASTER',
  is_new: true,
  charts: {
    BASIC: { const: 6, is_const_unknown: false, notes: 818, notes_designer: null },
    MASTER: {
      const: 15.7,
      is_const_unknown: false,
      notes: 3688,
      notes_designer: '譜面ボーイズからの挑戦状',
    },
  },
  ...overrides,
})

const createWorldsendSong = (overrides: Partial<WorldsendSongDTO> = {}): WorldsendSongDTO => ({
  id: 'fedcba9876543210',
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

test('hasNotesDesigner: BASICとADVANCEDは入力対象外であること', () => {
  // Given / When / Then
  assert.equal(hasNotesDesigner('BASIC'), false)
  assert.equal(hasNotesDesigner('ADVANCED'), false)
  assert.equal(hasNotesDesigner('EXPERT'), true)
  assert.equal(hasNotesDesigner('MASTER'), true)
  assert.equal(hasNotesDesigner('ULTIMA'), true)
})

test('toDateOnly: YYYY-MM-DDをそのまま返し、空文字はnullにすること', () => {
  // Given / When / Then
  assert.equal(toDateOnly('2025-06-19'), '2025-06-19')
  assert.equal(toDateOnly('2025-06-19T12:00:00Z'), '2025-06-19')
  assert.equal(toDateOnly(''), null)
  assert.equal(toDateOnly('not-a-date'), null)
})

test('parseOptionalNonNegativeInteger: 空欄をnull、不正値をinvalidにすること', () => {
  // Given / When / Then
  assert.equal(parseOptionalNonNegativeInteger(''), null)
  assert.equal(parseOptionalNonNegativeInteger('0'), 0)
  assert.equal(parseOptionalNonNegativeInteger('198'), 198)
  assert.equal(parseOptionalNonNegativeInteger('-1'), 'invalid')
  assert.equal(parseOptionalNonNegativeInteger('1.5'), 'invalid')
})

test('parseSongMetaEditValues: 通常楽曲はジャンル必須でBPMとリリース日を正規化すること', () => {
  // Given
  const input = { genreName: null, bpm: '198', releasedAt: '2025-06-19' }

  // When
  const missingGenre = parseSongMetaEditValues(input, true)
  const parsed = parseSongMetaEditValues({ ...input, genreName: 'ORIGINAL' }, true)

  // Then
  assert.equal(missingGenre.ok, false)
  assert.equal(parsed.ok, true)
  if (parsed.ok) {
    assert.deepEqual(parsed.value, {
      genre: 'ORIGINAL',
      bpm: 198,
      releasedAt: '2025-06-19',
    })
  }
})

test('buildSongMetaUpdateRequest: 楽曲情報だけ更新し譜面は空マップ、is_newは現行値を維持すること', () => {
  // Given
  const song = createSong()

  // When
  const request = buildSongMetaUpdateRequest(song, {
    genre: 'POPS & ANIME',
    bpm: 200,
    releasedAt: '2025-07-01',
  })

  // Then
  assert.equal(request.title, 'Test Song')
  assert.equal(request.artist, 'Artist')
  assert.equal(request.genre, 'POPS & ANIME')
  assert.equal(request.bpm, 200)
  assert.equal(request.released_at, '2025-07-01')
  assert.equal(request.is_new, true)
  assert.deepEqual(request.charts, {})
})

test('buildWorldsendSongMetaUpdateRequest: 譜面フィールドを載せないこと', () => {
  // Given
  const song = createWorldsendSong()

  // When
  const request = buildWorldsendSongMetaUpdateRequest(song, {
    genre: 'ORIGINAL',
    bpm: null,
    releasedAt: null,
  })

  // Then
  assert.equal(request.genre, 'ORIGINAL')
  assert.equal(request.bpm, null)
  assert.equal(request.released_at, null)
  assert.equal('charts' in request, false)
})

test('buildChartDraftsFromSong: 存在する譜面だけを難易度順のドラフトにすること', () => {
  // Given
  const song = createSong()

  // When
  const drafts = buildChartDraftsFromSong(song)

  // Then
  assert.deepEqual(
    drafts.map((draft) => draft.difficulty),
    ['BASIC', 'MASTER']
  )
  assert.equal(drafts[0]?.const, '6.0')
  assert.equal(drafts[1]?.notes_designer, '譜面ボーイズからの挑戦状')
})

test('parseChartMetaDrafts: 空の定数はエラー、ノーツ空欄はnullにすること', () => {
  // Given
  const [basicDraft, ...otherDrafts] = buildChartDraftsFromSong(createSong())
  assert.ok(basicDraft)
  const drafts = [{ ...basicDraft, notes: '' }, ...otherDrafts]

  // When
  const parsed = parseChartMetaDrafts(drafts)
  const invalid = parseChartMetaDrafts([{ ...basicDraft, const: '' }])

  // Then
  assert.equal(parsed.ok, true)
  if (parsed.ok) {
    assert.equal(parsed.value.BASIC?.notes, null)
    assert.equal(parsed.value.MASTER?.const, 15.7)
  }
  assert.equal(invalid.ok, false)
})

test('buildChartMetaUpdateRequest: 楽曲フィールドは現行値、譜面は編集結果を載せること', () => {
  // Given
  const song = createSong()
  const parsed = parseChartMetaDrafts(buildChartDraftsFromSong(song))
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return

  // When
  const request = buildChartMetaUpdateRequest(song, parsed.value)

  // Then
  assert.equal(request.genre, 'ORIGINAL')
  assert.equal(request.released_at, '2025-06-19')
  assert.equal(request.is_new, true)
  assert.equal(request.charts.MASTER?.notes_designer, '譜面ボーイズからの挑戦状')
})

test('parseWorldsendChartMetaEditValues: レベル範囲外はエラー、空欄はnullにすること', () => {
  // Given
  const validInput = {
    attribute: ' 狂 ',
    levelStar: '5',
    notes: '',
    notesDesigner: '譜面作者A',
  }

  // When
  const parsed = parseWorldsendChartMetaEditValues(validInput)
  const invalid = parseWorldsendChartMetaEditValues({ ...validInput, levelStar: '6' })

  // Then
  assert.equal(parsed.ok, true)
  if (parsed.ok) {
    assert.deepEqual(parsed.value, {
      attribute: '狂',
      level_star: 5,
      notes: null,
      notes_designer: '譜面作者A',
    })
  }
  assert.equal(invalid.ok, false)
})

test('buildWorldsendChartMetaUpdateRequest: WORLDSEND譜面だけを更新対象にすること', () => {
  // Given
  const song = createWorldsendSong()

  // When
  const request = buildWorldsendChartMetaUpdateRequest(song, {
    attribute: '改',
    level_star: 4,
    notes: 1800,
    notes_designer: null,
  })

  // Then
  assert.equal(request.genre, 'VARIETY')
  assert.equal(request.released_at, '2024-01-15')
  assert.deepEqual(request.charts, {
    WORLDSEND: {
      attribute: '改',
      level_star: 4,
      notes: 1800,
      notes_designer: null,
    },
  })
})

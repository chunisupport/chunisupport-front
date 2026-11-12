import assert from 'node:assert/strict'
import test from 'node:test'
import type { SongDTO, WorldsendSongDTO } from '../../../types/api.ts'
import {
  buildChartDraftsFromSong,
  buildChartMetaUpdateRequest,
  buildSongMetaUpdateRequest,
  buildWorldsendChartMetaUpdateRequest,
  buildWorldsendSongMetaUpdateRequest,
  canMarkChartConstUnknown,
  hasNotesDesigner,
  parseChartMetaDrafts,
  parseOptionalNonNegativeInteger,
  parseSongMetaEditValues,
  parseWorldsendChartMetaEditValues,
} from './songMetaEdit.ts'

const createSong = (overrides: Partial<SongDTO> = {}): SongDTO => ({
  id: '0123456789abcdef',
  title: 'Test Song',
  reading: 'テストソング',
  name_folder_code: 'NUMBER',
  artist: 'Artist',
  genre: 'ORIGINAL',
  bpm: 198,
  release: '2025-06-19',
  jacket: 'jacket',
  maxop: 0,
  is_maxop_unknown: false,
  op_target_difficulty: 'MASTER',
  is_new: true,
  unlock_required: false,
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
  name_folder_code: 'NUMBER',
  artist: 'Artist',
  genre: 'VARIETY',
  bpm: 180,
  release: '2024-01-15',
  official_idx: '123',
  jacket: 'jacket-file',
  is_new: true,
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

test('hasNotesDesigner: BASICとADVANCEDは入力対象外であること', () => {
  // Given / When / Then
  assert.equal(hasNotesDesigner('BASIC'), false)
  assert.equal(hasNotesDesigner('ADVANCED'), false)
  assert.equal(hasNotesDesigner('EXPERT'), true)
  assert.equal(hasNotesDesigner('MASTER'), true)
  assert.equal(hasNotesDesigner('ULTIMA'), true)
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
  const input = {
    genreName: null,
    bpm: '198',
    releasedAt: '2025-06-19',
    wikiPageTitle: ' Page ',
    unlockRequired: false,
  }

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
      wikiPageTitle: 'Page',
      unlockRequired: false,
    })
  }
})

test('parseSongMetaEditValues: 空白だけのWikiページタイトルはnullとして扱うこと', () => {
  // Given: Wikiページタイトルを空欄にした入力。
  const input = {
    genreName: null,
    bpm: '',
    releasedAt: '',
    wikiPageTitle: '   ',
    unlockRequired: false,
  }

  // When
  const parsed = parseSongMetaEditValues(input, false)

  // Then: APIへは空文字ではなくnullを送る。
  assert.equal(parsed.ok, true)
  if (parsed.ok) {
    assert.equal(parsed.value.wikiPageTitle, null)
  }
})

test('parseSongMetaEditValues: Wikiページタイトルは300文字まで許可すること', () => {
  // Given: サロゲートペアを含む300文字と301文字のWikiページタイトル。
  const base = { genreName: null, bpm: '', releasedAt: '', unlockRequired: false }
  const maxTitle = '𠮷'.repeat(300)

  // When
  const accepted = parseSongMetaEditValues({ ...base, wikiPageTitle: maxTitle }, false)
  const rejected = parseSongMetaEditValues({ ...base, wikiPageTitle: `${maxTitle}a` }, false)

  // Then: 文字数はコードポイント単位で数える。
  assert.equal(accepted.ok, true)
  assert.equal(rejected.ok, false)
})

test('buildSongMetaUpdateRequest: 楽曲情報だけ更新し譜面は空マップ、is_newは現行値を維持すること', () => {
  // Given
  const song = createSong()

  // When
  const request = buildSongMetaUpdateRequest(song, {
    genre: 'POPS & ANIME',
    bpm: 200,
    releasedAt: '2025-07-01',
    wikiPageTitle: 'Wiki Page',
    unlockRequired: true,
  })

  // Then
  assert.equal(request.title, 'Test Song')
  assert.equal(request.artist, 'Artist')
  assert.equal(request.genre, 'POPS & ANIME')
  assert.equal(request.bpm, 200)
  assert.equal(request.released_at, '2025-07-01')
  assert.equal(request.wiki_page_title, 'Wiki Page')
  assert.equal(request.unlock_required, true)
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
    wikiPageTitle: null,
    unlockRequired: true,
  })

  // Then
  assert.equal(request.genre, 'ORIGINAL')
  assert.equal(request.bpm, null)
  assert.equal(request.is_new, true)
  assert.equal(request.released_at, null)
  assert.equal(request.wiki_page_title, null)
  assert.equal(request.unlock_required, true)
  assert.equal('charts' in request, false)
})

test('buildChartDraftsFromSong: 存在する譜面だけを難易度順のドラフトにすること', () => {
  // Given: 難易度順と逆の挿入順で譜面を配置する。
  const original = createSong()
  const song = createSong({
    charts: { MASTER: original.charts.MASTER, BASIC: original.charts.BASIC },
  })

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

test('canMarkChartConstUnknown: 定数10以上のときだけ定数不明を設定できること', () => {
  // Given / When / Then
  assert.equal(canMarkChartConstUnknown(''), false)
  assert.equal(canMarkChartConstUnknown('9.9'), false)
  assert.equal(canMarkChartConstUnknown('10'), true)
  assert.equal(canMarkChartConstUnknown('10.0'), true)
  assert.equal(canMarkChartConstUnknown('15.7'), true)
})

test('parseChartMetaDrafts: 定数10未満の譜面は定数不明をfalseにすること', () => {
  // Given
  const [basicDraft, masterDraft] = buildChartDraftsFromSong(createSong())
  assert.ok(basicDraft)
  assert.ok(masterDraft)
  const drafts = [
    { ...basicDraft, is_const_unknown: true },
    { ...masterDraft, is_const_unknown: true },
  ]

  // When
  const parsed = parseChartMetaDrafts(drafts)

  // Then
  assert.equal(parsed.ok, true)
  if (parsed.ok) {
    assert.equal(parsed.value.BASIC?.is_const_unknown, false)
    assert.equal(parsed.value.MASTER?.is_const_unknown, true)
  }
})

test('buildChartMetaUpdateRequest: 未編集の譜面と現行の楽曲フィールドを維持すること', () => {
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
  // Wikiページタイトルは省略して既存値を維持させる
  assert.equal('wiki_page_title' in request, false)
})

test('buildChartMetaUpdateRequest: 元譜面ではなく編集済みの譜面マップを載せること', () => {
  // Given: 元値とは異なる定数、ノーツ数、作者を指定した編集結果。
  const song = createSong()
  const charts = {
    BASIC: { const: 7, is_const_unknown: false, notes: 900, notes_designer: null },
    MASTER: {
      const: 15.8,
      is_const_unknown: true,
      notes: 4000,
      notes_designer: '編集後の譜面作者',
    },
  }

  // When
  const request = buildChartMetaUpdateRequest(song, charts)

  // Then: 楽曲フィールドを維持しつつ、譜面には編集後の値を採用する。
  assert.equal(request.genre, 'ORIGINAL')
  assert.equal(request.released_at, '2025-06-19')
  assert.equal(request.is_new, true)
  assert.equal('wiki_page_title' in request, false)
  assert.deepEqual(request.charts, {
    BASIC: { const: 7, is_const_unknown: false, notes: 900, notes_designer: null },
    MASTER: {
      const: 15.8,
      is_const_unknown: true,
      notes: 4000,
      notes_designer: '編集後の譜面作者',
    },
  })
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
  assert.equal(request.is_new, true)
  // Wikiページタイトルは省略して既存値を維持させる
  assert.equal('wiki_page_title' in request, false)
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

test('parseOptionalNonNegativeInteger: 桁あふれでInfinityになる数字列はinvalidにすること', () => {
  // Given: 数字だけだが数値範囲を超える入力。
  const value = '9'.repeat(400)

  // When
  const result = parseOptionalNonNegativeInteger(value)

  // Then: 有限な整数ではないためinvalidにする。
  assert.equal(result, 'invalid')
})

test('parseChartMetaDrafts: 定数Infinityはエラーにすること', () => {
  // Given: 有限ではない譜面定数。
  const drafts = [
    {
      difficulty: 'MASTER',
      const: 'Infinity',
      is_const_unknown: false,
      notes: '',
      notes_designer: '',
    },
  ] as const

  // When
  const result = parseChartMetaDrafts(drafts)

  // Then
  assert.equal(result.ok, false)
})

test('parseChartMetaDrafts: 定数0は有効として受け付けること', () => {
  // Given: 下限ちょうどの譜面定数。
  const drafts = [
    {
      difficulty: 'MASTER',
      const: '0',
      is_const_unknown: false,
      notes: '',
      notes_designer: '',
    },
  ] as const

  // When
  const result = parseChartMetaDrafts(drafts)

  // Then
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.value.MASTER?.const, 0)
  }
})

test('parseChartMetaDrafts: NOTES DESIGNERが100文字ちょうどは受け付けて101文字はエラーにすること', () => {
  // Given: 境界ちょうどと1文字超過の作者名。
  const [basicDraft] = buildChartDraftsFromSong(createSong())
  assert.ok(basicDraft)
  const acceptedDrafts = [{ ...basicDraft, notes_designer: 'あ'.repeat(100) }]
  const rejectedDrafts = [{ ...basicDraft, notes_designer: 'あ'.repeat(101) }]

  // When
  const accepted = parseChartMetaDrafts(acceptedDrafts)
  const rejected = parseChartMetaDrafts(rejectedDrafts)

  // Then
  assert.equal(accepted.ok, true)
  assert.equal(rejected.ok, false)
})

test('parseWorldsendChartMetaEditValues: NOTES DESIGNERが100文字ちょうどは受け付けて101文字はエラーにすること', () => {
  // Given: 境界ちょうどと1文字超過の作者名。
  const base = { attribute: '', levelStar: '', notes: '', notesDesigner: '' }

  // When
  const accepted = parseWorldsendChartMetaEditValues({
    ...base,
    notesDesigner: 'あ'.repeat(100),
  })
  const rejected = parseWorldsendChartMetaEditValues({
    ...base,
    notesDesigner: 'あ'.repeat(101),
  })

  // Then
  assert.equal(accepted.ok, true)
  assert.equal(rejected.ok, false)
})

test('parseWorldsendChartMetaEditValues: レベル1は有効として受け付けて0はエラーにすること', () => {
  // Given: 下限ちょうどと下限未満の星数。
  const base = { attribute: '', notes: '', notesDesigner: '' }

  // When
  const accepted = parseWorldsendChartMetaEditValues({ ...base, levelStar: '1' })
  const rejected = parseWorldsendChartMetaEditValues({ ...base, levelStar: '0' })

  // Then
  assert.equal(accepted.ok, true)
  if (accepted.ok) {
    assert.equal(accepted.value.level_star, 1)
  }
  assert.equal(rejected.ok, false)
})

for (const unlockRequired of [true, false]) {
  test(`要解禁フラグ${unlockRequired}をフォームから通常曲・WORLD'S ENDの更新へ反映すること`, () => {
    // Given: 要解禁フラグだけを切り替えた入力。
    const input = {
      genreName: 'ORIGINAL',
      bpm: '198',
      releasedAt: '2025-06-19',
      wikiPageTitle: '',
      unlockRequired,
    }

    // When
    const parsed = parseSongMetaEditValues(input, true)
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    const request = buildSongMetaUpdateRequest(
      createSong({ unlock_required: !unlockRequired }),
      parsed.value
    )
    const worldsendRequest = buildWorldsendSongMetaUpdateRequest(
      createWorldsendSong({ unlock_required: !unlockRequired }),
      parsed.value
    )

    // Then: falseも省略せず送り、既存の要解禁フラグを解除できる。
    assert.equal(parsed.value.unlockRequired, unlockRequired)
    assert.equal(request.unlock_required, unlockRequired)
    assert.equal(worldsendRequest.unlock_required, unlockRequired)
  })
}

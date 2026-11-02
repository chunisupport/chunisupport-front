import assert from 'node:assert/strict'
import test from 'node:test'
import { WORLDSEND_LEVEL_STAR_MAX, WORLDSEND_LEVEL_STAR_MIN } from '../../../../constants/chart.ts'
import { MAX_SCORE } from '../../../../utils/scoreRank.ts'
import {
  buildDefaultWorldsendFilter,
  normalizeWorldsendFilterState,
} from '../types/filterDefaults.ts'
import type { WorldsendRecordWithSongMeta } from '../types/filterTypes.ts'
import {
  createWorldsendRecordTitleMatcher,
  isWorldsendRecordMatchedWithTitleMatcher,
} from './filtering.ts'

/**
 * WORLD'S END フィルター用のテストレコードを生成する。
 *
 * @param overrides - 既定値へ上書きするレコード項目。
 * @returns テスト用 WORLD'S END レコード。
 */
const createRecord = (
  overrides: Partial<WorldsendRecordWithSongMeta> = {}
): WorldsendRecordWithSongMeta => ({
  is_played: true,
  updated_at: '2026-06-01T00:00:00Z',
  id: 'worldsend-a',
  title: 'テスト楽曲',
  artist: 'テストアーティスト',
  level_star: 4,
  attribute: '狂',
  notes: 1000,
  score: 1009000,
  justice_count: null,
  img: '',
  clear_lamp: 'CLEAR',
  combo_lamp: 'FULL COMBO',
  full_chain: null,
  genre: 'POPS',
  name_folder_code: 'TA',
  reading: 'てすとがっきょく',
  release: '2026-01-01',
  release_version: 'LUMINOUS',
  ...overrides,
})

/**
 * WORLD'S END フィルター用の検索マッチャーを生成する。
 *
 * @param title - 検索文字列。
 * @returns WORLD'S END レコード用検索マッチャー。
 */
const matcher = (title = '') => createWorldsendRecordTitleMatcher(title)

test("既定の全バージョン選択ではバージョン不明の WORLD'S END レコードを表示し、絞り込むと除外する", () => {
  // Given: 公開済みバージョンがある既定フィルターと、配信日未登録のレコード。
  const versions = [
    { name: 'CHUNITHM LUMINOUS', short_name: 'LUMINOUS', released_at: '2023-01-01' },
    { name: 'CHUNITHM VERSE', short_name: 'VERSE', released_at: '2024-12-12' },
  ]
  const filters = {
    ...buildDefaultWorldsendFilter([], versions, '2026-10-22'),
    attributes: ['狂' as const],
  }
  const unknown = createRecord({ release: null, release_version: '不明' })

  // When / Then: 全選択は未指定なので不明も含め、一部選択では不明を除外する。
  assert.equal(filters.versions, null)
  assert.equal(isWorldsendRecordMatchedWithTitleMatcher(unknown, filters, matcher()), true)
  assert.equal(
    isWorldsendRecordMatchedWithTitleMatcher(
      unknown,
      { ...filters, versions: ['VERSE'] },
      matcher()
    ),
    false
  )
  assert.equal(
    isWorldsendRecordMatchedWithTitleMatcher(
      createRecord({ release_version: 'VERSE' }),
      { ...filters, versions: ['VERSE'] },
      matcher()
    ),
    true
  )
})

test("WORLD'S END フィルターは★レベル範囲が既定の全範囲なら★未登録の譜面を表示する", () => {
  // Given: ★レベル範囲が既定（★1〜★5）のフィルター。
  const filters = normalizeWorldsendFilterState({
    attributes: ['狂'],
    levelStarRange: { min: WORLDSEND_LEVEL_STAR_MIN, max: WORLDSEND_LEVEL_STAR_MAX },
  })

  // When: ★未登録の譜面と、範囲内の★登録済み譜面を判定する。
  const unregistered = isWorldsendRecordMatchedWithTitleMatcher(
    createRecord({ level_star: null }),
    filters,
    matcher()
  )
  const registered = isWorldsendRecordMatchedWithTitleMatcher(
    createRecord({ level_star: 3 }),
    filters,
    matcher()
  )

  // Then: 既定の全範囲では未登録も登録済みも表示する。
  assert.equal(unregistered, true)
  assert.equal(registered, true)
})

test("WORLD'S END フィルターは★レベル範囲を絞ると★未登録の譜面を除外する", () => {
  // Given: 下限だけ、上限だけを既定から狭めたフィルター。
  const narrowedMin = normalizeWorldsendFilterState({
    attributes: ['狂'],
    levelStarRange: { min: WORLDSEND_LEVEL_STAR_MIN + 1, max: WORLDSEND_LEVEL_STAR_MAX },
  })
  const narrowedMax = normalizeWorldsendFilterState({
    attributes: ['狂'],
    levelStarRange: { min: WORLDSEND_LEVEL_STAR_MIN, max: WORLDSEND_LEVEL_STAR_MAX - 1 },
  })
  const record = createRecord({ level_star: null })

  // When: ★未登録の譜面を、範囲を絞ったフィルターで判定する。
  const minNarrowed = isWorldsendRecordMatchedWithTitleMatcher(record, narrowedMin, matcher())
  const maxNarrowed = isWorldsendRecordMatchedWithTitleMatcher(record, narrowedMax, matcher())

  // Then: 絞り込み時の未登録譜面の扱いは未決のため、従来どおり除外する。
  assert.equal(minNarrowed, false)
  assert.equal(maxNarrowed, false)
})

test("WORLD'S END フィルターは属性・レベル・ジャンル・バージョンを判定できる", () => {
  // Given: 属性、レベル、ジャンル、バージョンが一致するフィルター。
  const filters = normalizeWorldsendFilterState({
    attributes: ['狂'],
    levelStarRange: { min: 4, max: 4 },
    genres: ['POPS'],
    versions: ['LUMINOUS'],
  })

  // When: 一致するレコードと属性だけ異なるレコードを判定する。
  const matched = isWorldsendRecordMatchedWithTitleMatcher(createRecord(), filters, matcher())
  const mismatched = isWorldsendRecordMatchedWithTitleMatcher(
    createRecord({ attribute: '改' }),
    filters,
    matcher()
  )

  // Then: 全条件が一致するレコードだけが残る。
  assert.equal(matched, true)
  assert.equal(mismatched, false)
})

test("WORLD'S END フィルターは曲名・アーティスト・読み検索を判定できる", () => {
  // Given: アーティスト名で検索するフィルター。
  const filters = normalizeWorldsendFilterState({
    attributes: ['狂'],
    levelStarRange: { min: 4, max: 4 },
  })

  // When: アーティスト名の一部を検索条件にする。
  const matched = isWorldsendRecordMatchedWithTitleMatcher(
    createRecord(),
    filters,
    matcher('アーティスト')
  )

  // Then: アーティスト名でも一致する。
  assert.equal(matched, true)
})

test("WORLD'S END レコードは読みが空欄なら曲名を読みとして検索する", () => {
  // Given: 読みがないレコードと、濁点・小書きカナ・長音を正規化した検索条件。
  const filters = normalizeWorldsendFilterState({
    attributes: ['狂'],
    levelStarRange: { min: 4, max: 4 },
  })
  const titleMatcher = matcher('カツツコウヒウ')
  for (const reading of [undefined, null, '', ' ', '\t\n　']) {
    const record = createRecord({ title: 'ガッツ・コーヒー', reading })

    // When / Then: 曲名を読みとして使うため一致する。
    assert.equal(isWorldsendRecordMatchedWithTitleMatcher(record, filters, titleMatcher), true)
  }

  // Then: 設定済みの読みは曲名の読みで上書きしない。
  assert.equal(
    isWorldsendRecordMatchedWithTitleMatcher(
      createRecord({ title: 'ガッツ・コーヒー', reading: 'ソラ' }),
      filters,
      titleMatcher
    ),
    false
  )
})

test("WORLD'S END フィルターはスコア・JUSTICE数・ランプ・未プレイ除外を判定できる", () => {
  // Given: AJのJUSTICE数とランプを指定したフィルター。
  const filters = normalizeWorldsendFilterState({
    attributes: ['狂'],
    levelStarRange: { min: 4, max: 4 },
    score: { min: 1000000, max: 1010000 },
    justiceCount: { min: 1, max: 3 },
    combo_lamp: ['ALL JUSTICE'],
    chain_lamp: ['FULL CHAIN GOLD'],
    hard_lamp: ['HARD'],
    excludeNoPlay: true,
  })

  // When: 条件を満たすレコードと未プレイレコードを判定する。
  const matched = isWorldsendRecordMatchedWithTitleMatcher(
    createRecord({
      score: 1009000,
      justice_count: 2,
      combo_lamp: 'ALL JUSTICE',
      full_chain: 'FULL CHAIN GOLD',
      clear_lamp: 'HARD',
    }),
    filters,
    matcher()
  )
  const noPlayed = isWorldsendRecordMatchedWithTitleMatcher(
    createRecord({ is_played: false }),
    filters,
    matcher()
  )

  // Then: 条件を満たすプレイ済みレコードだけが残る。
  assert.equal(matched, true)
  assert.equal(noPlayed, false)
})

test("WORLD'S END フィルターはJUSTICE数指定中もAJCのコンボランプ条件を適用する", () => {
  // Given: JUSTICE数が範囲内にあるAJCと通常AJ、およびAJCだけを選択したフィルター。
  const filters = normalizeWorldsendFilterState({
    attributes: ['狂'],
    levelStarRange: { min: 4, max: 4 },
    justiceCount: { min: 0, max: 5 },
    combo_lamp: ['ALL JUSTICE CRITICAL'],
  })
  const allJusticeCritical = createRecord({
    combo_lamp: 'ALL JUSTICE',
    score: MAX_SCORE,
    justice_count: 0,
  })
  const allJustice = createRecord({
    combo_lamp: 'ALL JUSTICE',
    score: MAX_SCORE - 1,
    justice_count: 2,
  })

  // When: JUSTICE数とコンボランプの複合条件でレコードを判定する。
  const criticalMatched = isWorldsendRecordMatchedWithTitleMatcher(
    allJusticeCritical,
    filters,
    matcher()
  )
  const justiceMatched = isWorldsendRecordMatchedWithTitleMatcher(allJustice, filters, matcher())

  // Then: 両方の条件を満たすAJCだけが残る。
  assert.equal(criticalMatched, true)
  assert.equal(justiceMatched, false)
})

test("WORLD'S END フィルターはALL JUSTICE CRITICALをコンボランプ条件として判定できる", () => {
  // Given: AJC だけを選択したフィルター。
  const filters = normalizeWorldsendFilterState({
    attributes: ['狂'],
    levelStarRange: { min: 4, max: 4 },
    combo_lamp: ['ALL JUSTICE CRITICAL'],
  })

  // When: 理論値と非理論値の ALL JUSTICE レコードをフィルターする。
  const matched = isWorldsendRecordMatchedWithTitleMatcher(
    createRecord({ combo_lamp: 'ALL JUSTICE', score: MAX_SCORE }),
    filters,
    matcher()
  )
  const nonCritical = isWorldsendRecordMatchedWithTitleMatcher(
    createRecord({ combo_lamp: 'ALL JUSTICE', score: MAX_SCORE - 1 }),
    filters,
    matcher()
  )

  // Then: 理論値の ALL JUSTICE だけが一致する。
  assert.equal(matched, true)
  assert.equal(nonCritical, false)
})

test("WORLD'S END フィルターは楽曲名順を判定できる", () => {
  // Given: 楽曲名順を指定したフィルターと、全フォルダ対象・全解除のフィルター。
  const baseFilter = { attributes: ['狂'], levelStarRange: { min: 4, max: 4 } }
  const selected = normalizeWorldsendFilterState({ ...baseFilter, nameFolders: ['TA'] })
  const all = normalizeWorldsendFilterState({ ...baseFilter, nameFolders: null })
  const cleared = normalizeWorldsendFilterState({ ...baseFilter, nameFolders: [] })

  // When: 楽曲名順が異なるレコードや楽曲マスタにないレコードを判定する。
  const matched = isWorldsendRecordMatchedWithTitleMatcher(createRecord(), selected, matcher())
  const otherFolder = isWorldsendRecordMatchedWithTitleMatcher(
    createRecord({ name_folder_code: 'A' }),
    selected,
    matcher()
  )
  const unknownFolder = isWorldsendRecordMatchedWithTitleMatcher(
    createRecord({ name_folder_code: null }),
    selected,
    matcher()
  )
  const unknownFolderWithAll = isWorldsendRecordMatchedWithTitleMatcher(
    createRecord({ name_folder_code: null }),
    all,
    matcher()
  )
  const clearedResult = isWorldsendRecordMatchedWithTitleMatcher(createRecord(), cleared, matcher())

  // Then: 指定フォルダだけ一致し、全フォルダ対象は不明も含め一致し、全解除は一致しない。
  assert.equal(matched, true)
  assert.equal(otherFolder, false)
  assert.equal(unknownFolder, false)
  assert.equal(unknownFolderWithAll, true)
  assert.equal(clearedResult, false)
})

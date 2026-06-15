import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeWorldsendFilterState } from '../types/filterDefaults.ts'
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

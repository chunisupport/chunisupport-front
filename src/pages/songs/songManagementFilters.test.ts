import assert from 'node:assert/strict'
import test from 'node:test'
import type { ManagedSongDTO, ManagedWorldsendSongDTO } from '../../types/api'
import {
  createSongManagementFilters,
  filterManagedSongs,
  filterManagedWorldsendSongs,
  hasMissingManagedSongField,
} from './songManagementFilters'

/**
 * 欠落判定テスト用の通常譜面を生成する。
 *
 * @param notes - ノーツ数。
 * @param notesDesigner - NOTES DESIGNER。
 * @returns 通常譜面DTO。
 */
const chart = (notes: number | null, notesDesigner: string | null) => ({
  const: 10,
  is_const_unknown: false,
  notes,
  notes_designer: notesDesigner,
})

const standardSong: ManagedSongDTO = {
  id: '1',
  title: '通常曲',
  reading: null,
  artist: 'artist',
  genre: 'POPS & ANIME',
  bpm: 180,
  release: '2025-01-01',
  official_idx: '1',
  jacket: null,
  maxop: 0,
  is_maxop_unknown: false,
  op_target_difficulty: null,
  is_new: false,
  charts: {
    BASIC: chart(100, null),
    ADVANCED: chart(200, null),
    EXPERT: chart(300, 'EXP担当'),
    MASTER: chart(400, 'MAS担当'),
  },
  is_deleted: false,
  updated_at: '2025-01-01T00:00:00Z',
}

const worldsendSong: ManagedWorldsendSongDTO = {
  id: '2',
  title: "WORLD'S END曲",
  reading: null,
  artist: 'artist',
  genre: null,
  bpm: 180,
  release: '2025-01-01',
  official_idx: '2',
  jacket: null,
  charts: { WORLDSEND: { attribute: '狂', level_star: 3, notes: 500, notes_designer: 'WE担当' } },
  is_deleted: false,
  updated_at: '2025-01-01T00:00:00Z',
}

const versions = [{ name: 'CHUNITHM VERSE', released_at: '2024-12-12' }]

test('通常曲のノーツ数はBASICからMASTERと存在するULTIMAの欠落を判定する', () => {
  // Given: 必須譜面のノーツが揃い、ULTIMAを持たない通常曲。
  const missingMaster = {
    ...standardSong,
    charts: { ...standardSong.charts, MASTER: chart(null, 'MAS担当') },
  }
  const missingUltima = {
    ...standardSong,
    charts: { ...standardSong.charts, ULTIMA: chart(null, 'ULT担当') },
  }

  // When & Then: 任意のULTIMA不在は欠落にせず、存在する対象譜面の欠落を検出する。
  assert.equal(hasMissingManagedSongField(standardSong, 'notes'), false)
  assert.equal(hasMissingManagedSongField(missingMaster, 'notes'), true)
  assert.equal(hasMissingManagedSongField(missingUltima, 'notes'), true)
})

test('NOTES DESIGNERはBASICとADVANCEDを除外してEXPERT以降を判定する', () => {
  // Given: BASICとADVANCEDだけが未設定の通常曲と、EXPERTが空白の通常曲。
  const expertMissing = {
    ...standardSong,
    charts: { ...standardSong.charts, EXPERT: chart(300, '  ') },
  }

  // When & Then: 対象外難易度は無視し、EXPERTの空白値は欠落とする。
  assert.equal(hasMissingManagedSongField(standardSong, 'notesDesigner'), false)
  assert.equal(hasMissingManagedSongField(expertMissing, 'notesDesigner'), true)
})

test('ジャンル・バージョン・追加日はAND条件で通常曲を絞り込む', () => {
  // Given: すべての属性条件が一致するフィルター。
  const filters = {
    ...createSongManagementFilters(),
    genres: ['POPS & ANIME'],
    versions: ['CHUNITHM VERSE'],
    releaseMin: '2025-01-01',
    releaseMax: '2025-01-01',
  }

  // When: 通常曲へ条件を適用する。
  const result = filterManagedSongs([standardSong], filters, versions)

  // Then: 境界日を含めて一致する。
  assert.deepEqual(result, [standardSong])
})

test('選択した項目が欠落したWORLD’S END曲だけを表示する', () => {
  // Given: NOTES DESIGNER欠落のみを表示するフィルター。
  const originalChart = worldsendSong.charts.WORLDSEND
  assert.ok(originalChart)
  const missing = {
    ...worldsendSong,
    charts: { WORLDSEND: { ...originalChart, notes_designer: null } },
  }
  const filters = {
    ...createSongManagementFilters(),
    missingField: 'notesDesigner' as const,
    missingOnly: true,
  }

  // When: WORLD'S END曲へ条件を適用する。
  const result = filterManagedWorldsendSongs([worldsendSong, missing], filters, versions)

  // Then: 欠落曲だけを返す。
  assert.deepEqual(result, [missing])
})

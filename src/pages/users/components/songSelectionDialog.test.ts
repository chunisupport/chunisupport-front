import assert from 'node:assert/strict'
import test from 'node:test'
import type { SongDTO } from '../../../types/api'
import {
  buildDefaultSongSelectionFilter,
  getSongSelectionRowClass,
  getSongSelectionSearchFrameClass,
  getSongSelectionSearchIconClass,
  hasSongSelectionFilterChanges,
  sortSongSelectionCandidates,
} from './songSelectionDialog'

/**
 * 共通楽曲選択ロジックのテスト用楽曲を生成する。
 *
 * @param overrides - 上書きする楽曲情報。
 * @returns テスト用楽曲。
 */
const createSong = (overrides: Partial<SongDTO>): SongDTO =>
  ({
    id: 'song',
    title: '楽曲',
    artist: 'アーティスト',
    genre: 'ORIGINAL',
    release: '2026-01-01',
    official_idx: '1',
    charts: {},
    ...overrides,
  }) as SongDTO

test('楽曲選択候補はリリース日、公式番号の新しい順に並ぶこと', () => {
  // Given
  const songs = [
    createSong({ id: 'old', release: '2025-01-01', official_idx: '100' }),
    createSong({ id: 'new-low', release: '2026-01-01', official_idx: '10' }),
    createSong({ id: 'new-high', release: '2026-01-01', official_idx: '20' }),
  ]

  // When
  const result = sortSongSelectionCandidates(songs)

  // Then
  assert.deepEqual(
    result.map((song) => song.id),
    ['new-high', 'new-low', 'old']
  )
  assert.deepEqual(
    songs.map((song) => song.id),
    ['old', 'new-low', 'new-high']
  )
})

test('楽曲選択フィルターはジャンルとバージョンの差分を判定すること', () => {
  // Given
  const defaultFilter = buildDefaultSongSelectionFilter(['ORIGINAL'], ['VERSE'])

  // When & Then
  assert.equal(hasSongSelectionFilterChanges(defaultFilter, defaultFilter), false)
  assert.equal(hasSongSelectionFilterChanges({ ...defaultFilter, genres: [] }, defaultFilter), true)
})

test('楽曲選択UIは状態に応じてアクセントカラーのクラスを返すこと', () => {
  // Given
  const active = true
  const inactive = false

  // When
  const activeSearchFrameClass = getSongSelectionSearchFrameClass(active)
  const activeSearchIconClass = getSongSelectionSearchIconClass(active)
  const selectedRowClass = getSongSelectionRowClass(active)
  const inactiveRowClass = getSongSelectionRowClass(inactive)

  // Then
  assert.match(activeSearchFrameClass, /bg-action-primary-muted/)
  assert.match(activeSearchIconClass, /text-action-primary/)
  assert.match(selectedRowClass, /bg-action-primary/)
  assert.doesNotMatch(inactiveRowClass, /action-primary/)
})

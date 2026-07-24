import assert from 'node:assert/strict'
import test from 'node:test'
import type { SongDTO } from '../../../types/api'
import {
  buildDefaultSongSelectionFilter,
  getSongSelectionRowClass,
  getSongSelectionSearchFrameClass,
  getSongSelectionSearchIconClass,
  hasSameSelectionKeys,
  hasSongSelectionFilterChanges,
  sortSongSelectionCandidates,
  toggleSelectionKey,
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

test('保存済みとdraftの選択キーは順序に依存せず比較できること', () => {
  // Given
  const saved = new Set(['song-1', 'song-2'])

  // When & Then
  assert.equal(hasSameSelectionKeys(saved, new Set(['song-2', 'song-1'])), true)
  assert.equal(hasSameSelectionKeys(saved, new Set(['song-1'])), false)
  assert.equal(hasSameSelectionKeys(saved, new Set(['song-1', 'song-3'])), false)
})

test('選択キーの切り替えは元のSetを変更せず上限を守ること', () => {
  // Given
  const selected = new Set(['song-1'])

  // When
  const limited = toggleSelectionKey(selected, 'song-2', 1)
  const removed = toggleSelectionKey(selected, 'song-1', 1)

  // Then
  assert.deepEqual([...selected], ['song-1'])
  assert.deepEqual([...limited], ['song-1'])
  assert.deepEqual([...removed], [])
})

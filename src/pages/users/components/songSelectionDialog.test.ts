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

test('楽曲選択フィルターは同じ条件なら差分なしと判定すること', () => {
  // Given
  const defaultFilter = buildDefaultSongSelectionFilter(['ORIGINAL'], ['VERSE'])

  // When
  const changed = hasSongSelectionFilterChanges(defaultFilter, defaultFilter)

  // Then
  assert.equal(changed, false)
})

for (const { label, difference } of [
  { label: 'ジャンル', difference: { genres: [] } },
  { label: 'バージョン', difference: { versions: [] } },
]) {
  test(`楽曲選択フィルターは${label}だけが異なる場合に差分ありと判定すること`, () => {
    // Given
    const defaultFilter = buildDefaultSongSelectionFilter(['ORIGINAL'], ['VERSE'])
    const current = { ...defaultFilter, ...difference }

    // When
    const changed = hasSongSelectionFilterChanges(current, defaultFilter)

    // Then
    assert.equal(changed, true)
  })
}

test('楽曲選択フィルターは楽曲名順を全選択の null とし、選択時の差分を判定すること', () => {
  // Given
  const defaultFilter = buildDefaultSongSelectionFilter(['ORIGINAL'], ['VERSE'])

  // When & Then
  assert.equal(defaultFilter.nameFolders, null)
  assert.equal(
    hasSongSelectionFilterChanges({ ...defaultFilter, nameFolders: ['A'] }, defaultFilter),
    true
  )
  assert.equal(
    hasSongSelectionFilterChanges({ ...defaultFilter, nameFolders: [] }, defaultFilter),
    true
  )
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

for (const { caseName, limit } of [
  { caseName: '上限がない場合', limit: undefined },
  { caseName: '選択数が上限未満の場合', limit: 2 },
]) {
  test(`選択キーの切り替えは${caseName}に未選択キーを追加すること`, () => {
    // Given
    const selected = new Set(['song-1'])

    // When
    const result = toggleSelectionKey(selected, 'song-2', limit)

    // Then: 既存の選択を保って追加し、元のSetは変更しない。
    assert.deepEqual([...result], ['song-1', 'song-2'])
    assert.deepEqual([...selected], ['song-1'])
  })
}

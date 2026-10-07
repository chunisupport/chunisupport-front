import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../../test/setupTestEnvironment'
import type { SongDTO } from '../../types/api'

test('統計用の所属フォルダは読みから再判定せずAPIのコードとマスタを使用する', async () => {
  // Given
  const song: SongDTO = {
    id: 'song-1',
    title: 'Alphabet',
    reading: 'アイウエオ',
    name_folder_code: 'CUSTOM',
    artist: '',
    genre: 'ORIGINAL',
    bpm: null,
    release: null,
    jacket: null,
    maxop: 0,
    is_maxop_unknown: false,
    op_target_difficulty: null,
    is_new: false,
    unlock_required: false,
    charts: {},
  }
  installFetchRecorder((input) => {
    const path = new URL(String(input)).pathname
    if (path === '/internal/songs/updated-at') return Response.json({ updated_at: null })
    if (path === '/internal/songs') return Response.json({ songs: [song] })
    if (path === '/internal/master/versions') return Response.json({ versions: [] })
    if (path === '/internal/master') {
      return Response.json({
        genres: [],
        name_folders: [
          { code: 'CUSTOM', name: 'APIの分類', sort_order: 20 },
          { code: 'A', name: 'APIのあ行', sort_order: 10 },
        ],
      })
    }
    throw new Error(`unexpected fetch: ${path}`)
  })
  const { fetchPlayerStatsChartMetadata } = await loadTestModule(
    () => import('./fetchTheoreticalTargetDifficulties')
  )

  // When
  const result = await fetchPlayerStatsChartMetadata()

  // Then
  assert.equal(result.attributesBySongId.get(song.id)?.nameFolder, 'CUSTOM')
  assert.deepEqual(result.nameFolders, ['A', 'CUSTOM'])
  assert.deepEqual(
    [...result.shortNames.nameFolder],
    [
      ['A', 'APIのあ行'],
      ['CUSTOM', 'APIの分類'],
    ]
  )
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { installFetchRecorder, loadTestModule } from '../test/setupTestEnvironment'
import type * as GenresApi from './genres'

/**
 * モジュール内キャッシュをテストごとに分離して genres API を読み込む。
 * @returns genres API モジュール。
 */
const loadGenresApi = () =>
  loadTestModule<typeof GenresApi>((cacheKey) => import(`./genres.ts?cache=${cacheKey}`))

test('requestGenres はジャンル個別APIから取得し、ID順に正規化する', async () => {
  // Given
  const genres = [
    { id: 2, name: 'niconico', short_name: 'nico' },
    { id: 1, name: 'POPS & ANIME', short_name: 'P&A' },
  ]
  const calls = installFetchRecorder(() => Response.json({ genres }))
  const { requestGenres } = await loadGenresApi()

  // When
  const first = await requestGenres()

  // Then
  assert.equal(calls.length, 1)
  assert.ok(String(calls[0]?.input).endsWith('/internal/master/genres'))
  assert.deepEqual(
    first.map((genre) => genre.id),
    [1, 2]
  )
})

test('requestGenres はジャンルが無い場合に空配列へ正規化する', async () => {
  // Given
  installFetchRecorder(() => Response.json({}))
  const { requestGenres } = await loadGenresApi()

  // When
  const genres = await requestGenres()

  // Then
  assert.deepEqual(genres, [])
})

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

test('requestGenres はジャンル個別APIから取得し、APIの表示順を保つ', async () => {
  // Given: APIはDBの数値IDを返さず、表示順に並べたジャンルを返す。
  const genres = [
    { name: 'POPS & ANIME', short_name: 'P&A' },
    { name: 'niconico', short_name: 'nico' },
  ]
  const calls = installFetchRecorder(() => Response.json({ genres }))
  const { requestGenres } = await loadGenresApi()

  // When
  const first = await requestGenres()

  // Then
  assert.equal(calls.length, 1)
  assert.ok(String(calls[0]?.input).endsWith('/internal/master/genres'))
  assert.deepEqual(
    first.map((genre) => genre.name),
    ['POPS & ANIME', 'niconico']
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

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

test('fetchGenres はジャンル個別APIから取得し、セッション中に再利用する', async () => {
  // Given
  const genres = [
    { id: 2, name: 'niconico', short_name: 'nico' },
    { id: 1, name: 'POPS & ANIME', short_name: 'P&A' },
  ]
  const calls = installFetchRecorder(() => Response.json({ genres }))
  const { fetchGenres } = await loadGenresApi()

  // When
  const first = await fetchGenres()
  const second = await fetchGenres()

  // Then
  assert.equal(calls.length, 1)
  assert.ok(String(calls[0]?.input).endsWith('/internal/master/genres'))
  assert.deepEqual(
    first.map((genre) => genre.id),
    [1, 2]
  )
  assert.equal(first, second)
})

test('fetchGenres は同時呼び出しを同じリクエストにまとめる', async () => {
  // Given
  let fetchCount = 0
  installFetchRecorder(async () => {
    fetchCount += 1
    await new Promise((resolve) => setTimeout(resolve, 10))
    return Response.json({ genres: [{ id: 1, name: 'POPS & ANIME', short_name: 'P&A' }] })
  })
  const { fetchGenres } = await loadGenresApi()

  // When
  const [first, second] = await Promise.all([fetchGenres(), fetchGenres()])

  // Then
  assert.equal(fetchCount, 1)
  assert.equal(first, second)
})

test('fetchGenres は失敗後に再試行できる', async () => {
  // Given
  let fetchCount = 0
  installFetchRecorder(() => {
    fetchCount += 1
    if (fetchCount === 1) {
      throw new Error('network error')
    }
    return Response.json({ genres: [{ id: 1, name: 'POPS & ANIME', short_name: 'P&A' }] })
  })
  const { fetchGenres } = await loadGenresApi()

  // When
  await assert.rejects(() => fetchGenres(), /network error/)
  const genres = await fetchGenres()

  // Then
  assert.equal(fetchCount, 2)
  assert.deepEqual(genres, [{ id: 1, name: 'POPS & ANIME', short_name: 'P&A' }])
})

test('fetchGenres はジャンルが無い場合に空配列へ正規化する', async () => {
  // Given
  installFetchRecorder(() => Response.json({}))
  const { fetchGenres } = await loadGenresApi()

  // When
  const genres = await fetchGenres()

  // Then
  assert.deepEqual(genres, [])
})

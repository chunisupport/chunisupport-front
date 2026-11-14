import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { promisify } from 'node:util'
import { setupTestEnvironment } from '../test/setupTestEnvironment'

const execFileAsync = promisify(execFile)

/**
 * ブラウザ向け Solid の実行条件で共有楽曲 store を検証する。
 * 楽曲一覧 API (`songsPath`) への `fetch` は1回目だけ通信エラーにし、以降は成功させる。
 * それ以外の API は通信エラーにして、キャッシュを経由しない取得経路に固定する。
 *
 * @param script - `store`・`calls()`・`flush()`・`waitUntil()` を使う検証コード。
 * @param songsPath - 失敗させる楽曲一覧 API のパス。
 * @returns 検証終了時に解決する Promise。
 */
const runBrowserTest = async (script: string, songsPath: string): Promise<void> => {
  setupTestEnvironment()
  const { stderr } = await execFileAsync(process.execPath, [
    '--conditions=browser',
    '--import',
    './scripts/register-ts-extension-loader.mjs',
    '--disable-warning=ExperimentalWarning',
    '--input-type=module',
    '--eval',
    `
import assert from 'node:assert/strict'

let songsCalls = 0
globalThis.fetch = async (input) => {
  const url = String(input)
  if (url.endsWith(${JSON.stringify(songsPath)})) {
    songsCalls += 1
    if (songsCalls === 1) throw new TypeError('network error')
    return new Response(JSON.stringify({ songs: [{ title: 'A' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  throw new TypeError('network error')
}

const { useSongsData } = await import('./src/stores/songsData.ts')
const store = useSongsData()
const calls = () => songsCalls
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
const waitUntil = async (predicate, timeoutMs = 5000) => {
  const deadline = Date.now() + timeoutMs
  while (!predicate()) {
    if (Date.now() > deadline) assert.fail('store did not settle')
    await flush()
  }
}

${script}
`,
  ])

  assert.equal(stderr, '')
}

test('通常楽曲の初回取得に失敗した後、再度ensureすると再取得して復帰すること', async () => {
  await runBrowserTest(
    `
// Given: 初回取得が失敗している
store.ensureSongsLoaded()
await waitUntil(() => store.songsResponse.state === 'errored')
assert.equal(calls(), 1)

// When: 別画面から再度取得を要求する
store.ensureSongsLoaded()
await waitUntil(() => store.songsResponse.state === 'ready')

// Then: 再取得され、成功済みなら追加の取得は行わない
assert.equal(calls(), 2)
assert.deepEqual(store.songsResponse()?.songs, [{ title: 'A' }])
store.ensureSongsLoaded()
await flush()
assert.equal(calls(), 2)
`,
    '/internal/songs'
  )
})

test("WORLD'S END楽曲の初回取得に失敗した後、再度ensureすると再取得して復帰すること", async () => {
  await runBrowserTest(
    `
// Given: 初回取得が失敗している
store.ensureWorldsendSongsLoaded()
await waitUntil(() => store.worldsendSongsResponse.state === 'errored')
assert.equal(calls(), 1)

// When: 別画面から再度取得を要求する
store.ensureWorldsendSongsLoaded()
await waitUntil(() => store.worldsendSongsResponse.state === 'ready')

// Then: 再取得され、成功済みなら追加の取得は行わない
assert.equal(calls(), 2)
assert.deepEqual(store.worldsendSongsResponse()?.songs, [{ title: 'A' }])
store.ensureWorldsendSongsLoaded()
await flush()
assert.equal(calls(), 2)
`,
    '/internal/worldsend-songs'
  )
})

for (const shouldFail of [false, true]) {
  test(`通常楽曲は再検証の完了前に表示でき、再検証${shouldFail ? '失敗時も表示を維持' : '成功時は外部更新を反映'}すること`, async () => {
    await runBrowserTest(
      `
// Given: 表示可能なキャッシュがあり、更新日時 API の応答は保留されている。
await import('fake-indexeddb/auto')
const { replaceCachedSongs } = await import('./src/repositories/songCacheRepository.ts')
const cachedSong = { id: 'cached', title: 'Cached', unlock_required: false, name_folder_code: 'NUMBER' }
const fetchedSong = { ...cachedSong, title: 'Updated' }
await replaceCachedSongs([cachedSong], 'old')
let resolveUpdatedAt
const updatedAtResponse = new Promise((resolve) => { resolveUpdatedAt = resolve })
globalThis.fetch = async (input) => {
  if (String(input).endsWith('/updated-at')) return updatedAtResponse
  if (${shouldFail}) throw new TypeError('network error')
  return Response.json({ songs: [fetchedSong] })
}

// When: 更新日時の応答前にキャッシュを表示する。
store.ensureSongsLoaded()
await waitUntil(() => !store.isSongsLoading())
assert.deepEqual(store.songsResponse().songs, [cachedSong])
assert.equal(store.songsResponse.loading, true)
resolveUpdatedAt(Response.json({ updated_at: 'new' }))

// Then: 取得成功時は最新楽曲へ差し替え、失敗時はキャッシュ表示を維持する。
await waitUntil(() => !store.songsResponse.loading)
assert.deepEqual(store.songsResponse().songs, [${shouldFail ? 'cachedSong' : 'fetchedSong'}])
assert.equal(store.songsResponse.error, undefined)
${
  shouldFail
    ? `
// When: 通信復旧後に同じ store を再度利用する。
globalThis.fetch = async () => Response.json({ songs: [fetchedSong] })
store.ensureSongsLoaded()
await waitUntil(() => !store.songsResponse.loading)
// Then: 背景再検証の失敗からも最新データへ復帰する。
assert.deepEqual(store.songsResponse().songs, [fetchedSong])
`
    : ''
}
`,
      '/internal/songs'
    )
  })
}

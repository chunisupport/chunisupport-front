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
 * @param script - `store`・`calls()`・`flush()` を使う検証コード。
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
await flush()
await flush()
assert.equal(calls(), 1)
assert.equal(store.songsResponse.state, 'errored')

// When: 別画面から再度取得を要求する
store.ensureSongsLoaded()
await flush()
await flush()

// Then: 再取得され、成功済みなら追加の取得は行わない
assert.equal(calls(), 2)
assert.equal(store.songsResponse.state, 'ready')
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
await flush()
await flush()
assert.equal(calls(), 1)
assert.equal(store.worldsendSongsResponse.state, 'errored')

// When: 別画面から再度取得を要求する
store.ensureWorldsendSongsLoaded()
await flush()
await flush()

// Then: 再取得され、成功済みなら追加の取得は行わない
assert.equal(calls(), 2)
assert.equal(store.worldsendSongsResponse.state, 'ready')
store.ensureWorldsendSongsLoaded()
await flush()
assert.equal(calls(), 2)
`,
    '/internal/worldsend-songs'
  )
})

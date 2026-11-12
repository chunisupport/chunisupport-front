import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { promisify } from 'node:util'
import { setupTestEnvironment } from '../test/setupTestEnvironment'

/**
 * テスト用のAPI環境変数を設定して、ソート関数を遅延読み込みする。
 *
 * @returns リリース日降順+idx降順ソート関数。
 */
const loadSortSongsByReleaseDescAndIdxDesc = async () => {
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_FRONTEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_DOCUMENTATION_URL = 'https://docs.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_URL = 'https://dist.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_ENTRYPOINT = 'main.js'
  process.env.PUBLIC_FB_API_KEY = 'test-api-key'
  process.env.PUBLIC_FB_AUTH_DOMAIN = 'test.firebaseapp.com'
  process.env.PUBLIC_FB_PROJECT_ID = 'test-project'
  process.env.PUBLIC_FB_STORAGE_BUCKET = 'test.appspot.com'
  process.env.PUBLIC_FB_MESSAGING_SENDER_ID = '123456789'
  process.env.PUBLIC_FB_APP_ID = 'test-app-id'
  process.env.PUBLIC_CF_TURNSTILE_SITE_KEY = '1x00000000000000000000AA'

  const { sortSongsByReleaseDescAndIdxDesc } = await import('./songsData.ts')
  return sortSongsByReleaseDescAndIdxDesc
}

/**
 * ブラウザ向け Solid の実行条件で共有楽曲storeの初期状態を検証する。
 *
 * @param script - `store` を使う検証コード。
 * @returns 検証終了時に解決する Promise。
 */
const runBrowserAssertion = async (script: string): Promise<void> => {
  setupTestEnvironment()
  const execFileAsync = promisify(execFile)
  const { stderr } = await execFileAsync(process.execPath, [
    '--conditions=browser',
    '--import',
    './scripts/register-ts-extension-loader.mjs',
    '--disable-warning=ExperimentalWarning',
    '--input-type=module',
    '--eval',
    `
import assert from 'node:assert/strict'
const { useSongsData } = await import('./src/stores/songsData.ts')
const store = useSongsData()
${script}
`,
  ])

  assert.equal(stderr, '')
}

test('リリース日を優先し（降順）、同日内はofficial_idxを数値降順でソートする', async () => {
  const sortSongsByReleaseDescAndIdxDesc = await loadSortSongsByReleaseDescAndIdxDesc()
  const songs = [
    { title: 'C', release: '2024-01-02', official_idx: '10' },
    { title: 'A', release: '2024-01-01', official_idx: '2' },
    { title: 'B', release: '2024-01-01', official_idx: '11' },
    { title: 'D', release: '2024-01-03', official_idx: '1' },
  ]

  const sorted = sortSongsByReleaseDescAndIdxDesc(songs)

  assert.deepEqual(
    sorted.map((song) => song.title),
    ['D', 'C', 'B', 'A']
  )
})

test('official_idxが非数値の場合は同日の末尾に寄せる（降順ソート時も）', async () => {
  const sortSongsByReleaseDescAndIdxDesc = await loadSortSongsByReleaseDescAndIdxDesc()
  const songs = [
    { title: '数値あり', release: '2024-01-01', official_idx: '3' },
    { title: '非数値', release: '2024-01-01', official_idx: 'X3' },
    { title: '空文字', release: '2024-01-01', official_idx: '' },
  ]

  const sorted = sortSongsByReleaseDescAndIdxDesc(songs)

  assert.deepEqual(
    sorted.map((song) => song.title),
    ['数値あり', '空文字', '非数値']
  )
})

test('releaseが不正または未設定の曲は先頭へ寄せる', async () => {
  // Given: 日付あり・未設定・不正日付の楽曲
  const sortSongsByReleaseDescAndIdxDesc = await loadSortSongsByReleaseDescAndIdxDesc()
  const songs = [
    { title: '日付あり', release: '2024-01-01', official_idx: '2' },
    { title: '日付なし', release: null, official_idx: '1' },
    { title: '不正日付', release: 'invalid', official_idx: '3' },
  ]

  // When
  const sorted = sortSongsByReleaseDescAndIdxDesc(songs)

  // Then: 日付がない曲同士は official_idx 降順で先頭に並ぶ
  assert.deepEqual(
    sorted.map((song) => song.title),
    ['不正日付', '日付なし', '日付あり']
  )
})

test('通常楽曲は初回要求前は読み込み中になる', async () => {
  // Given: 一度も要求していない共有store（別プロセスの初期状態で検証する）
  // When: 通常楽曲の表示可否を確認する
  // Then: 未要求のため読み込み中になる
  await runBrowserAssertion('assert.equal(store.isSongsLoading(), true)')
})

test("WORLD'S END楽曲は初回要求前は読み込み中になる", async () => {
  // Given: 一度も要求していない共有store（別プロセスの初期状態で検証する）
  // When: WORLD'S END楽曲の表示可否を確認する
  // Then: 未要求のため読み込み中になる
  await runBrowserAssertion('assert.equal(store.isWorldsendSongsLoading(), true)')
})

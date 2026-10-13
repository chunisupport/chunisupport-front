import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_SONG_LIST_VIEW_MODE, SONG_LIST_VIEW_MODE_STORAGE_KEY } from './constants'

let moduleVersion = 0

/**
 * 再読み込み時と同様に、保存済み設定から一覧表示状態を初期化する。
 *
 * @returns 新しく初期化した一覧表示状態のモジュール。
 */
const loadViewMode = () =>
  import(new URL(`./songListViewMode.ts?test=${moduleVersion++}`, import.meta.url).href)

/**
 * テスト中だけ window.localStorage を差し替える。
 *
 * @param localStorage - テスト用ストレージ。
 * @param run - 差し替え中に実行する処理。
 * @returns テスト完了時に解決するPromise。
 */
const withLocalStorage = async (
  localStorage: Pick<Storage, 'getItem' | 'setItem'>,
  run: () => Promise<void>
): Promise<void> => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
  })
  try {
    await run()
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
    else Reflect.deleteProperty(globalThis, 'window')
  }
}

for (const stored of ['card', 'table', null, '', 'invalid', 'TABLE', ' table ']) {
  test(`楽曲一覧は保存値 ${JSON.stringify(stored)} から表示形式を初期化する`, async () => {
    // Given: 保存済みの表示形式、または未設定・不正な値。
    await withLocalStorage(
      {
        getItem: (key) => {
          assert.equal(key, SONG_LIST_VIEW_MODE_STORAGE_KEY)
          return stored
        },
        setItem: () => {},
      },
      async () => {
        // When: アプリ起動時の表示状態を初期化する。
        const { songListViewMode } = await loadViewMode()

        // Then: 有効な保存値だけを復元し、それ以外はカード表示になる。
        assert.equal(DEFAULT_SONG_LIST_VIEW_MODE, 'card')
        assert.equal(songListViewMode(), stored === 'table' ? 'table' : 'card')
      }
    )
  })
}

test('表示形式を切り替えると保存され、再読み込みしても復元される', async () => {
  // Given: 初回アクセスの保存先。
  const stored = new Map<string, string>()
  await withLocalStorage(
    {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => {
        stored.set(key, value)
      },
    },
    async () => {
      const first = await loadViewMode()

      // When: 表表示に切り替え、アプリを再読み込みする。
      assert.equal(first.toggleSongListViewMode(), 'table')
      assert.equal(first.songListViewMode(), 'table')
      assert.equal(stored.get(SONG_LIST_VIEW_MODE_STORAGE_KEY), 'table')
      const second = await loadViewMode()

      // Then: 表表示が復元され、カードへ戻した場合も次回起動に引き継がれる。
      assert.equal(second.songListViewMode(), 'table')
      assert.equal(second.toggleSongListViewMode(), 'card')
      assert.equal(second.songListViewMode(), 'card')
      assert.equal(stored.get(SONG_LIST_VIEW_MODE_STORAGE_KEY), 'card')
      assert.equal((await loadViewMode()).songListViewMode(), 'card')
    }
  )
})

test('ストレージの読み書きに失敗しても表示形式を切り替えられる', async () => {
  // Given: localStorage の読み書きが拒否される環境。
  await withLocalStorage(
    {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    },
    async () => {
      // When: 表示状態を初期化して切り替える。
      const viewMode = await loadViewMode()

      // Then: 初期状態はカードで、例外なく両方向へ切り替えられる。
      assert.equal(viewMode.songListViewMode(), 'card')
      assert.equal(viewMode.toggleSongListViewMode(), 'table')
      assert.equal(viewMode.songListViewMode(), 'table')
      assert.equal(viewMode.toggleSongListViewMode(), 'card')
      assert.equal(viewMode.songListViewMode(), 'card')
    }
  )
})

test('window がない環境でもカード表示で初期化して切り替えられる', async () => {
  // Given: ブラウザの window が存在しない環境。
  assert.equal(typeof window, 'undefined')

  // When: 表示状態を初期化する。
  const viewMode = await loadViewMode()

  // Then: 読み書きに失敗しても表示状態を利用できる。
  assert.equal(viewMode.songListViewMode(), 'card')
  assert.equal(viewMode.toggleSongListViewMode(), 'table')
  assert.equal(viewMode.songListViewMode(), 'table')
})

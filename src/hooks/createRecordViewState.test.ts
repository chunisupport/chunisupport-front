import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * ブラウザ向け Solid の実行条件でレコード表示状態 Primitive を検証する。
 * `setup(overrides)` で既定設定を上書きした Primitive を生成し、`flush()` で非同期処理を待てる。
 * URL クエリの初期値は `initialSearchParams` で指定する。
 *
 * @param script - Primitive を操作する検証コード。
 * @returns 検証終了時に解決する Promise。
 */
const runBrowserTest = async (script: string): Promise<void> => {
  const { stderr } = await execFileAsync(process.execPath, [
    '--conditions=browser',
    '--import',
    './scripts/register-ts-extension-loader.mjs',
    '--disable-warning=ExperimentalWarning',
    '--input-type=module',
    '--eval',
    `
import assert from 'node:assert/strict'
import { createRoot, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { createRecordViewState } from './src/hooks/createRecordViewState.ts'

const DEFAULT_SORT = [
  { key: 'score', direction: 'desc' },
  { key: 'level', direction: 'desc' },
  { key: 'title', direction: 'asc' },
]
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
const useViewState = createRecordViewState()

const setup = ({ initialSearchParams = {}, ...overrides } = {}) => {
  const calls = { restore: 0, savedFilters: [], savedColumns: [] }
  const [source, setSource] = createSignal(undefined)
  const [searchParams, setSearchParamsStore] = createStore(initialSearchParams)
  const setSearchParams = (params) => setSearchParamsStore(params)
  return createRoot((dispose) => ({
    dispose,
    calls,
    setSource,
    searchParams,
    setSearchParamsStore,
    state: useViewState({
      key: () => 'alice',
      initialFilter: { title: '' },
      filterRestoreSource: source,
      restoreFilter: async (value) => {
        calls.restore += 1
        return { title: value }
      },
      defaultFilter: () => ({ title: 'default' }),
      saveFilter: async (filter) => {
        calls.savedFilters.push(filter)
      },
      defaultColumnIds: ['a', 'b'],
      sanitizeColumnIds: (ids) => ids.filter((id) => id !== 'invalid'),
      readColumns: async () => null,
      saveColumns: async (ids) => {
        calls.savedColumns.push(ids)
      },
      defaultSortConditions: DEFAULT_SORT,
      parseSortParams: (params) =>
        params.sortcol
          ? { initialSortKey: params.sortcol, initialSortOrder: params.sortorder }
          : { initialSortKey: 'score', initialSortOrder: 'desc' },
      searchParams,
      setSearchParams,
      ...overrides,
    }),
  }))
}
${script}
`,
  ])
  assert.equal(stderr, '')
}

test('復元元データが揃った時点でフィルターを1回だけ復元し、列読込後に ready になる', async () => {
  await runBrowserTest(`
// Given
const view = setup({ readColumns: async () => ['b', 'invalid'] })
await flush()
assert.equal(view.state.ready(), false)

// When
view.setSource('saved')
await flush()
view.setSource('changed')
await flush()

// Then
assert.deepEqual(view.state.filters(), { title: 'saved' })
assert.deepEqual(view.state.visibleColumnIds(), ['b'])
assert.equal(view.calls.restore, 1)
assert.equal(view.state.ready(), true)
view.dispose()
`)
})

test('他画面から渡されたフィルターは後から完了した復元に上書きされず、復元待ちでも ready になる', async () => {
  await runBrowserTest(`
// Given
let resolveRestore
const view = setup({
  restoreFilter: () => new Promise((resolve) => { resolveRestore = resolve }),
})
view.setSource('saved')
await flush()

// When
view.state.overrideFilter({ title: 'transferred' })
await flush()
const readyBeforeRestore = view.state.ready()
resolveRestore({ title: 'saved' })
await flush()

// Then
assert.equal(readyBeforeRestore, true)
assert.deepEqual(view.state.filters(), { title: 'transferred' })
assert.deepEqual(view.calls.savedFilters, [])
view.dispose()
`)
})

test('setFilters はフィルターを永続化しない', async () => {
  await runBrowserTest(`
// Given
const view = setup()

// When
view.state.setFilters({ title: 'temporary' })
await flush()

// Then
assert.deepEqual(view.state.filters(), { title: 'temporary' })
assert.deepEqual(view.calls.savedFilters, [])
view.dispose()
`)
})

test('表示列の読込に失敗した場合は既定の表示列のまま ready になる', async () => {
  await runBrowserTest(`
// Given
const view = setup({ readColumns: async () => { throw new Error('failed') } })

// When
view.setSource('saved')
await flush()

// Then
assert.deepEqual(view.state.visibleColumnIds(), ['a', 'b'])
assert.equal(view.state.ready(), true)
view.dispose()
`)
})

test('永続化に失敗しても画面上のフィルターと表示列は更新する', async () => {
  await runBrowserTest(`
// Given
const view = setup({
  saveFilter: async () => { throw new Error('failed') },
  saveColumns: async () => { throw new Error('failed') },
})

// When
view.state.applyFilters({ title: 'next' })
view.state.applyVisibleColumns(['invalid', 'a'])
await flush()

// Then
assert.deepEqual(view.state.filters(), { title: 'next' })
assert.deepEqual(view.state.visibleColumnIds(), ['a'])
view.dispose()
`)
})

test('列クリックで第1ソートだけを切り替え、リセットでフィルターとソートを既定値へ戻す', async () => {
  await runBrowserTest(`
// Given
const view = setup()

// When
view.state.handleSortChange('level')
const afterFirstClick = view.state.sortConditions()
view.state.handleSortChange('level')
const afterSecondClick = view.state.primarySort()
view.state.resetFiltersAndSort()

// Then
assert.deepEqual(afterFirstClick, [
  { key: 'level', direction: 'asc' },
  { key: 'level', direction: 'desc' },
  { key: 'title', direction: 'asc' },
])
assert.deepEqual(afterSecondClick, { key: 'level', direction: 'desc' })
assert.deepEqual(view.state.filters(), { title: 'default' })
assert.deepEqual(view.calls.savedFilters, [{ title: 'default' }])
assert.deepEqual(view.state.sortConditions(), DEFAULT_SORT)
assert.notEqual(view.state.sortConditions()[0], DEFAULT_SORT[0])
view.dispose()
`)
})

test('URLのソートクエリは表示中の変更にも追従して反映し、反映後にクエリを取り除く', async () => {
  await runBrowserTest(`
// Given
const view = setup({ initialSearchParams: { sortcol: 'title', sortorder: 'asc' } })
await flush()
const initialPrimarySort = view.state.primarySort()
const initialSortcol = view.searchParams.sortcol

// When
view.setSearchParamsStore({ sortcol: 'level', sortorder: 'desc' })
await flush()

// Then
assert.deepEqual(initialPrimarySort, { key: 'title', direction: 'asc' })
assert.equal(initialSortcol, undefined)
assert.deepEqual(view.state.primarySort(), { key: 'level', direction: 'desc' })
assert.equal(view.searchParams.sortcol, undefined)
view.dispose()
`)
})

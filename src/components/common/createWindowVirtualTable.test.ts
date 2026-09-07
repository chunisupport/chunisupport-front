import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const BROWSER_SOLID_TEST_SETUP = `
import assert from 'node:assert/strict'
import { createRoot, createSignal } from 'solid-js'
import { createWindowVirtualTable } from './src/components/common/createWindowVirtualTable.ts'

const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0))

class FakeResizeObserver {
  constructor(callback) {
    this.callback = callback
  }

  observe(element) {
    this.callback([
      {
        borderBoxSize: [
          {
            inlineSize: element.offsetWidth ?? 100,
            blockSize: element.offsetHeight ?? 100,
          },
        ],
      },
    ])
  }

  unobserve() {}

  disconnect() {
    globalThis.__resizeObserverDisconnectCount =
      (globalThis.__resizeObserverDisconnectCount ?? 0) + 1
  }
}

const fakeWindow = {
  ResizeObserver: FakeResizeObserver,
  addEventListener() {},
  removeEventListener() {},
  requestAnimationFrame: (callback) => setTimeout(callback, 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
  performance: { now: () => Date.now() },
}
const fakeDocument = {
  documentElement: { scrollHeight: 1000, clientHeight: 100 },
  defaultView: fakeWindow,
}

globalThis.document = {
  getElementById: () => null,
  ...fakeDocument,
}
globalThis.window = fakeWindow
globalThis.ResizeObserver = FakeResizeObserver

const createFakeScrollElement = (scrollTop = 40) => {
  const scrollElement = {
    scrollCalls: [],
    scrollTop,
    scrollHeight: 1000,
    clientHeight: 100,
    offsetHeight: 100,
    offsetWidth: 100,
    ownerDocument: fakeDocument,
    getBoundingClientRect: () => ({ top: 10, height: 100, width: 100 }),
    scrollTo: (options) => {
      scrollElement.scrollCalls.push(options)
      scrollElement.scrollTop = options.top
    },
    addEventListener() {},
    removeEventListener() {},
  }
  return scrollElement
}

const createFakeElement = (top, height = 30) => ({
  offsetHeight: height,
  offsetWidth: 100,
  getBoundingClientRect: () => ({ top, height, width: 100 }),
})
`

const runBrowserSolidTest = async (script: string) => {
  const { stderr } = await execFileAsync(
    process.execPath,
    [
      '--conditions=browser',
      '--import',
      './scripts/register-ts-extension-loader.mjs',
      '--disable-warning=ExperimentalWarning',
      '--input-type=module',
      '--eval',
      `${BROWSER_SOLID_TEST_SETUP}\n${script}`,
    ],
    { cwd: process.cwd() }
  )

  assert.equal(stderr, '')
}

test('createWindowVirtualTableは本文位置からscrollMarginを算出すること', async () => {
  // Given: スクロール要素から15px下に本文があるテーブル
  const script = `
await new Promise((resolve) =>
  createRoot(async (dispose) => {
    const [rowCount] = createSignal(3)
    const scrollElement = createFakeScrollElement(40)
    const table = createWindowVirtualTable({
      rowCount,
      rowHeight: 10,
      getScrollElement: () => scrollElement,
    })

    table.setTableBodyRef(createFakeElement(25))
    table.setTableContainerRef(createFakeElement(20))

    // When: レイアウト監視とmicrotaskを反映する
    await nextTask()
    await nextTask()

    // Then: 本文top - scroll要素top + scrollTop がscrollMarginになる
    assert.equal(table.scrollMargin(), 15)
    dispose()
    resolve()
  })
)
`

  await runBrowserSolidTest(script)
})

test('createWindowVirtualTableのresetToTopは先頭へスクロールすること', async () => {
  // Given: 下方向へスクロール済みの仮想テーブル
  const script = `
await new Promise((resolve) =>
  createRoot(async (dispose) => {
    const [rowCount] = createSignal(3)
    const scrollElement = createFakeScrollElement(120)
    const table = createWindowVirtualTable({
      rowCount,
      rowHeight: 10,
      getScrollElement: () => scrollElement,
    })

    table.setTableBodyRef(createFakeElement(25))
    table.setTableContainerRef(createFakeElement(20))
    await nextTask()

    // When: 先頭スクロールを要求する
    table.resetToTop()
    await nextTask()
    await nextTask()

    // Then: スクロール位置が先頭へ戻る
    assert.equal(scrollElement.scrollTop, 0)
    dispose()
    resolve()
  })
)
`

  await runBrowserSolidTest(script)
})

test('initialOffset指定時は初回アタッチでその位置へスクロールし先頭リセットしないこと', async () => {
  // Given: 復元位置を指定した仮想テーブル
  const script = `
await new Promise((resolve) =>
  createRoot(async (dispose) => {
    const [rowCount] = createSignal(3)
    const scrollElement = createFakeScrollElement(0)
    const table = createWindowVirtualTable({
      rowCount,
      rowHeight: 10,
      resetOnRowCountChange: true,
      initialOffset: 120,
      getScrollElement: () => scrollElement,
    })

    table.setTableBodyRef(createFakeElement(25))
    table.setTableContainerRef(createFakeElement(20))

    // When: 初回マウントのeffectを反映する
    await nextTask()
    await nextTask()

    // Then: 指定オフセットを維持する
    assert.equal(scrollElement.scrollTop, 120)
    dispose()
    resolve()
  })
)
`

  await runBrowserSolidTest(script)
})

test('resetOnRowCountChange有効時は同じ行数の再計算では先頭へスクロールしないこと', async () => {
  // Given: 行配列の参照だけが変わる仮想テーブル
  const script = `
await new Promise((resolve) =>
  createRoot(async (dispose) => {
    const [rows, setRows] = createSignal([1, 2, 3])
    const scrollElement = createFakeScrollElement(120)
    const table = createWindowVirtualTable({
      rowCount: () => rows().length,
      rowHeight: 10,
      resetOnRowCountChange: true,
      getScrollElement: () => scrollElement,
    })

    table.setTableBodyRef(createFakeElement(25))
    table.setTableContainerRef(createFakeElement(20))
    await nextTask()
    await nextTask()
    scrollElement.scrollTop = 120
    const callCountBeforeSameLengthUpdate = scrollElement.scrollCalls.length

    // When: 行数は同じまま配列だけ更新する
    setRows([4, 5, 6])
    await nextTask()
    await nextTask()

    // Then: 先頭スクロールしない
    assert.equal(scrollElement.scrollCalls.length, callCountBeforeSameLengthUpdate)
    assert.equal(scrollElement.scrollTop, 120)
    dispose()
    resolve()
  })
)
`

  await runBrowserSolidTest(script)
})

test('resetOnRowCountChange有効時は行数変化で先頭へスクロールすること', async () => {
  // Given: 行数変化時リセットが有効な仮想テーブル
  const script = `
await new Promise((resolve) =>
  createRoot(async (dispose) => {
    const [rowCount, setRowCount] = createSignal(3)
    const scrollElement = createFakeScrollElement(120)
    const table = createWindowVirtualTable({
      rowCount,
      rowHeight: 10,
      resetOnRowCountChange: true,
      getScrollElement: () => scrollElement,
    })

    table.setTableBodyRef(createFakeElement(25))
    table.setTableContainerRef(createFakeElement(20))
    await nextTask()
    await nextTask()
    scrollElement.scrollTop = 120
    const callCountBeforeRowCountChange = scrollElement.scrollCalls.length

    // When: フィルター適用などで行数が変化する
    setRowCount(1)
    await nextTask()
    await nextTask()

    // Then: 先頭スクロールが要求される
    assert.equal(scrollElement.scrollCalls.length, callCountBeforeRowCountChange + 1)
    dispose()
    resolve()
  })
)
`

  await runBrowserSolidTest(script)
})

test('virtualRowsは現在の行数を超えた仮想行を除外すること', async () => {
  // Given: 仮想化済みの行を持つテーブル
  const script = `
await new Promise((resolve) =>
  createRoot(async (dispose) => {
    const [rowCount, setRowCount] = createSignal(3)
    const scrollElement = createFakeScrollElement(0)
    const table = createWindowVirtualTable({
      rowCount,
      rowHeight: 10,
      resetOnRowCountChange: true,
      getScrollElement: () => scrollElement,
    })

    table.setTableBodyRef(createFakeElement(25))
    table.setTableContainerRef(createFakeElement(20))
    await nextTask()
    await nextTask()

    // When: 行数が仮想化済み範囲より少なくなる
    setRowCount(1)
    await nextTask()
    await nextTask()

    // Then: 現在の行数に収まる仮想行だけが返る
    assert.deepEqual(
      table.virtualRows().map((virtualRow) => virtualRow.index),
      [0]
    )
    dispose()
    resolve()
  })
)
`

  await runBrowserSolidTest(script)
})

test('非表示テーブルは初期化と行数変更で共有スクロール領域を動かさない', async () => {
  await runBrowserSolidTest(`
const view = createRoot((dispose) => {
  const [rowCount, setRowCount] = createSignal(100)
  const [enabled, setEnabled] = createSignal(false)
  const scrollElement = createFakeScrollElement(640)
  const table = createWindowVirtualTable({
    rowCount,
    rowHeight: 10,
    enabled,
    initialOffset: () => scrollElement.scrollTop,
    resetOnRowCountChange: true,
    getScrollElement: () => scrollElement,
  })
  table.setTableBodyRef(createFakeElement(25))
  table.setTableContainerRef(createFakeElement(20))
  return { dispose, setRowCount, setEnabled, scrollElement, table }
})
await nextTask()
view.setRowCount(50)
await nextTask()
assert.deepEqual(view.scrollElement.scrollCalls, [])
assert.equal(view.scrollElement.scrollTop, 640)

view.setEnabled(true)
await nextTask()
await nextTask()
assert.equal(view.scrollElement.scrollTop, 640)
assert.ok(view.table.virtualRows().length > 0)

view.setEnabled(false)
await nextTask()
view.scrollElement.scrollTop = 240
view.setEnabled(true)
await nextTask()
await nextTask()
assert.equal(view.scrollElement.scrollTop, 240)
view.dispose()
`)
})

test('非同期に行が揃った仮想テーブルで深い位置を復元し、末尾付近の行を描画する', async () => {
  await runBrowserSolidTest(`
const view = createRoot((dispose) => {
  const [rowCount, setRowCount] = createSignal(0)
  const [enabled, setEnabled] = createSignal(false)
  const scrollElement = createFakeScrollElement(0)
  scrollElement.scrollHeight = 10000
  const table = createWindowVirtualTable({
    rowCount,
    rowHeight: 10,
    enabled,
    initialOffset: 9500,
    resetOnRowCountChange: true,
    getScrollElement: () => scrollElement,
  })
  table.setTableBodyRef({
    getBoundingClientRect: () => ({ top: 10 - scrollElement.scrollTop }),
  })
  table.setTableContainerRef(createFakeElement(10))
  return { dispose, setRowCount, setEnabled, scrollElement, table }
})
await nextTask()
view.setRowCount(1000)
await nextTask()
view.setEnabled(true)
await nextTask()
await nextTask()
assert.equal(view.scrollElement.scrollTop, 9500)
assert.equal(view.table.scrollMargin(), 0)
assert.ok(view.table.virtualRows().some((row) => row.index === 950))
view.dispose()
`)
})

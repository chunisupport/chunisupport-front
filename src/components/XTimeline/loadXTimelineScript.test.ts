import assert from 'node:assert/strict'
import test from 'node:test'
import { X_TIMELINE_SCRIPT_SRC } from './constants'
import {
  createXTimelineScriptLoader,
  type XTimelineScriptElement,
  type XTimelineScriptHost,
  type XTimelineWidgets,
} from './loadXTimelineScript'

type FakeHost = XTimelineScriptHost & {
  appended: XTimelineScriptElement[]
  fire: (type: string) => void
  setWidgets: (widgets: XTimelineWidgets | undefined) => void
}

/**
 * スクリプトタグとウィジェットAPIを差し替えられる文書を作る。
 *
 * @param existingScripts - すでに文書へ入っているスクリプトの一覧。
 * @returns ローダーへ渡せるホスト。
 */
const createFakeHost = (existingScripts: XTimelineScriptElement[] = []): FakeHost => {
  const listeners = new Map<string, Array<() => void>>()
  const appended: XTimelineScriptElement[] = []
  let widgets: XTimelineWidgets | undefined
  const script: XTimelineScriptElement = {
    src: '',
    async: false,
    addEventListener: (type, listener) => {
      const list = listeners.get(type) ?? []
      list.push(listener)
      listeners.set(type, list)
    },
  }

  return {
    appended,
    document: {
      querySelector: (selector) =>
        [...existingScripts, ...appended].find(
          (node) => selector === `script[src="${node.src}"]`
        ) ?? null,
      createElement: () => script,
      head: {
        append: (node) => {
          appended.push(node)
        },
      },
    },
    readWidgets: () => widgets,
    fire: (type) => {
      for (const listener of listeners.get(type) ?? []) listener()
    },
    setWidgets: (next) => {
      widgets = next
    },
  }
}

test('未挿入のときだけ widgets.js を1つ追加し、同時呼び出しは同じPromiseを返す', async () => {
  // Given: まだスクリプトもAPIもない文書。
  const load = createXTimelineScriptLoader()
  const host = createFakeHost()
  const widgets: XTimelineWidgets = { widgets: { load: () => {} } }

  // When: 続けて読み込み、load 後にAPIを公開する。
  const first = load(host)
  const second = load(host)
  host.setWidgets(widgets)
  host.fire('load')
  const resolved = await Promise.all([first, second])

  // Then: スクリプトは1つだけで、同じAPIを返す。
  assert.equal(first, second)
  assert.equal(host.appended.length, 1)
  assert.equal(host.appended[0]?.src, X_TIMELINE_SCRIPT_SRC)
  assert.equal(host.appended[0]?.async, true)
  assert.deepEqual(resolved, [widgets, widgets])
})

test('APIが既にあるときはスクリプトを追加しない', async () => {
  // Given: widgets.js のAPIが既に使える。
  const load = createXTimelineScriptLoader()
  const host = createFakeHost()
  const widgets: XTimelineWidgets = { widgets: { load: () => {} } }
  host.setWidgets(widgets)

  // When: 読み込む。
  const resolved = await load(host)

  // Then: 既存APIを返し、スクリプトは増やさない。
  assert.equal(resolved, widgets)
  assert.equal(host.appended.length, 0)
})

test('既存のスクリプトタグがあるときは追加しない', async () => {
  // Given: 同じURLのスクリプトが既に文書にある。
  const listeners = new Map<string, Array<() => void>>()
  const existing: XTimelineScriptElement = {
    src: 'https://platform.x.com/widgets.js',
    async: true,
    addEventListener: (type, listener) => {
      const list = listeners.get(type) ?? []
      list.push(listener)
      listeners.set(type, list)
    },
  }
  const load = createXTimelineScriptLoader()
  const unrelated: XTimelineScriptElement = {
    src: 'https://example.com/unrelated.js',
    async: true,
    addEventListener: () => assert.fail('無関係なタグを再利用してはいけない'),
  }
  const host = createFakeHost([unrelated, existing])
  const widgets: XTimelineWidgets = { widgets: { load: () => {} } }

  // When: 既存タグの load でAPIが現れる。
  const pending = load(host)
  assert.equal(listeners.get('load')?.length, 1)
  host.setWidgets(widgets)
  for (const listener of listeners.get('load') ?? []) listener()

  // Then: タグを増やさずAPIを返す。
  assert.equal(await pending, widgets)
  assert.equal(host.appended.length, 0)
})

test('無関係なURLのタグしかない場合は対象スクリプトを追加する', async () => {
  // Given: widgets.js ではないスクリプトだけがある文書
  const unrelated: XTimelineScriptElement = {
    src: 'https://example.com/unrelated.js',
    async: true,
    addEventListener: () => assert.fail('無関係なタグを再利用してはいけない'),
  }
  const host = createFakeHost([unrelated])
  const load = createXTimelineScriptLoader()
  const widgets: XTimelineWidgets = { widgets: { load: () => {} } }

  // When: 対象スクリプトを読み込む
  const pending = load(host)
  host.setWidgets(widgets)
  host.fire('load')

  // Then: 無関係なタグは使わず、正しいURLのタグを新しく追加する
  assert.equal(host.appended.length, 1)
  assert.equal(host.appended[0]?.src, 'https://platform.x.com/widgets.js')
  assert.notEqual(host.appended[0], unrelated)
  assert.equal(await pending, widgets)
})

test('読み込みに失敗したPromiseを再実行してもスクリプトを増やさない', async () => {
  // Given: スクリプトの取得に失敗する文書。
  const load = createXTimelineScriptLoader()
  const host = createFakeHost()

  // When: 失敗後にもう一度読み込む。
  const first = load(host)
  host.fire('error')
  const second = load(host)

  // Then: どちらも同じ失敗になり、タグは1つのまま。
  await assert.rejects(first, { message: 'Failed to load X widget script.' })
  await assert.rejects(second, { message: 'Failed to load X widget script.' })
  assert.equal(first, second)
  assert.equal(host.appended.length, 1)
})

test('load後にAPIが無いときは失敗する', async () => {
  // Given: スクリプトは読めだがAPIを公開しない文書。
  const load = createXTimelineScriptLoader()
  const host = createFakeHost()

  // When: load だけが届く。
  const pending = load(host)
  host.fire('load')

  // Then: API未提供として失敗する。
  await assert.rejects(pending, { message: 'X widget API is not available.' })
})

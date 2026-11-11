import assert from 'node:assert/strict'
import test from 'node:test'
import {
  appDialogBodyClass,
  appDialogContentClass,
  appDialogOverlayClass,
  focusDialogContentOnOpen,
  guardDialogOpenChange,
} from './appDialogUtils'

test('送信中の閉鎖要求は通知せず、開く要求と送信完了後の閉鎖は通知する', () => {
  // Given: 送信中
  const calls: boolean[] = []
  const notify = (open: boolean): void => {
    calls.push(open)
  }

  // When: 閉じる、開く、送信完了後に閉じる
  const blocked = guardDialogOpenChange(false, true, notify)
  const opened = guardDialogOpenChange(true, true, notify)
  const closed = guardDialogOpenChange(false, false, notify)

  // Then: 送信中の閉鎖だけが捨てられる
  assert.equal(blocked, false)
  assert.equal(opened, true)
  assert.equal(closed, true)
  assert.deepEqual(calls, [true, false])
})

test('開いた直後の自動フォーカスはダイアログ本体へ移し、本体が無いときも既定フォーカスを止める', () => {
  // Given: 自動フォーカスイベントと、フォーカスを記録する本体
  let prevented = false
  let focused = false
  const event = {
    preventDefault: () => {
      prevented = true
    },
  } as Event
  const content = {
    focus: () => {
      focused = true
    },
  } as unknown as HTMLElement

  // When: 本体がある場合とない場合
  focusDialogContentOnOpen(event, content)
  focusDialogContentOnOpen(event, undefined)

  // Then: 既定のフォーカスは両方で止まり、本体があるときだけ focus する
  assert.equal(prevented, true)
  assert.equal(focused, true)
})

test('オーバーレイは重なり順ごとに1段上の階層を使う', () => {
  // Given / When: 各階層
  const base = appDialogOverlayClass('base')
  const raised = appDialogOverlayClass('raised')
  const stacked = appDialogOverlayClass('stacked')
  const modal = appDialogOverlayClass('modal')
  const top = appDialogOverlayClass('top')
  const nav = appDialogOverlayClass('nav')

  // Then: 背景は共通で、z-index だけが階層に対応する
  assert.equal(base, 'fixed inset-0 bg-overlay z-40')
  assert.equal(raised, 'fixed inset-0 bg-overlay z-50')
  assert.equal(stacked, 'fixed inset-0 bg-overlay z-60')
  assert.equal(modal, 'fixed inset-0 bg-overlay z-70')
  assert.equal(top, 'fixed inset-0 bg-overlay z-80')
  assert.equal(nav, 'fixed inset-0 bg-overlay z-50')
})

test('中央の編集ダイアログ枠は最大高さと幅を持ち、本文スクロールを枠に持たない', () => {
  // Given / When: 管理画面の編集ダイアログと同じ枠
  const content = appDialogContentClass({
    placement: 'center',
    size: 'lg',
    height: 'max90',
    layer: 'base',
  })

  // Then: 既存の中央ダイアログと同じトークンで、スクロールは枠に付かない
  assert.equal(
    content,
    'fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-surface shadow-lg p-6'
  )
  assert.equal(content.includes('overflow-y-auto'), false)
})

test('全画面に近いダイアログ枠は狭い画面で上下に寄せ、広い画面では中央の固定高さになる', () => {
  // Given / When: 楽曲選択と同じ枠
  const content = appDialogContentClass({
    placement: 'viewport',
    size: '2xl',
    height: 'viewportFill',
    layer: 'base',
  })

  // Then: モバイルは余白付きの全面、sm 以上は 90dvh
  assert.equal(
    content,
    'fixed inset-x-4 top-4 bottom-4 z-50 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] sm:h-[90dvh] sm:max-h-[90dvh] flex-col rounded-lg bg-surface shadow-lg p-4 sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[92vw] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6'
  )
})

test('ランダム選曲の詳細設定枠は内容の高さに沿い、広い画面では上限だけを付ける', () => {
  // Given / When: 詳細設定と同じ枠
  const content = appDialogContentClass({
    placement: 'viewport',
    size: '3xl',
    height: 'viewportCap',
    layer: 'raised',
  })

  // Then: 固定高さは付けず、sm 以上の最大幅だけ 3xl になる
  assert.match(content, /max-h-\[calc\(100dvh-2rem\)\]/)
  assert.match(content, /sm:max-h-\[90dvh\]/)
  assert.match(content, /sm:max-w-3xl/)
  assert.equal(content.includes('sm:h-['), false)
  assert.match(content, /z-60/)
})

test('縦位置だけ中央の入れ子ダイアログはシート枠になり、スクロールは本文へ分ける', () => {
  // Given / When: 楽曲選択のフィルター
  const content = appDialogContentClass({
    placement: 'sheet',
    size: 'md',
    height: 'max80',
    layer: 'stacked',
  })
  const body = appDialogBodyClass('grow', 'space-y-5 pr-1 text-sm')

  // Then: 枠は最大 80dvh、本文だけがスクロールする
  assert.match(content, /top-1\/2/)
  assert.match(content, /max-h-\[80dvh\]/)
  assert.match(content, /z-70/)
  assert.match(content, /sm:max-w-md/)
  assert.equal(body, 'min-h-0 flex-1 overflow-y-auto space-y-5 pr-1 text-sm')
})

test('高いフィルター枠と固定高さの枠は、それぞれの高さクラスを維持する', () => {
  // Given / When: 楽曲フィルターとプレイヤー統計
  const tall = appDialogContentClass({
    placement: 'center',
    size: 'md',
    height: 'tall',
    layer: 'base',
  })
  const fixed = appDialogContentClass({
    placement: 'center',
    size: 'md',
    height: 'fixed160',
    layer: 'base',
    bordered: true,
  })

  // Then: 既存の高さ指定が残る
  assert.match(tall, /h-5\/6 max-h-11\/12/)
  assert.match(fixed, /h-160 max-h-\[calc\(100dvh-2rem\)\]/)
  assert.match(fixed, /border border-border-strong/)
})

test('目標グループ管理のシートは狭い画面で画面高、広い画面で固定の高さになる', () => {
  // Given / When: グループ管理
  const content = appDialogContentClass({
    placement: 'sheet',
    size: 'md',
    height: 'manage',
    layer: 'stacked',
    overflowHidden: true,
  })

  // Then: sm 以上だけ h-128 になり、枠の溢れは隠す
  assert.match(content, /h-\[calc\(100dvh-2rem\)\] max-h-\[calc\(100dvh-2rem\)\] sm:h-128/)
  assert.match(content, /overflow-hidden/)
  assert.equal(content.includes('overflow-y-auto'), false)
})

test('本文クラスはスクロール方法ごとに分かれ、none ではラッパーを作らない', () => {
  // Given / When: 各スクロール
  const fill = appDialogBodyClass('fill', 'mt-4 space-y-5')
  const cap = appDialogBodyClass('cap', 'mt-4 space-y-5')
  const none = appDialogBodyClass('none', 'mt-4')

  // Then: fill は残り高さを取り、cap は内容高、none はクラスを返さない
  assert.equal(fill, 'min-h-0 flex-1 basis-0 overflow-y-auto mt-4 space-y-5')
  assert.equal(cap, 'min-h-0 overflow-y-auto mt-4 space-y-5')
  assert.equal(none, undefined)
})

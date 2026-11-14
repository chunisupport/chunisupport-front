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

test('開いた直後は既定フォーカスを止めてダイアログ本体へ移す', () => {
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

  // When: 本体が接続されている状態で開く
  focusDialogContentOnOpen(event, content)

  // Then: 既定のフォーカスを止め、本体へフォーカスする
  assert.equal(prevented, true)
  assert.equal(focused, true)
})

test('開いた直後にダイアログ本体が無い場合も既定フォーカスを止める', () => {
  // Given: 本体が未接続の自動フォーカスイベント
  const event = new Event('openAutoFocus', { cancelable: true })

  // When: 本体なしで開く
  focusDialogContentOnOpen(event, undefined)

  // Then: 既定のフォーカスを止める
  assert.equal(event.defaultPrevented, true)
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

  // Then: 中央配置・最大高さ・幅の契約を満たし、外枠はスクロールしない
  const classes = new Set(content.split(/\s+/))
  for (const token of [
    'fixed',
    'left-1/2',
    'top-1/2',
    '-translate-x-1/2',
    '-translate-y-1/2',
    'flex',
    'flex-col',
    'max-h-[90dvh]',
    'w-[90vw]',
    'max-w-lg',
  ]) {
    assert.ok(classes.has(token), `必要なクラス: ${token}`)
  }
  assert.equal(
    [...classes].some((token) => /(^|:)overflow(?:-[xy])?-(auto|scroll)$/.test(token)),
    false
  )
})

test('基本階層のダイアログ枠はオーバーレイより1段上の階層に置く', () => {
  // Given / When: 基本階層のオーバーレイと枠
  const overlay = appDialogOverlayClass('base').split(/\s+/)
  const content = appDialogContentClass({
    placement: 'center',
    size: 'lg',
    height: 'max90',
    layer: 'base',
  }).split(/\s+/)

  // Then: オーバーレイは z-40、枠は z-50 になる
  assert.ok(overlay.includes('z-40'))
  assert.ok(content.includes('z-50'))
})

for (const { label, option, token } of [
  { label: '選択禁止', option: { selectNone: true }, token: 'select-none' },
  { label: 'はみ出しの非表示', option: { overflowHidden: true }, token: 'overflow-hidden' },
  { label: '枠線', option: { bordered: true }, token: 'border-border-strong' },
]) {
  test(`ダイアログ枠の${label}は指定したときだけ付く`, () => {
    // Given: 追加の見た目を指定しない枠と、1つだけ指定した枠
    const base = { placement: 'center', size: 'lg', height: 'max90', layer: 'base' } as const

    // When
    const plain = appDialogContentClass(base).split(/\s+/)
    const modified = appDialogContentClass({ ...base, ...option }).split(/\s+/)

    // Then: 未指定では付かず、指定すると付く
    assert.equal(plain.includes(token), false)
    assert.equal(modified.includes(token), true)
  })
}

test('全画面に近いダイアログ枠は狭い画面で上下に寄せ、広い画面では中央の固定高さになる', () => {
  // Given / When: 楽曲選択と同じ枠
  const content = appDialogContentClass({
    placement: 'viewport',
    size: '2xl',
    height: 'viewportFill',
    layer: 'base',
  })

  // Then: 狭い画面の上下余白と、sm 以上の中央配置・固定高さ、本文だけをスクロールさせる縦並びに必要なクラスを持つ
  const classes = new Set(content.split(/\s+/))
  for (const token of [
    'fixed',
    'inset-x-4',
    'top-4',
    'bottom-4',
    'flex',
    'flex-col',
    'h-[calc(100dvh-2rem)]',
    'max-h-[calc(100dvh-2rem)]',
    'sm:h-[90dvh]',
    'sm:max-h-[90dvh]',
    'sm:bottom-auto',
    'sm:left-1/2',
    'sm:right-auto',
    'sm:top-1/2',
    'sm:w-[92vw]',
    'sm:max-w-2xl',
    'sm:-translate-x-1/2',
    'sm:-translate-y-1/2',
  ]) {
    assert.ok(classes.has(token), `必要なクラス: ${token}`)
  }
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

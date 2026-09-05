import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearAppMainScrollOffsets,
  getAppMainScrollOffset,
  getAppMainScrollTop,
  isHistoryPopNavigation,
  rememberAppMainScrollNavigationTarget,
  resolveRestoredAppMainScrollOffset,
  restoreAppMainScrollOffset,
  saveAppMainScrollOffset,
} from './appMainScrollRestoration'

test('履歴の戻る/進む遷移だけを pop と判定すること', () => {
  // Given / When / Then
  assert.equal(isHistoryPopNavigation(-1), true)
  assert.equal(isHistoryPopNavigation(1), true)
  assert.equal(isHistoryPopNavigation('/songs'), false)
  assert.equal(isHistoryPopNavigation('/tools'), false)
})

test('サイドバーなどの新規遷移では保存済み位置を復元しないこと', () => {
  // Given
  clearAppMainScrollOffsets()
  rememberAppMainScrollNavigationTarget('/tools')

  // When
  const restoredOffset = resolveRestoredAppMainScrollOffset(1280)

  // Then
  assert.equal(restoredOffset, 0)
})

test('履歴の戻る/進むでは保存済み位置を復元すること', () => {
  // Given
  clearAppMainScrollOffsets()
  rememberAppMainScrollNavigationTarget(-1)

  // When
  const restoredOffset = resolveRestoredAppMainScrollOffset(1280)

  // Then
  assert.equal(restoredOffset, 1280)
})

test('パスごとにスクロール位置を保存・取得できること', () => {
  // Given
  clearAppMainScrollOffsets()

  // When
  saveAppMainScrollOffset('/songs', 1280)
  saveAppMainScrollOffset('/songs/worldsend', 240)

  // Then
  assert.equal(getAppMainScrollOffset('/songs'), 1280)
  assert.equal(getAppMainScrollOffset('/songs/worldsend'), 240)
  assert.equal(getAppMainScrollOffset('/users'), undefined)
})

test('メインスクロール要素がある場合は現在位置を返すこと', () => {
  // Given
  const originalDocument = globalThis.document
  const scrollTarget = { scrollTop: 640 }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { getElementById: () => scrollTarget },
  })

  try {
    // When
    const scrollTop = getAppMainScrollTop()

    // Then
    assert.equal(scrollTop, 640)
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: originalDocument,
    })
  }
})

test('保存済み位置へメインスクロール要素を復元すること', () => {
  // Given
  const originalDocument = globalThis.document
  let scrollOptions: ScrollToOptions | undefined
  const scrollTarget = {
    scrollTop: 0,
    scrollTo: (options: ScrollToOptions) => {
      scrollOptions = options
      scrollTarget.scrollTop = options.top ?? 0
    },
  }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { getElementById: () => scrollTarget },
  })

  try {
    // When
    restoreAppMainScrollOffset(960)

    // Then
    assert.deepEqual(scrollOptions, { top: 960, behavior: 'auto' })
    assert.equal(scrollTarget.scrollTop, 960)
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: originalDocument,
    })
  }
})

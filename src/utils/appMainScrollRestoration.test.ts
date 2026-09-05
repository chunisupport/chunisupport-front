import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearAppMainScrollOffsets,
  getAppMainScrollOffset,
  getAppMainScrollTop,
  restoreAppMainScrollOffset,
  saveAppMainScrollOffset,
} from './appMainScrollRestoration'

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

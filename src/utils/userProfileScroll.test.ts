import assert from 'node:assert/strict'
import test from 'node:test'
import { scrollToUserProfileContent } from './userProfileScroll'

test('プロフィール画面を下へスクロールしている場合は画面先頭へ戻す', () => {
  // Given
  const originalDocument = globalThis.document
  let scrollOptions: ScrollToOptions | undefined
  const scrollTarget = {
    scrollTop: 500,
    scrollTo: (options: ScrollToOptions) => {
      scrollOptions = options
    },
  }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { getElementById: (id: string) => (id === 'app-main' ? scrollTarget : null) },
  })

  try {
    // When
    scrollToUserProfileContent()

    // Then
    assert.deepEqual(scrollOptions, { top: 0, behavior: 'auto' })
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: originalDocument,
    })
  }
})

test('スクロール位置が先頭の場合はスクロールしないこと', () => {
  // Given
  const originalDocument = globalThis.document
  let called = false
  const scrollTarget = {
    scrollTop: 0,
    scrollTo: () => {
      called = true
    },
  }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { getElementById: (id: string) => (id === 'app-main' ? scrollTarget : null) },
  })

  try {
    // When
    scrollToUserProfileContent()

    // Then
    assert.equal(called, false)
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: originalDocument,
    })
  }
})

test('スクロール対象が存在しない場合は何もしないこと', () => {
  // Given
  const originalDocument = globalThis.document
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { getElementById: () => null },
  })

  try {
    // When & Then
    assert.doesNotThrow(() => scrollToUserProfileContent())
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: originalDocument,
    })
  }
})

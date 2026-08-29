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
    value: { getElementById: () => scrollTarget },
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

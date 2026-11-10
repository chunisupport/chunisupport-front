import assert from 'node:assert/strict'
import test from 'node:test'
import {
  RATING_IMAGE_V2_OPTIONS_OPEN_DEFAULT,
  RATING_IMAGE_V2_OPTIONS_OPEN_STORAGE_KEY,
  readRatingImageV2OptionsOpen,
  saveRatingImageV2OptionsOpen,
} from './ratingImageV2OptionsStorage'

/**
 * テスト中だけ window.localStorage を差し替える。
 *
 * @param localStorage - 差し込む localStorage 相当オブジェクト。
 * @param run - 差し替え中に実行する処理。
 * @returns なし。
 */
const withMockedLocalStorage = (
  localStorage: { getItem?: () => string | null; setItem?: (key: string, value: string) => void },
  run: () => void
): void => {
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
  })

  try {
    run()
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
}

test('保存済みの開閉状態を読み取ること', () => {
  // Given: 折りたたみ済みの値が保存されている。
  withMockedLocalStorage(
    {
      getItem: () => 'false',
    },
    () => {
      // When: 開閉状態を読み取る。
      const result = readRatingImageV2OptionsOpen()

      // Then: 閉じた状態になる。
      assert.equal(result, false)
    }
  )
})

test('未設定や不正値は既定の開いた状態を返すこと', () => {
  // Given: 未設定と不正値。
  for (const stored of [null, 'yes']) {
    withMockedLocalStorage(
      {
        getItem: () => stored,
      },
      () => {
        // When: 開閉状態を読み取る。
        const result = readRatingImageV2OptionsOpen()

        // Then: 既定値になる。
        assert.equal(result, RATING_IMAGE_V2_OPTIONS_OPEN_DEFAULT)
        assert.equal(result, true)
      }
    )
  }
})

test('localStorageを読み取れない場合は既定値を返すこと', () => {
  // Given: 読み取りが失敗する。
  withMockedLocalStorage(
    {
      getItem: () => {
        throw new Error('blocked')
      },
    },
    () => {
      // When: 開閉状態を読み取る。
      const result = readRatingImageV2OptionsOpen()

      // Then: 例外を投げず既定値になる。
      assert.equal(result, RATING_IMAGE_V2_OPTIONS_OPEN_DEFAULT)
    }
  )
})

test('開閉状態をlocalStorageへ保存すること', () => {
  // Given: 保存先を記録できる localStorage。
  const stored = new Map<string, string>()

  withMockedLocalStorage(
    {
      setItem: (key, value) => {
        stored.set(key, value)
      },
    },
    () => {
      // When: 閉じた状態を保存する。
      saveRatingImageV2OptionsOpen(false)

      // Then: 所定キーへ文字列で保存される。
      assert.equal(stored.get(RATING_IMAGE_V2_OPTIONS_OPEN_STORAGE_KEY), 'false')
    }
  )
})

test('localStorageへ保存できない場合でも例外を投げないこと', () => {
  // Given: 保存が失敗する。
  withMockedLocalStorage(
    {
      setItem: () => {
        throw new Error('blocked')
      },
    },
    () => {
      // When / Then: 例外を投げない。
      assert.doesNotThrow(() => saveRatingImageV2OptionsOpen(true))
    }
  )
})
